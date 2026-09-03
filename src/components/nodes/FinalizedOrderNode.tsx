import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { CheckCircle2, PackageCheck, FileText } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface FinalizedOrderNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const FinalizedOrderNode: React.FC<FinalizedOrderNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Pedido Finalizado');

  const orderCode = node.data?.orderCode || node.data?.salesOrderNumber || 'PED-8492';
  const customerName = node.data?.customerName || 'Empresa Metalúrgica Alpha S/A';

  const isWithoutValue = Boolean(
    node.data?.withoutValue ||
    node.data?.descriptiveOnly ||
    (node.data?.orderValue === 0 && !node.data?.totalOrderValue)
  );

  const orderValue = isWithoutValue ? 0 : (node.data?.totalOrderValue ?? node.data?.orderValue ?? 345000);

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(orderValue);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`finalized-order-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-slate-900/95 border-2 border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between h-full w-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                PEDIDO FINALIZADO
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {orderCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              CONCLUÍDO
            </span>
          </div>
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
            className="bg-slate-950 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-2"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-base text-white mb-2 leading-snug cursor-pointer hover:underline hover:text-emerald-300 transition-colors"
            title="Clique para editar o título"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-400 mb-2 font-mono">
          Cliente: {customerName}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-3" />

        {isWithoutValue ? (
          <div className="p-2 bg-slate-950/70 border border-emerald-500/30 rounded-lg text-left shadow-sm mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Pedido Informativo (Sem Valor)</span>
            </div>
            {node.data?.descriptiveNotes && (
              <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2 italic">
                "{node.data.descriptiveNotes}"
              </p>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-emerald-400 font-mono mb-1">
            {formattedValue}
          </div>
        )}
      </div>
    </div>
  );
};
