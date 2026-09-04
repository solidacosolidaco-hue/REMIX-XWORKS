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
      className="p-3.5 bg-slate-900/95 border border-amber-500/30 rounded-xl shadow-xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full hover:border-amber-500/50 transition-colors"
    >
      <div>
        {/* Header Simplificado */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              ORÇAMENTO
            </span>
          </div>

          <span
            onClick={(e) => {
              e.stopPropagation();
              startEditing('budgetNumber', budgetNumber);
            }}
            className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono font-bold cursor-pointer transition-all"
            title="Clique para editar código"
          >
            #{budgetNumber}
          </span>
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
              className="bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shrink-0"
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
            className="font-bold text-sm text-white mb-2 leading-snug cursor-pointer hover:text-amber-300 transition-colors truncate"
            title="Clique para editar o nome"
          >
            {node.name}
          </h3>
        )}

        {/* Painel Principal: Cliente e Valor */}
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-white/5 space-y-1.5 text-xs mb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Cliente</span>
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
                className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-32"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('customerName', customerName);
                }}
                className="text-slate-200 font-medium truncate cursor-pointer hover:text-amber-300 transition-colors"
                title="Clique para editar cliente"
              >
                {customerName}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Valor</span>
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
                className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-28"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('budgetValue', String(budgetValue));
                }}
                className="text-amber-400 font-bold text-sm cursor-pointer hover:text-amber-300 transition-colors"
                title="Clique para editar valor"
              >
                {formattedValue}
              </span>
            )}
          </div>
        </div>

        {/* Validade e Condições */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 mb-2 gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Validade:</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('validUntil', validUntil);
              }}
              className="text-slate-200 font-semibold cursor-pointer hover:text-amber-300"
            >
              {validUntil.split('-').reverse().join('/')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>Cond:</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('paymentConditions', paymentConditions);
              }}
              className="text-slate-200 font-semibold cursor-pointer hover:text-amber-300"
            >
              {paymentConditions}
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Ação Direta */}
      <div className="pt-2 border-t border-white/10">
        {isConverted ? (
          <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Convertido em Pedido</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConvertToOrder?.(node.id);
            }}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Aprovar e Converter</span>
          </button>
        )}
      </div>
    </div>
  );
};
