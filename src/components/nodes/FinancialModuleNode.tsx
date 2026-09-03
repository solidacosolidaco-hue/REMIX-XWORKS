import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { PieChart, ShieldCheck } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface FinancialModuleNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const FinancialModuleNode: React.FC<FinancialModuleNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Módulo Financeiro');

  const grossRevenue = node.data?.grossRevenue || 450000;
  const productionCost = node.data?.productionCost || 260000;
  const taxes = node.data?.taxes || 49500;
  const netProfit = grossRevenue - productionCost - taxes;
  const fiscalCode = node.data?.fiscalCode || 'NF-e 0039281 - SP';

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`financial-module-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-slate-900/95 border-2 border-indigo-500/50 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between h-full w-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                MÓDULO FINANCEIRO
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {fiscalCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-mono font-bold text-indigo-300">
              FISCAL OK
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
            className="bg-slate-950 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-2"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-base text-white mb-2 leading-snug cursor-pointer hover:underline hover:text-indigo-300 transition-colors"
            title="Clique para editar o título financeiro"
          >
            {node.name || 'Demonstrativo Financeiro'}
          </h3>
        )}

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-3" />

        {/* Gross Revenue Hero */}
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 mb-2 flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Receita Bruta</span>
            <span className="text-base font-mono font-bold text-white">{formatCurrency(grossRevenue)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Lucro Líquido</span>
            <span className="text-base font-mono font-bold text-emerald-400">{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
