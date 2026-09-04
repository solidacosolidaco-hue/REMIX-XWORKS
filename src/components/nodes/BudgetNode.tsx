import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Calculator, Calendar, ArrowRight, CheckCircle2, DollarSign, UserCheck, Check } from 'lucide-react';

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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const budgetNumber = node.data.budgetNumber || node.data.orderCode || 'ORC-2026-001';
  const customerName = node.data.customerName || 'Cliente em Prospecção';
  const budgetValue = node.data.totalOrderValue || node.data.orderValue || 120000;
  const validUntil = node.data.validUntil || '2026-09-25';
  const paymentConditions = node.data.paymentConditions || '30 DDL';
  const isConverted = Boolean(node.data.salesOrderNumber || node.data.convertedToOrderId);
  const commercialStatus = node.data.commercialStatus || 'Em Elaboração';

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(budgetValue) || 0);

  const startEditing = (field: string, initialVal: string) => {
    setEditingField(field);
    setTempValue(initialVal);
  };

  const saveEditing = (field: string) => {
    setEditingField(null);
    const val = tempValue.trim();

    if (field === 'title') {
      if (val) onUpdateTitle?.(node.id, val);
    } else if (field === 'budgetNumber') {
      onUpdateData?.(node.id, { budgetNumber: val || 'ORC-001', orderCode: val || 'ORC-001' });
    } else if (field === 'customerName') {
      onUpdateData?.(node.id, { customerName: val || 'Cliente' });
    } else if (field === 'budgetValue') {
      const num = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
      onUpdateData?.(node.id, { totalOrderValue: isNaN(num) ? 0 : num, orderValue: isNaN(num) ? 0 : num });
    } else if (field === 'validUntil') {
      onUpdateData?.(node.id, { validUntil: val || '2026-09-25' });
    } else if (field === 'paymentConditions') {
      onUpdateData?.(node.id, { paymentConditions: val || 'À Vista' });
    }
  };

  return (
    <div
      id={`budget-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-amber-950/40 via-slate-900/95 to-slate-950/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header Simplificado */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              ORÇAMENTO
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {editingField === 'budgetNumber' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('budgetNumber')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('budgetNumber');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-amber-300 focus:outline-none w-24"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('budgetNumber', budgetNumber);
                }}
                className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-bold cursor-pointer transition-all"
                title="Clique para editar código do orçamento"
              >
                #{budgetNumber}
              </span>
            )}

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-mono font-bold text-emerald-300">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Título do Orçamento */}
        {editingField === 'title' ? (
          <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('title');
                if (e.key === 'Escape') setEditingField(null);
              }}
              className="bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-amber-600 text-slate-950 font-bold hover:bg-amber-500 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title', node.name || 'Orçamento Comercial');
            }}
            className="font-bold text-sm text-white mb-2 leading-snug cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all flex items-center justify-between"
            title="Clique para editar o nome do orçamento"
          >
            <span>{node.name}</span>
            <span className="text-[10px] text-amber-400 opacity-60">✏️</span>
          </h3>
        )}

        {/* Painel Principal Simplificado: Cliente + Valor */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] mb-2 font-mono">
          {/* CLIENTE */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">
              CLIENTE
            </span>
            {editingField === 'customerName' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('customerName')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('customerName');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('customerName', customerName);
                }}
                className="text-slate-200 font-semibold truncate block cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar o cliente"
              >
                {customerName}
              </span>
            )}
          </div>

          {/* VALOR */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">
              VALOR PROPOSTO
            </span>
            {editingField === 'budgetValue' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('budgetValue')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('budgetValue');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-amber-300 font-bold focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('budgetValue', String(budgetValue));
                }}
                className="text-amber-300 font-bold text-xs block cursor-pointer hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar o valor"
              >
                {formattedValue}
              </span>
            )}
          </div>
        </div>

        {/* Validade e Condições em linha única simples */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 mb-2 gap-2">
          {/* Validade */}
          <div className="flex items-center gap-1 truncate">
            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Validade:</span>
            {editingField === 'validUntil' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('validUntil')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('validUntil');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-20"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('validUntil', validUntil);
                }}
                className="text-slate-200 font-semibold cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 transition-all"
                title="Clique para editar data de validade"
              >
                {validUntil.split('-').reverse().join('/')}
              </span>
            )}
          </div>

          {/* Condições */}
          <div className="flex items-center gap-1 truncate">
            <span>Cond:</span>
            {editingField === 'paymentConditions' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('paymentConditions')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('paymentConditions');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-20"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('paymentConditions', paymentConditions);
                }}
                className="text-slate-200 font-semibold cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 transition-all"
                title="Clique para editar condições comerciais"
              >
                {paymentConditions}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Ação Direta Simplificado */}
      <div className="pt-2 border-t border-white/5">
        {isConverted ? (
          <div className="w-full py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aprovado & Convertido em Pedido</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConvertToOrder?.(node.id);
            }}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            <span>Aprovar & Converter em Pedido</span>
          </button>
        )}
      </div>
    </div>
  );
};
