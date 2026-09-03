import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Cog, Wrench, Layers } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface PartNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const PartNode: React.FC<PartNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Peça / Componente');

  const partNumber = node.data.partNumber || 'PN-4402-A';
  const material = node.data.material || 'Aço Liga SAE 4340';
  const dimensions = node.data.dimensions || 'Ø 120mm x 45mm';
  const partStock = node.data.partStock ?? 120;
  const supplier = node.data.supplier || 'Metalúrgica Precision';

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`part-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/90 border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Cog className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              PEÇA / COMPONENTE
            </span>
          </div>

          <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-cyan-300 border border-white/5 font-semibold">
            {partNumber}
          </span>
        </div>

        {/* Editable Title */}
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
            className="bg-slate-900 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-cyan-300 transition-colors"
            title="Clique para editar o nome da peça"
          >
            {node.name}
          </h3>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2 font-mono">
          <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">{material}</span>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-cyan-400 font-bold leading-none">Rastreio de Componente</span>
            <span className="text-[10px] font-mono text-cyan-100 font-bold">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] text-cyan-300 font-medium">Monitorado</span>
          </div>
        </div>

        {/* Part Specs */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">DIMENSÕES</span>
            <span className="text-slate-200 font-semibold truncate block">{dimensions}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">ESTOQUE</span>
            <span className="text-emerald-400 font-bold">{partStock} peças</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate">Fornecedor: {supplier}</span>
        <Wrench className="w-3 h-3 text-cyan-400 shrink-0" />
      </div>
    </div>
  );
};
