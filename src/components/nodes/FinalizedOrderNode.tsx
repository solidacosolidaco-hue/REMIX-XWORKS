import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { CheckCircle2, PackageCheck, FileText, Receipt, Edit2, Calendar, Check, X, Clock, Eye, EyeOff } from 'lucide-react';

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
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isPeekingValue, setIsPeekingValue] = useState(false);

  // Status state: 'Concluído' or 'Aguardando'
  const initialStatus = (node.data?.status === 'Aguardando' || node.data?.status === 'AGUARDANDO')
    ? 'Aguardando'
    : 'Concluído';
  const [status, setStatus] = useState<'Concluído' | 'Aguardando'>(initialStatus);

  // Form states
  const [titleInput, setTitleInput] = useState(node.name || 'Pedido Finalizado');
  const [orderCodeInput, setOrderCodeInput] = useState(node.data?.orderCode || node.data?.salesOrderNumber || 'PED-6578');
  const [customerInput, setCustomerInput] = useState(node.data?.customerName || node.data?.clientName || 'Indústria Metalúrgica Delta S/A');

  const isWithoutValue = Boolean(
    node.data?.withoutValue ||
    node.data?.descriptiveOnly ||
    (node.data?.orderValue === 0 && !node.data?.totalOrderValue && !node.data?.value)
  );
  const isHideValueOnly = Boolean(node.data?.hideValueOnly || node.data?.hideValue);

  const [isWithoutValueInput, setIsWithoutValueInput] = useState(isWithoutValue);
  const [isHideValueOnlyInput, setIsHideValueOnlyInput] = useState(isHideValueOnly);
  const [valueInput, setValueInput] = useState(node.data?.totalOrderValue ?? node.data?.orderValue ?? node.data?.value ?? 412000);
  const [descriptiveNotesInput, setDescriptiveNotesInput] = useState(node.data?.descriptiveNotes || node.data?.notes || '');
  const [deliveryDeadlineInput, setDeliveryDeadlineInput] = useState(node.data?.deliveryDeadline || node.data?.deliveredDate || '2026-09-20');

  const orderCode = node.data?.orderCode || node.data?.salesOrderNumber || 'PED-6578';
  const customerName = node.data?.customerName || node.data?.clientName || 'Indústria Metalúrgica Delta S/A';
  const orderValue = isWithoutValue ? 0 : (node.data?.totalOrderValue ?? node.data?.orderValue ?? node.data?.value ?? 412000);

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

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = status === 'Concluído' ? 'Aguardando' : 'Concluído';
    setStatus(nextStatus);
    if (onUpdateData) {
      onUpdateData(node.id, {
        status: nextStatus,
        completed: nextStatus === 'Concluído',
        progress: nextStatus === 'Concluído' ? 100 : 50,
      });
    }
  };

  const handleDetailsSubmit = () => {
    setIsEditingDetails(false);
    if (onUpdateData) {
      onUpdateData(node.id, {
        status: status,
        completed: status === 'Concluído',
        progress: status === 'Concluído' ? 100 : 50,
        orderCode: orderCodeInput,
        salesOrderNumber: orderCodeInput,
        customerName: customerInput,
        clientName: customerInput,
        withoutValue: isWithoutValueInput,
        descriptiveOnly: isWithoutValueInput,
        hideValueOnly: isHideValueOnlyInput,
        hideValue: isHideValueOnlyInput,
        orderValue: isWithoutValueInput ? 0 : Number(valueInput),
        totalOrderValue: isWithoutValueInput ? 0 : Number(valueInput),
        value: isWithoutValueInput ? 0 : Number(valueInput),
        descriptiveNotes: descriptiveNotesInput,
        deliveryDeadline: deliveryDeadlineInput,
        deliveredDate: deliveryDeadlineInput,
      });
    }
  };

  return (
    <div
      id={`finalized-order-node-${node.id}`}
      className={`p-4 bg-gradient-to-br transition-all duration-300 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between h-full w-full ${
        status === 'Concluído'
          ? 'from-emerald-950/90 via-slate-900/95 to-slate-900/95 border-2 border-emerald-500/60'
          : 'from-amber-950/90 via-slate-900/95 to-slate-900/95 border-2 border-amber-500/60'
      }`}
    >
      <div>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
          status === 'Concluído' ? 'border-emerald-500/20' : 'border-amber-500/20'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              status === 'Concluído'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${
                status === 'Concluído' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                PEDIDO FINALIZADO
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {orderCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingDetails(!isEditingDetails);
              }}
              className={`p-1 rounded transition-colors ${
                status === 'Concluído'
                  ? 'hover:bg-emerald-500/20 text-emerald-300'
                  : 'hover:bg-amber-500/20 text-amber-300'
              }`}
              title="Editar Dados do Pedido Finalizado"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Status Button: CONCLUÍDO vs AGUARDANDO */}
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all cursor-pointer ${
                status === 'Concluído'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
              }`}
              title="Clique para alternar entre CONCLUÍDO e AGUARDANDO"
            >
              {status === 'Concluído' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-200">
                    CONCLUÍDO
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-amber-200">
                    AGUARDANDO
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Banner Indicativo de Status */}
        <div className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 border rounded-lg mb-2.5 ${
          status === 'Concluído'
            ? 'bg-emerald-500/15 border-emerald-500/30'
            : 'bg-amber-500/15 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-1.5">
            <Receipt className={`w-3.5 h-3.5 shrink-0 ${status === 'Concluído' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={`text-[10px] font-bold tracking-wide uppercase ${
              status === 'Concluído' ? 'text-emerald-200' : 'text-amber-200'
            }`}>
              {status === 'Concluído' ? 'FATURADO & ENTREGUE • FIM DO CICLO' : 'AGUARDANDO FATURAMENTO / ENTREGA'}
            </span>
          </div>
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
            className="bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full mb-2"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-base text-white mb-1.5 leading-snug cursor-pointer hover:underline hover:text-emerald-300 transition-colors"
            title="Clique para editar o título do pedido"
          >
            {node.name}
          </h3>
        )}

        {/* Inline Edit Form vs Static Display */}
        {isEditingDetails ? (
          <div
            className="space-y-2 mb-3 bg-slate-950/95 p-3 rounded-xl border border-emerald-500/50 shadow-inner text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status Selection Buttons */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-emerald-400 font-bold">Status do Pedido</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Concluído')}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    status === 'Concluído'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>CONCLUÍDO</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Aguardando')}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    status === 'Aguardando'
                      ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>AGUARDANDO</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-emerald-400 font-bold">Código do Pedido</label>
              <input
                type="text"
                value={orderCodeInput}
                onChange={(e) => setOrderCodeInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-emerald-500 outline-none font-mono"
                placeholder="Ex: PED-6578"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-emerald-400 font-bold">Cliente</label>
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-emerald-500 outline-none"
                placeholder="Nome do Cliente"
              />
            </div>

            {/* Checkbox Sem Valor e Ocultar Valor */}
            <div className="p-2 bg-slate-900/90 rounded border border-slate-700/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-emerald-300">
                <input
                  type="checkbox"
                  checked={isWithoutValueInput}
                  onChange={(e) => setIsWithoutValueInput(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>Pedido Informativo (Sem Valor Financeiro)</span>
              </label>

              {isWithoutValueInput ? (
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    Observações de Faturamento e Entrega
                  </label>
                  <textarea
                    rows={2}
                    value={descriptiveNotesInput}
                    onChange={(e) => setDescriptiveNotesInput(e.target.value)}
                    placeholder="Descreva observações da entrega ou faturamento..."
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-emerald-500 outline-none placeholder:text-slate-500 font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-tighter text-slate-400 font-bold">Valor Total Faturado (R$)</label>
                    <input
                      type="number"
                      value={valueInput}
                      onChange={(e) => setValueInput(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-emerald-500 outline-none font-mono"
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
                      Mantém o valor nos relatórios/totais, mas oculta a visualização no quadro (••••••).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-tighter text-emerald-400 font-bold">Data de Faturamento / Entrega</label>
              <input
                type="date"
                value={deliveryDeadlineInput}
                onChange={(e) => setDeliveryDeadlineInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full text-white focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailsSubmit();
                }}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>SALVAR ALTERAÇÕES</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDetails(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>CANCELAR</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingDetails(true);
            }}
            className="cursor-pointer hover:bg-emerald-500/5 p-1 rounded-lg transition-colors group"
            title="Clique para editar informações do pedido finalizado"
          >
            <p className="text-xs text-slate-300 mb-2 font-mono flex items-center justify-between">
              <span>Cliente: <strong className="text-white">{customerName}</strong></span>
              <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>

            {/* Valor do Pedido Finalizado omitted per user request */}
          </div>
        )}

        {/* Data de Conclusão / Faturamento (sem barra de progresso) */}
        {deliveryDeadlineInput && (
          <div className={`flex items-center justify-between text-xs font-mono p-2 bg-slate-950/70 border rounded-lg mt-2 ${
            status === 'Concluído' ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}>
            <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <Calendar className={`w-3.5 h-3.5 ${status === 'Concluído' ? 'text-emerald-400' : 'text-amber-400'}`} />
              Data de Entrega / Faturamento:
            </span>
            <span className={`font-bold ${status === 'Concluído' ? 'text-emerald-300' : 'text-amber-300'}`}>
              {new Date(deliveryDeadlineInput + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

