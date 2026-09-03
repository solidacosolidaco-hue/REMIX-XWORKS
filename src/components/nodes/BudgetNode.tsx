import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Calculator, Calendar, Clock, ArrowRight, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface BudgetNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  onConvertToOrder?: (budgetId: string) => void;
}

export const BudgetNode: React.FC<BudgetNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
  onConvertToOrder,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Orçamento Comercial');
  const [customerInput, setCustomerInput] = useState(node.data.customerName || 'Cliente em Prospecção');
  const [valueInput, setValueInput] = useState(node.data.orderValue || node.data.totalOrderValue || 120000);
  const [validUntilInput, setValidUntilInput] = useState(node.data.validUntil || '2026-09-25');
  const [paymentConditionInput, setPaymentConditionInput] = useState(node.data.paymentConditions || '30 DDL');

  const budgetNumberBadge = node.data.budgetNumber || node.data.orderCode || 'ORC-2026-001';
  const customerName = node.data.customerName || 'Cliente em Prospecção';
  const budgetValue = node.data.totalOrderValue || node.data.orderValue || 120000;
  const validUntil = node.data.validUntil || '2026-09-25';
  const commercialStatus = node.data.commercialStatus || 'Orçamento em Elaboração';
  const isConverted = Boolean(node.data.salesOrderNumber || node.data.convertedToOrderId);

  const itemsList =
    node.data.orderItems && node.data.orderItems.length > 0
      ? node.data.orderItems.map((i) => `${i.quantity}x ${i.description}`)
      : node.data.itemsList || [
          'Estrutura e componentes principais',
          'Montagem técnica e testes em fábrica',
        ];

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(budgetValue);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const handleDetailsSubmit = () => {
    setIsEditingDetails(false);
    if (onUpdateData) {
      onUpdateData(node.id, {
        customerName: customerInput,
        orderValue: Number(valueInput),
        totalOrderValue: Number(valueInput),
        validUntil: validUntilInput,
        paymentConditions: paymentConditionInput,
      });
    }
  };

  // Calcular dias de validade restantes
  const today = new Date('2026-09-02');
  const validDate = new Date(validUntil);
  const diffTime = validDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const theme = getNodeColorTheme(node.color || 'amber');

  return (
    <div
      id={`budget-node-${node.id}`}
      className={`p-4 bg-gradient-to-br from-amber-950/40 via-slate-900/95 to-slate-950 border border-amber-500/40 hover:border-amber-400/70 rounded-xl shadow-2xl shadow-amber-950/30 backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full transition-all`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditingDetails) setIsEditingDetails(true);
        }}
        className="cursor-pointer"
      >
        {/* Header Exclusivo de Orçamento */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block leading-tight">
                QUADRO DE ORÇAMENTO
              </span>
              <span className="text-[8px] font-mono text-amber-200/60 uppercase">
                Proposta Comercial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold font-mono">
              #{budgetNumberBadge}
            </span>
          </div>
        </div>

        {/* Title & Customer */}
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
            className="bg-slate-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-200 font-semibold focus:outline-none w-full mb-1 font-mono"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-amber-300 transition-colors"
            title="Clique para editar o título do orçamento"
          >
            {node.name}
          </h3>
        )}

        {isEditingDetails ? (
          <div
            className="space-y-2 mb-3 bg-slate-950/90 p-3 rounded-lg border border-amber-500/40 shadow-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-amber-400 font-bold">Cliente Orçado</label>
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-amber-500 outline-none"
                placeholder="Nome do Cliente / Prospecção"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-amber-400 font-bold">Valor Proposto (R$)</label>
              <input
                type="number"
                value={valueInput}
                onChange={(e) => setValueInput(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-amber-400 font-bold">Validade da Proposta</label>
              <input
                type="date"
                value={validUntilInput}
                onChange={(e) => setValidUntilInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-amber-400 font-bold">Condições Comerciais</label>
              <input
                type="text"
                value={paymentConditionInput}
                onChange={(e) => setPaymentConditionInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-amber-500 outline-none"
                placeholder="Ex: 30 DDL, Frete CIF"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailsSubmit();
                }}
                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider transition-colors"
              >
                Salvar Orçamento
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDetails(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-1.5 font-mono">
              Cliente: <span className="text-amber-200/90 font-semibold">{customerName}</span>
            </p>

            {/* Valor do Orçamento em Destaque Âmbar */}
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-xl font-black text-amber-300 font-mono tracking-tight">
                {formattedValue}
              </div>
              <span className="text-[9px] font-mono text-amber-400/70 uppercase">
                (Valor Proposto)
              </span>
            </div>
          </>
        )}

        {/* Box de Validade da Proposta Comercial */}
        <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[8px] uppercase tracking-wider text-amber-400/80 font-bold block leading-none">
                Validade da Cotação
              </span>
              <span className="text-[10px] font-mono text-slate-200 font-bold">
                Até {validUntil.split('-').reverse().join('/')}
              </span>
            </div>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
              diffDays > 5
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : diffDays >= 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {diffDays >= 0 ? `${diffDays}d restantes` : 'Expirado'}
          </span>
        </div>

        {/* Prazo e Cronograma */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />
      </div>

      <div className="flex-1 flex flex-col justify-end">
        {/* Rastreio Ativo do Orçamento */}
        <div className="mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-amber-400 font-bold leading-none">
              Rastreio da Proposta
            </span>
            <span className="text-[10px] font-mono text-amber-100 font-bold">
              #TRK-ORC-{node.id.slice(0, 5).toUpperCase()}
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            {commercialStatus}
          </span>
        </div>

        {/* Itens Orçados */}
        <div className="space-y-1 my-1.5">
          <div className="text-[9px] font-mono text-amber-400/80 uppercase font-semibold flex items-center justify-between">
            <span>Itens Orçados</span>
            <span className="text-[8px] text-slate-500">{itemsList.length} item(ns)</span>
          </div>
          {itemsList.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/60 p-1.5 rounded border border-amber-500/15"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        {/* Ação de Conversão Direta: Orçamento -> Pedido de Venda */}
        <div className="my-1 space-y-1">
          {isConverted ? (
            <div className="w-full py-1.5 px-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Aprovado & Convertido</span>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateData?.(node.id, { commercialStatus: 'Validado', status: 'Aprovado' });
                }}
                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded transition-all"
              >
                Validado
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateData?.(node.id, { commercialStatus: 'Negado', status: 'Cancelado' });
                }}
                className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] uppercase rounded transition-all"
              >
                Negado
              </button>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateData?.(node.id, { commercialStatus: 'Aguardando Formalização', status: 'Em Andamento' });
            }}
            className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] uppercase rounded transition-all"
          >
            Aguardando Formalização
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition-colors py-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDetails(true);
            }}
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Cond: {node.data.paymentConditions || '30 DDL'}</span>
          </div>
          <div
            className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-slate-950 font-black shadow-lg"
            title={`Vendedor: ${node.assignee || 'Carlos'}`}
          >
            {node.assignee ? node.assignee[0] : 'C'}
          </div>
        </div>
      </div>
    </div>
  );
};
