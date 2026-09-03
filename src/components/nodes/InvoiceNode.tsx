import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Receipt, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface InvoiceNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  onOpenInvoiceModal?: (nodeId: string) => void;
}

export const InvoiceNode: React.FC<InvoiceNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
  onOpenInvoiceModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Nota Fiscal');

  const nfeNumber = node.data.invoiceNumber || 'NF-001042';
  const invoiceValue = node.data.invoiceValue || 250000;
  const issueDate = node.data.issueDate || '2026-09-01';
  const nfeKey = node.data.nfeKey || '35260904123456000189550010000010421098765432';
  const status = node.data.nfeStatus || 'Autorizada';
  const customerCnpj = node.data.customerCnpj || '12.345.678/0001-90';

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(invoiceValue);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`invoice-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-slate-950/90 border border-emerald-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              NOTA FISCAL (NF-E)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {status}
            </span>
          </div>
        </div>

        {/* Invoice Title & Number */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
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
                className="bg-slate-900 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
              />
            ) : (
              <h3
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className="font-bold text-sm text-white leading-snug cursor-pointer hover:underline hover:text-emerald-300 transition-colors"
                title="Clique para editar o nome da nota fiscal"
              >
                {node.name}
              </h3>
            )}
            <span className="text-xs font-mono text-emerald-300 font-semibold">{nfeNumber}</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 rounded text-slate-400 border border-white/5 shrink-0">
            SÉRIE 001
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-2 font-mono truncate">
          CNPJ: {customerCnpj}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Invoice Value */}
        <div className="p-2 bg-slate-950/50 rounded-lg border border-white/5 mb-2">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
            VALOR TOTAL DA NOTA
          </span>
          <div className="text-base font-bold text-emerald-400 font-mono">
            {formattedValue}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Emissão: {issueDate.split('-').reverse().join('/')}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInvoiceModal?.(node.id);
          }}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
        >
          <span>DANFE</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
