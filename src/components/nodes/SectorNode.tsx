import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Factory, Cpu, Users, FileText } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface SectorNodeProps {
  node: CanvasNode;
  allNodes?: CanvasNode[];
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  onOpenReport?: (nodeId: string) => void;
}

export const SectorNode: React.FC<SectorNodeProps> = ({
  node,
  allNodes,
  onUpdateData,
  onUpdateTitle,
  onOpenReport,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Setor Industrial');

  const sectorCode = node.data.sectorCode || 'ST-USINAGEM-01';
  const sectorCapacity = node.data.sectorCapacity || '85% Utilização';
  const activeWorkers = node.data.activeWorkers ?? 18;
  const activeMachineCount = node.data.activeMachineCount ?? 8;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`sector-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-slate-950/80 via-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              SETOR
            </span>
          </div>

          <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-emerald-300 border border-white/5 font-semibold">
            {sectorCode}
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
            className="bg-slate-900 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-emerald-300 transition-colors"
            title="Clique para editar o nome do setor"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-400 mb-2 font-mono">
          Capacidade: {sectorCapacity}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} allNodes={allNodes} onUpdateData={onUpdateData} className="mb-2" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono mb-2">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">OPERADORES</span>
            <div className="flex items-center gap-1 text-slate-200 font-bold">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>{activeWorkers} ativos</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">MAQUINÁRIO</span>
            <div className="flex items-center gap-1 text-slate-200 font-bold">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>{activeMachineCount} máquinas</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenReport) onOpenReport(node.id);
          }}
          className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
        >
          <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Emitir Relatório de Status
        </button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Status Operacional:</span>
        <span className="text-emerald-400 font-bold">100% Ativo</span>
      </div>
    </div>
  );
};
