import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Wrench, Layers } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface CustomNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const CustomNode: React.FC<CustomNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Objeto Personalizado');

  const customDesc = node.data?.description || 'Objeto configurado com ferramentas específicas';
  const attributes = node.data?.attributes || [
    { label: 'Setor', value: 'Engenharia' },
    { label: 'Prioridade', value: 'Alta' },
    { label: 'Versão', value: 'v1.0' },
  ];

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`custom-node-${node.id}`}
      className="p-4 bg-[#1A2235]/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between h-full w-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              CUSTOMIZADO
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              Ativo
            </span>
          </div>
        </div>

        {/* Title & Description */}
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
            className="bg-slate-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-base text-white leading-snug mb-1 cursor-pointer hover:underline hover:text-amber-300 transition-colors"
            title="Clique para editar o título"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-400 mb-2">
          {customDesc}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-3" />

        {/* Dynamic Attributes Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/50 rounded-lg border border-white/5 text-[10px]">
          {attributes.map((attr: { label: string; value: string }, idx: number) => (
            <div key={idx}>
              <span className="text-slate-500 uppercase font-bold text-[9px] block">
                {attr.label}
              </span>
              <span className="text-slate-200 font-medium truncate block">
                {attr.value}
              </span>
            </div>
          ))}
        </div>

        {/* Hierarchical Structure (BOM) */}
        {node.data.components && node.data.components.length > 0 && (
          <div className="mt-3 p-2 bg-slate-900/60 rounded-lg border border-amber-500/10">
            <div className="flex items-center gap-1.5 mb-1.5 border-b border-white/5 pb-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subconjuntos e Peças</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1 custom-scrollbar">
              {node.data.components.map((comp, idx) => (
                <div key={idx} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-200 font-medium flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                  {comp}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
