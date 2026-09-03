import React, { useState } from 'react';
import { Settings, Clock, Layers, User } from 'lucide-react';
import { CanvasNode } from '../../types/canvas';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { NodeProgressBar } from '../common/NodeProgressBar';

interface ProductionOrderNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ProductionOrderNode: React.FC<ProductionOrderNodeProps> = ({ node, onUpdateData, onUpdateTitle }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Ordem de Produção');

  const opNumber = node.data.opNumber || `OP-${node.id.slice(0, 4).toUpperCase()}`;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div className="flex flex-col justify-between p-4 w-full h-full bg-slate-900/90 rounded-xl border border-amber-500/30 shadow-2xl backdrop-blur-md text-slate-100">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block leading-none">
                ORDEM DE PRODUÇÃO
              </span>
              <span className="text-[10px] font-mono text-slate-400">PCP / Manufatura</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-bold rounded">
            {opNumber}
          </span>
        </div>

        {/* Title */}
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
            className="bg-slate-950 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-1 leading-snug cursor-pointer hover:underline hover:text-amber-300 transition-colors"
            title="Clique para editar o título da OP"
          >
            {node.name}
          </h3>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-2">
          <div className="p-1.5 bg-slate-950/40 rounded border border-white/5">
            <span className="text-[9px] text-slate-400 block font-mono">PEDIDO REF</span>
            <span className="font-mono text-blue-400 font-bold">{node.data.refOrder || '#10254'}</span>
          </div>
          <div className="p-1.5 bg-slate-950/40 rounded border border-white/5">
            <span className="text-[9px] text-slate-400 block font-mono">PRIORIDADE</span>
            <span className={`text-[10px] font-bold ${
              node.data.priority === 'High' ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {node.data.priority || 'Normal'}
            </span>
          </div>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Progresso de Produção */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1 text-slate-300">
          <User className="w-3 h-3 text-amber-400" />
          <span>{node.assignee || 'Carlos Eduardo'}</span>
        </div>
        <span className="text-slate-500">Chão de Fábrica</span>
      </div>
    </div>
  );
};
