import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Calendar as CalendarIcon, Clock, ArrowUpRight } from 'lucide-react';

interface CalendarNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  onOpenCalendarModal?: () => void;
}

export const CalendarNode: React.FC<CalendarNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
  onOpenCalendarModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Calendário & Agenda');

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`calendar-node-${node.id}`}
      className="p-4 rounded-xl border border-blue-500/30 bg-slate-900/95 backdrop-blur-md shadow-xl text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-white border border-blue-500/30 shrink-0">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block">
                CALENDÁRIO EXECUTIVO
              </span>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  className="bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white w-full"
                />
              ) : (
                <h3
                  onDoubleClick={() => setIsEditingTitle(true)}
                  className="text-sm font-bold text-white truncate cursor-pointer hover:text-blue-300"
                  title="Duplo clique para renomear"
                >
                  {node.name || titleInput}
                </h3>
              )}
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="space-y-2.5">
          <div className="p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-xl">
            <div className="text-xs font-bold text-blue-300 mb-1">Próximo Prazo Destacado</div>
            <div className="text-xs text-white font-medium">Entrega do Lote Piloto de Usinagem</div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Hoje às 14:00 (Prioridade Alta)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
              <div className="text-[10px] text-slate-400">Prazos</div>
              <div className="text-sm font-bold text-blue-400 font-mono">12</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
              <div className="text-[10px] text-slate-400">Reuniões</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">5</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
              <div className="text-[10px] text-slate-400">Marcos</div>
              <div className="text-sm font-bold text-purple-400 font-mono">3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="pt-3 border-t border-white/10 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenCalendarModal) onOpenCalendarModal();
            else {
              window.dispatchEvent(new CustomEvent('open-immersive-calendar'));
            }
          }}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
        >
          <span>Abrir Agenda Imersiva</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
