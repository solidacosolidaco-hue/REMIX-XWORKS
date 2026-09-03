import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface DeadlineNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const DeadlineNode: React.FC<DeadlineNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Prazo / Cronômetro');

  const dueDateStr = node.data.dueDate || '2026-09-15';
  const today = new Date(2026, 8, 1);
  const dueParts = dueDateStr.split('-');
  let daysRemaining = 14;
  let isOverdue = false;
  let isWarning = false;

  if (dueParts.length === 3) {
    const dueDate = new Date(parseInt(dueParts[0]), parseInt(dueParts[1]) - 1, parseInt(dueParts[2]));
    const diffTime = dueDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isOverdue = daysRemaining < 0;
    isWarning = daysRemaining >= 0 && daysRemaining <= 3;
  }

  const theme = getNodeColorTheme(node.color);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const getStatusBadge = () => {
    if (isOverdue) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-2 py-0.5 rounded-full animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          ATRASADO
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          ALERTA ({daysRemaining}d)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        NO PRAZO
      </span>
    );
  };

  return (
    <div
      id={`deadline-node-${node.id}`}
      className={`p-4 rounded-xl border backdrop-blur-md shadow-xl text-slate-100 flex flex-col justify-between w-full h-full ${
        isOverdue
          ? 'bg-rose-950/30 border-rose-500/50'
          : isWarning
          ? 'bg-amber-950/30 border-amber-500/50'
          : `bg-gradient-to-br ${theme.bgGradient} ${theme.borderNormal}`
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`p-1.5 rounded-lg border shrink-0 ${
                isOverdue
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : isWarning
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : `${theme.iconBg} ${theme.iconText} ${theme.iconBorder}`
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${theme.textAccent} block`}>
                CRONÔMETRO / PRAZO
              </span>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                  }}
                  className="bg-slate-950 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-sm text-slate-100 leading-tight truncate cursor-pointer hover:underline hover:text-amber-300 transition-colors"
                  title="Clique para editar o título do prazo"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>

          <div className="shrink-0 ml-2">{getStatusBadge()}</div>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-amber-500 font-bold leading-none">Rastreio de Prazo</span>
            <span className="text-[10px] font-mono text-amber-100 font-bold">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-400'}`} />
            <span className="text-[9px] text-amber-300 font-medium">{isOverdue ? 'Alerta Crítico' : 'Em Monitoramento'}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-slate-950/40 rounded-lg border border-white/5 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 block text-[9px]">DATA LIMITE</span>
            <span className="text-slate-200 font-bold">{dueDateStr.split('-').reverse().join('/')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">DIAS RESTANTES</span>
            <span className={`font-bold ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
              {daysRemaining} dias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
