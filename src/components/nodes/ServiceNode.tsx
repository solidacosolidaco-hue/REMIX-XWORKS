import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Wrench, Clock, DollarSign } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface ServiceNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ServiceNode: React.FC<ServiceNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Serviço Técnico');

  const serviceCode = node.data.serviceCode || 'SRV-8020';
  const hourlyRate = node.data.hourlyRate ?? 180;
  const estimatedHours = node.data.estimatedHours ?? 24;
  const serviceCategory = node.data.serviceCategory || 'Usinagem & Manutenção';

  const totalCost = hourlyRate * estimatedHours;

  const formattedHourly = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(hourlyRate);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(totalCost);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`service-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-950/90 border border-purple-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              SERVIÇO TÉCNICO
            </span>
          </div>

          <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-purple-300 border border-white/5 font-semibold">
            {serviceCode}
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
            className="bg-slate-900 border border-purple-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-purple-300 transition-colors"
            title="Clique para editar o nome do serviço"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-400 mb-2 font-mono">
          Categoria: {serviceCategory}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-purple-400 font-bold leading-none">Rastreio de Serviço</span>
            <span className="text-[10px] font-mono text-purple-100 font-bold">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[9px] text-purple-300 font-medium">Sincronizado</span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">VALOR / HORA</span>
            <span className="text-purple-300 font-bold">{formattedHourly}/h</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">HORAS EST.</span>
            <span className="text-slate-200 font-bold">{estimatedHours}h</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Custo Total Estimado:</span>
        <span className="text-emerald-400 font-bold">{formattedTotal}</span>
      </div>
    </div>
  );
};
