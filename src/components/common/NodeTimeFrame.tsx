import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Calendar, Flag, Clock, Edit3, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NodeTimeFrameProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  className?: string;
  compact?: boolean;
  simulatedDate?: string;
}

export const NodeTimeFrame: React.FC<NodeTimeFrameProps> = ({
  node,
  onUpdateData,
  className = '',
  compact = false,
  simulatedDate = '2026-09-02',
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Normalize start date (default to 2026-09-01 or node createdAt)
  const defaultStartDate = '2026-09-01';
  const rawStartDate = node.data.startDate || (node.createdAt && node.createdAt.includes('-') ? node.createdAt.slice(0, 10) : defaultStartDate);
  const startDateStr = rawStartDate.includes('/') ? rawStartDate.split('/').reverse().join('-') : rawStartDate;

  // Normalize due date / deadline (default to 2026-09-20)
  const defaultDeadline = '2026-09-20';
  const rawDeadline = node.data.deliveryDeadline || node.data.dueDate || node.data.deadline || defaultDeadline;
  const deadlineStr = rawDeadline.includes('/') ? rawDeadline.split('/').reverse().join('-') : rawDeadline;

  const [inputStart, setInputStart] = useState(startDateStr);
  const [inputDeadline, setInputDeadline] = useState(deadlineStr);

  // Parse dates for calculation
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
  const totalDays = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));
  
  const remainingTimeMs = endObj.getTime() - currentObj.getTime();
  const daysRemaining = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));

  const timeElapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  const isFinished = node.status === 'Concluído' || (node.status as string) === 'Entregue' || (node.data.projectProgress ?? node.data.orderProgress ?? node.data.progressPercent ?? 0) >= 100;
  const isOverdue = !isFinished && daysRemaining < 0;
  const isWarning = !isFinished && daysRemaining >= 0 && daysRemaining <= 3;

  const formatDisplayDate = (dStr: string) => {
    const p = dStr.split('-');
    if (p.length === 3) {
      return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return dStr;
  };

  const handleSaveDates = () => {
    setIsEditing(false);
    if (!onUpdateData) return;

    onUpdateData(node.id, {
      startDate: inputStart,
      deliveryDeadline: inputDeadline,
      dueDate: inputDeadline,
      deadline: inputDeadline,
    });
  };

  if (isEditing) {
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        className="p-2.5 bg-slate-950/95 border border-blue-500/50 rounded-lg shadow-xl text-xs space-y-2 my-1 z-30"
      >
        <div className="flex items-center justify-between pb-1 border-b border-white/10 text-slate-300 font-bold text-[10px] uppercase font-mono">
          <span className="flex items-center gap-1 text-blue-400">
            <Clock className="w-3 h-3" />
            Configurar Cronograma do Quadro
          </span>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 text-white" />
              Prazo Inicial
            </label>
            <input
              type="date"
              value={inputStart}
              onChange={(e) => setInputStart(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-mono text-slate-400 mb-0.5 flex items-center gap-1">
              <Flag className="w-2.5 h-2.5 text-emerald-400" />
              Prazo Final
            </label>
            <input
              type="date"
              value={inputDeadline}
              onChange={(e) => setInputDeadline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[9px] font-mono text-slate-400">
            Duração: {Math.max(1, Math.round((parseYMD(inputDeadline).getTime() - parseYMD(inputStart).getTime()) / (1000 * 60 * 60 * 24)))} dias
          </span>
          <button
            onClick={handleSaveDates}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" />
            Salvar Prazos
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onUpdateData) setIsEditing(true);
        }}
        className={`flex items-center justify-between gap-1.5 px-2 py-1 bg-slate-950/60 border rounded-md text-[10px] font-mono cursor-pointer transition-all hover:border-blue-500/50 ${
          isOverdue ? 'border-rose-500/40 text-rose-300' : isWarning ? 'border-amber-500/40 text-amber-300' : 'border-white/5 text-slate-300'
        } ${className}`}
        title="Clique para alterar Prazo Inicial e Prazo Final"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5 text-white" />
            {formatDisplayDate(startDateStr)}
          </span>
          <span className="text-slate-500">➔</span>
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
            <Flag className="w-2.5 h-2.5 text-emerald-400" />
            {formatDisplayDate(deadlineStr)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
            isFinished
              ? 'bg-emerald-500/20 text-emerald-300'
              : isOverdue
              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-blue-500/20 text-blue-300'
          }`}>
            {isFinished ? 'Concluído' : isOverdue ? `${Math.abs(daysRemaining)}d Atraso` : `${daysRemaining}d rest.`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onUpdateData) setIsEditing(true);
      }}
      className={`p-2 bg-slate-950/70 border rounded-lg text-xs font-mono select-none cursor-pointer transition-all hover:border-blue-500/40 ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-950/20'
          : isWarning
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-white/5'
      } ${className}`}
      title="Clique para editar Prazo Inicial e Prazo Final deste quadro"
    >
      {/* Top line: Header with badges */}
      <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>Cronograma do Quadro</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-1 ${
              isFinished
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isOverdue
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {isFinished ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5" />
                Concluído
              </>
            ) : isOverdue ? (
              <>
                <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                Atrasado ({Math.abs(daysRemaining)}d)
              </>
            ) : isWarning ? (
              <>
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                Alerta ({daysRemaining}d)
              </>
            ) : (
              `${daysRemaining}d restantes`
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-0.5 text-slate-500 hover:text-blue-400 transition-colors"
            title="Editar prazos"
          >
            <Edit3 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Dates Grid: Prazo Inicial vs Prazo Final */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-900/80 p-1.5 rounded border border-white/5">
          <div className="flex items-center gap-1 text-[8px] text-slate-400 uppercase font-bold tracking-tighter">
            <Calendar className="w-2.5 h-2.5 text-white" />
            <span>Prazo Inicial</span>
          </div>
          <span className="font-bold text-slate-200 mt-0.5 block">
            {formatDisplayDate(startDateStr)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded border border-white/5">
          <div className="flex items-center gap-1 text-[8px] text-slate-400 uppercase font-bold tracking-tighter">
            <Flag className="w-2.5 h-2.5 text-emerald-400" />
            <span>Prazo Final</span>
          </div>
          <span className={`font-bold mt-0.5 block ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatDisplayDate(deadlineStr)}
          </span>
        </div>
      </div>

      {/* Mini Time Progress Bar */}
      <div className="mt-1.5 pt-1 flex items-center justify-between text-[9px] text-slate-400">
        <span>Tempo decorrido: {timeElapsedPercent}%</span>
        <span>Duração: {totalDays} dias</span>
      </div>
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
        <div
          className={`h-full transition-all duration-300 ${
            isFinished
              ? 'bg-emerald-400'
              : isOverdue
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-400'
              : 'bg-blue-400'
          }`}
          style={{ width: `${isFinished ? 100 : timeElapsedPercent}%` }}
        />
      </div>
    </div>
  );
};
