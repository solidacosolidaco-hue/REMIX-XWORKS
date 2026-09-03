import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { calculateNodeProgress, getNodeProgressColor } from '../../utils/nodeProgress';
import { Gauge, Sliders, RefreshCw, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCanvasContext } from '../../context/CanvasContext';

interface NodeProgressBarProps {
  node: CanvasNode;
  allNodes?: CanvasNode[];
  connections?: Array<{ fromId: string; toId: string }>;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  showControls?: boolean;
  className?: string;
  compact?: boolean;
  simulatedDate?: string;
}

export const NodeProgressBar: React.FC<NodeProgressBarProps> = ({
  node,
  allNodes,
  connections,
  onUpdateData,
  showControls = true,
  className = '',
  compact = false,
  simulatedDate = '2026-09-02',
}) => {
  const canvasCtx = useCanvasContext();
  const effectiveAllNodes = allNodes || canvasCtx?.nodes;
  const effectiveConnections = connections || canvasCtx?.connections;

  const [showSlider, setShowSlider] = useState(false);
  const progressPercent = calculateNodeProgress(node, effectiveAllNodes, effectiveConnections);
  const colors = getNodeProgressColor(progressPercent);
  const isOverridden = typeof node.data.progressPercent === 'number';

  // Removida a verificação de bloqueio em 99% por dependência
  let isBlockedByDependency = false;

  // Normalização de Datas para Cálculo de Progresso Temporal
  const defaultStartDate = '2026-09-01';
  const rawStartDate = node.data.startDate || (node.createdAt && node.createdAt.includes('-') ? node.createdAt.slice(0, 10) : defaultStartDate);
  const startDateStr = rawStartDate.includes('/') ? rawStartDate.split('/').reverse().join('-') : rawStartDate;

  const defaultDeadline = '2026-09-20';
  const rawDeadline = node.data.dueDate || node.data.deliveryDeadline || node.data.deadline || defaultDeadline;
  const deadlineStr = rawDeadline.includes('/') ? rawDeadline.split('/').reverse().join('-') : rawDeadline;

  const parseYMD = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const startObj = parseYMD(startDateStr);
  const endObj = parseYMD(deadlineStr);
  const currentObj = parseYMD(simulatedDate);

  const totalDurationMs = Math.max(1, endObj.getTime() - startObj.getTime());
  const elapsedMs = currentObj.getTime() - startObj.getTime();
  const daysRemaining = Math.ceil((endObj.getTime() - currentObj.getTime()) / (1000 * 60 * 60 * 24));
  
  const timeProgressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  const isFinished = progressPercent >= 100 || node.status === 'Concluído' || (node.status as string) === 'Entregue';
  const isOverdue = !isFinished && daysRemaining < 0;
  const isWarning = !isFinished && daysRemaining >= 0 && daysRemaining <= 3;

  const handleSetProgress = (newPct: number) => {
    const clamped = Math.min(100, Math.max(0, newPct));
    const update: Partial<CanvasNode['data']> = {
      progressPercent: clamped,
      currentValue: clamped,
      orderProgress: clamped,
      projectProgress: clamped,
    };
    
    if (node.type === 'indicator') {
      update.kpiValue = `${clamped}%`;
    }

    if (node.type === 'checklist') {
      const items = node.data.items || [];
      if (items.length > 0) {
        const checkCount = Math.round((clamped / 100) * items.length);
        update.items = items.map((it: any, index: number) => ({
          ...it,
          checked: index < checkCount,
        }));
      }
    }

    if (node.type === 'attachment') {
      const attachments = node.data.attachments || [];
      if (attachments.length > 0) {
        const checkCount = Math.round((clamped / 100) * attachments.length);
        update.attachments = attachments.map((att: any, index: number) => ({
          ...att,
          checked: index < checkCount,
        }));
      }
    }

    if (node.type === 'kanban') {
      const cards = node.data.cards || [];
      if (cards.length > 0) {
        update.cards = cards.map((c: any, index: number) => {
          const ratio = (index + 0.5) / cards.length;
          const targetRatio = clamped / 100;
          let colId = 'col-todo';
          let status = 'A Fazer';
          if (clamped >= 100 || ratio <= targetRatio * 0.7) {
            colId = 'col-done';
            status = 'Concluído';
          } else if (ratio <= targetRatio * 1.3) {
            colId = 'col-in-progress';
            status = 'Em Andamento';
          }
          return {
            ...c,
            columnId: colId,
            status,
          };
        });
      }
    }

    onUpdateData?.(node.id, update);
  };

  const handleResetAuto = () => {
    if (!onUpdateData) return;
    const newData = { ...node.data };
    delete newData.progressPercent;
    onUpdateData(node.id, {
      ...newData,
      progressPercent: undefined,
      isTimerRunning: false,
    });
  };

  const handleProgressBarInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const currentTarget = e.currentTarget;

    const updateProgress = (clientX: number) => {
      const rect = currentTarget.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = Math.round((clickX / rect.width) * 100);
      handleSetProgress(pct);
    };

    updateProgress(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateProgress(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (compact) {
    return (
      <div className={`w-full flex items-center gap-2 ${className}`}>
        <div
          onMouseDown={handleProgressBarInteraction}
          className="relative flex-1 h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/10 cursor-pointer group/bar"
          title={`Execução: ${progressPercent}% | Tempo decorrido: ${timeProgressPercent}%`}
        >
          <div
            className={`h-full bg-gradient-to-r ${colors.barGradient} rounded-full transition-all duration-300`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono font-bold ${colors.textColor}`}>
          {progressPercent}%
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full select-none ${className}`}>
      {/* 1. BARRA DE PROGRESSO OPERACIONAL / EXECUÇÃO */}
      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Gauge className="w-3 h-3 text-slate-400" />
          <span className="font-semibold uppercase tracking-wider">
            {isOverridden ? 'Progresso Manual' : 'Progresso Operacional'}
          </span>
          {isOverridden && (
            <span className="text-[9px] text-amber-400 font-sans px-1 rounded bg-amber-500/10 border border-amber-500/20">
              EDIÇÃO MANUAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {showControls && isOverridden && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetAuto();
              }}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
              title="Restaurar progresso automático com base no conteúdo"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          {showControls && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSlider(!showSlider);
              }}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
              title="Ajustar Progresso Manualmente"
            >
              <Sliders className="w-3 h-3" />
            </button>
          )}

          <span className={`font-extrabold text-xs ml-1 ${colors.textColor}`}>
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Track do Progresso Operacional */}
      <div
        onMouseDown={handleProgressBarInteraction}
        className="relative w-full h-2.5 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-white/10 cursor-pointer group/bar shadow-inner mb-2.5"
        title="Clique ou arraste para definir o progresso operacional (0-100%)"
      >
        <div
          className={`h-full bg-gradient-to-r ${colors.barGradient} rounded-full transition-all duration-300`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. BARRA DE PROGRESSO TEMPORAL (BASEADO EM DATAS / PRAZOS) */}
      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span className="font-semibold uppercase tracking-wider text-indigo-300">
            Progresso Temporal (Prazos)
          </span>
        </div>

        <div className="flex items-center gap-1 font-extrabold text-xs">
          <span className={isFinished ? 'text-emerald-400' : isOverdue ? 'text-rose-400 font-bold' : 'text-indigo-400'}>
            {timeProgressPercent}%
          </span>
        </div>
      </div>

      {/* Track do Progresso Temporal */}
      <div
        className="relative w-full h-2 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-white/10 mb-1.5"
        title={`Tempo decorrido do prazo total: ${timeProgressPercent}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isFinished
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : isOverdue
              ? 'bg-gradient-to-r from-rose-600 to-amber-500 animate-pulse'
              : isWarning
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
          }`}
          style={{ width: `${isFinished ? 100 : timeProgressPercent}%` }}
        />
      </div>

      {/* Datas e seletores (Início e Fim / Prazo) */}
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-300 bg-slate-950/60 p-1.5 rounded border border-white/10">
        <div className="flex items-center gap-1 group/date">
          <Calendar className="w-2.5 h-2.5 text-white shrink-0" />
          <span className="uppercase font-bold text-slate-300">Início:</span>
          <input
            type="date"
            value={node.data.startDate || ''}
            onChange={(e) => onUpdateData?.(node.id, { startDate: e.target.value })}
            className="bg-transparent border-none text-white font-bold cursor-pointer focus:outline-none focus:text-cyan-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-1 group/date">
          <Calendar className="w-2.5 h-2.5 text-white shrink-0" />
          <span className="uppercase font-bold text-slate-300">Fim (Prazo):</span>
          <input
            type="date"
            value={node.data.dueDate || node.data.deliveryDeadline || ''}
            onChange={(e) => onUpdateData?.(node.id, { dueDate: e.target.value })}
            className="bg-transparent border-none text-white font-bold cursor-pointer focus:outline-none focus:text-cyan-300 transition-colors text-right"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Popover slider control se ativado */}
      {showSlider && (
        <div
          className="mt-2 p-2 bg-slate-950/95 border border-white/10 rounded-lg shadow-xl flex items-center gap-2 text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={(e) => handleSetProgress(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded accent-blue-400 cursor-pointer"
          />
          <span className="font-mono text-white shrink-0 font-bold">{progressPercent}%</span>
        </div>
      )}
    </div>
  );
};

