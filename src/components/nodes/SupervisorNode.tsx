import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { ShieldCheck, Users, Award } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface SupervisorNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const SupervisorNode: React.FC<SupervisorNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Encarregado de Produção');

  const supervisorId = node.data.supervisorId || 'ENC-401';
  const managedSector = node.data.managedSector || 'Caldeiraria & Solda Especializada';
  const subordinatesCount = node.data.subordinatesCount ?? 14;
  const certifications = node.data.certifications || ['NR-12', 'ISO 9001', 'Green Belt Six Sigma'];

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`supervisor-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950/90 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              ENCARREGADO / LÍDER
            </span>
          </div>

          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-bold">
            {supervisorId}
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
            className="bg-slate-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-amber-300 transition-colors"
            title="Clique para editar o nome do encarregado"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-300 font-medium mb-1 truncate">
          Setor: {managedSector}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">EQUIPE</span>
            <div className="flex items-center gap-1 text-slate-200 font-bold">
              <Users className="w-3 h-3 text-amber-400" />
              <span>{subordinatesCount} func.</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">CERTIFICAÇÕES</span>
            <div className="flex items-center gap-1 text-slate-200 font-semibold truncate">
              <Award className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{certifications.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Supervisão Operacional</span>
        <span className="text-amber-400 font-bold">Liderança OK</span>
      </div>
    </div>
  );
};
