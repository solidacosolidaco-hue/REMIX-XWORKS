import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { ShoppingCart, Calendar, FileText, Info, Eye, EyeOff } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface OrderNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const OrderNode: React.FC<OrderNodeProps> = ({ node, onUpdateData, onUpdateTitle }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isPeekingValue, setIsPeekingValue] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Pedido');
  const [customerInput, setCustomerInput] = useState(node.data.customerName || 'Empresa ABC S/A');

  const isWithoutValue = Boolean(
    node.data.withoutValue ||
    node.data.descriptiveOnly ||
    (node.data.orderValue === 0 && !node.data.totalOrderValue)
  );
  const isHideValueOnly = Boolean(node.data.hideValueOnly || node.data.hideValue);

  const [isWithoutValueInput, setIsWithoutValueInput] = useState(isWithoutValue);
  const [isHideValueOnlyInput, setIsHideValueOnlyInput] = useState(isHideValueOnly);
  const [descriptiveNotesInput, setDescriptiveNotesInput] = useState(node.data.descriptiveNotes || '');
  const [valueInput, setValueInput] = useState(node.data.orderValue ?? 250000);
  const [dateInput, setDateInput] = useState(node.data.deliveryDeadline || '2026-09-20');

  const orderNumberBadge = node.data.salesOrderNumber || node.data.orderCode || '#10254';
  const customerName = node.data.customerName || 'Empresa ABC S/A';
  const orderValue = isWithoutValue ? 0 : (node.data.totalOrderValue ?? node.data.orderValue ?? 120000);
  const deliveryDeadline = node.data.deliveryDeadline || '2026-10-30';
  const itemsList = node.data.orderItems && node.data.orderItems.length > 0
    ? node.data.orderItems.map((i) => `${i.quantity}x ${i.description}`)
    : (node.data.itemsList || [
        'Estrutura e componentes principais',
        'Montagem técnica',
      ]);

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

  const handleDetailsSubmit = () => {
    setIsEditingDetails(false);
    if (onUpdateData) {
      onUpdateData(node.id, {
        customerName: customerInput,
        withoutValue: isWithoutValueInput,
        descriptiveOnly: isWithoutValueInput,
        hideValueOnly: isHideValueOnlyInput,
        hideValue: isHideValueOnlyInput,
        orderValue: isWithoutValueInput ? 0 : Number(valueInput),
        totalOrderValue: isWithoutValueInput ? 0 : Number(valueInput),
        descriptiveNotes: descriptiveNotesInput,
        deliveryDeadline: dateInput,
      });
    }
  };

  const theme = getNodeColorTheme(node.color);

  return (
    <div
      id={`order-node-${node.id}`}
      className={`p-4 bg-gradient-to-br ${theme.bgGradient} border ${theme.borderNormal} rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full`}
    >
      <div onClick={(e) => { e.stopPropagation(); if (!isEditingDetails) setIsEditingDetails(true); }} className="cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg ${theme.iconBg} ${theme.iconText} border ${theme.iconBorder}`}>
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textAccent}`}>
              PEDIDO DE VENDA
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {node.data.budgetNumber && (
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[9px] font-mono" title={`Orçamento de Origem: ${node.data.budgetNumber}`}>
                Origem: {node.data.budgetNumber}
              </span>
            )}
            <span className={`px-2 py-0.5 ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} rounded text-[9px] font-bold font-mono`}>
              {orderNumberBadge}
            </span>
          </div>
        </div>

        {/* Order Title & Customer */}
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
            className="bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-blue-300 transition-colors"
            title="Clique para editar o título do pedido"
          >
            {node.name}
          </h3>
        )}

        {isEditingDetails ? (
          <div className="space-y-2 mb-3 bg-slate-950/90 p-3 rounded-lg border border-blue-500/40 shadow-inner text-left" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold">Cliente</label>
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-blue-500 outline-none"
                placeholder="Nome do Cliente"
              />
            </div>

            {/* Checkbox Sem Valor e Ocultar Valor */}
            <div className="p-2 bg-slate-900/80 rounded border border-slate-700/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-sky-300">
                <input
                  type="checkbox"
                  checked={isWithoutValueInput}
                  onChange={(e) => setIsWithoutValueInput(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-600 text-sky-500 focus:ring-0 cursor-pointer"
                />
                <span>Pedido sem valor (apenas dados descritivos)</span>
              </label>

              {isWithoutValueInput ? (
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-sky-400" />
                    Dados e Informações Descritivas
                  </label>
                  <textarea
                    rows={2}
                    value={descriptiveNotesInput}
                    onChange={(e) => setDescriptiveNotesInput(e.target.value)}
                    placeholder="Descreva o escopo, especificações técnicas ou informações deste pedido..."
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-sky-500 outline-none placeholder:text-slate-500 font-sans"
                  />
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Modo descritivo ativado: o pedido será mantido sem valor monetário, apenas com escopo e dados informativos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold">Valor (R$)</label>
                    <input
                      type="number"
                      value={valueInput}
                      onChange={(e) => setValueInput(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-blue-500 outline-none font-mono"
                    />
                  </div>

                  {/* OPÇÃO: OCULTAR O VALOR APENAS */}
                  <div className="pt-1.5 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={isHideValueOnlyInput}
                        onChange={(e) => setIsHideValueOnlyInput(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-600 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Ocultar o valor apenas</span>
                    </label>
                    <p className="text-[9px] text-slate-400 leading-tight pl-5 mt-0.5">
                      Mantém o valor salvo nos relatórios e cálculos, mas oculta a visualização no quadro (••••••).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold">Data de Entrega</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDetailsSubmit(); }} 
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
              >
                SALVAR ALTERAÇÕES
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditingDetails(false); }} 
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-1 font-mono">
              Cliente: {customerName}
            </p>

            {/* Value or Descriptive Information omitted per user request */}
          </>
        )}

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />
      </div>

      <div className="flex-1 flex flex-col justify-end">
        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-blue-400 font-bold leading-none">Rastreio Ativo</span>
            <span className="text-[10px] font-mono text-blue-100 font-bold">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] text-blue-300 font-medium">Sincronizado</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-1 my-2">
          {itemsList.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/40 p-1.5 rounded border border-white/5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:text-blue-300 transition-colors py-1 group"
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsEditingDetails(true); 
            }}
          >
            <Calendar className="w-3 h-3 text-white group-hover:text-cyan-300 transition-colors" />
            <span className="group-hover:underline">Entrega: {deliveryDeadline.split('-').reverse().join('/')}</span>
          </div>
          <div
            className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-slate-950 font-bold shadow-lg"
            title={`Responsável: ${node.assignee || 'Carlos'}`}
          >
            {node.assignee ? node.assignee[0] : 'C'}
          </div>
        </div>
      </div>
    </div>
  );
};
