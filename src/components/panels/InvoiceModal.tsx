import React, { useState, useEffect } from 'react';
import { CanvasNode, Connection, InvoiceDocument, InvoiceItem } from '../../types/canvas';
import {
  generateNFeDocument,
  generateNFeXml,
  getConnectedContextForNode,
} from '../../utils/flowIntelligence';
import {
  X,
  Printer,
  Download,
  FileCode,
  Receipt,
  Building2,
  ShoppingCart,
  CheckCircle2,
  Share2,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  connections: Connection[];
  initialNodeId?: string | null;
  onAttachInvoiceNodeToCanvas?: (invoice: InvoiceDocument, customerId?: string, orderId?: string) => void;
  onSyncOrderPaid?: (orderId: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  nodes,
  connections,
  initialNodeId,
  onAttachInvoiceNodeToCanvas,
  onSyncOrderPaid,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'danfe' | 'editor' | 'xml'>('danfe');
  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  const customerNodes = nodes.filter((n) => n.type === 'customer');
  const orderNodes = nodes.filter((n) => n.type === 'order');

  // Initialize or recompute when initialNodeId or modal opens
  useEffect(() => {
    if (!isOpen) return;

    let targetCust = customerNodes[0] || null;
    let targetOrd = orderNodes[0] || null;

    if (initialNodeId) {
      const initNode = nodes.find((n) => n.id === initialNodeId);
      if (initNode) {
        if (initNode.type === 'customer') {
          targetCust = initNode;
          const ctx = getConnectedContextForNode(initNode.id, nodes, connections);
          if (ctx && ctx.connectedOrders.length > 0) {
            targetOrd = ctx.connectedOrders[0];
          }
        } else if (initNode.type === 'order') {
          targetOrd = initNode;
          const ctx = getConnectedContextForNode(initNode.id, nodes, connections);
          if (ctx && ctx.connectedCustomer) {
            targetCust = ctx.connectedCustomer;
          }
        } else if (initNode.type === 'project') {
          const ctx = getConnectedContextForNode(initNode.id, nodes, connections);
          if (ctx && ctx.connectedCustomer) targetCust = ctx.connectedCustomer;
          if (ctx && ctx.connectedOrders.length > 0) targetOrd = ctx.connectedOrders[0];
        }
      }
    }

    if (targetCust) setSelectedCustomerId(targetCust.id);
    if (targetOrd) setSelectedOrderId(targetOrd.id);

    const projectNode = nodes.find((n) => n.type === 'project') || null;
    const doc = generateNFeDocument(targetCust, targetOrd, projectNode);
    setInvoice(doc);
  }, [isOpen, initialNodeId, nodes.length, connections.length]);

  // When user switches customer or order in the dropdown
  const handleRegenerateFromSelection = (newCustId: string, newOrdId: string) => {
    setSelectedCustomerId(newCustId);
    setSelectedOrderId(newOrdId);
    const cust = nodes.find((n) => n.id === newCustId) || null;
    const ord = nodes.find((n) => n.id === newOrdId) || null;
    const prj = nodes.find((n) => n.type === 'project') || null;
    const doc = generateNFeDocument(cust, ord, prj);
    setInvoice(doc);
  };

  if (!isOpen || !invoice) return null;

  const xmlContent = generateNFeXml(invoice);

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>DANFE - Nota Fiscal Eletrônica nº ${invoice.nfeNumber}</title>
              <style>
                body { font-family: monospace, Arial, sans-serif; padding: 20px; color: #000; font-size: 11px; line-height: 1.3; background: #fff; }
                .box { border: 1px solid #000; padding: 8px; margin-bottom: 6px; }
                .title { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
                .row { display: flex; justify-content: space-between; gap: 10px; }
                .col { flex: 1; }
                .bold { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 10px; }
                th { background: #f0f0f0; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-weight:bold; font-size:16px;">DANFE - DOCUMENTO AUXILIAR DA NF-e</div>
                <button onclick="window.print()" style="background:#0284c7; color:white; border:none; padding:6px 12px; font-weight:bold; cursor:pointer;">Imprimir / PDF</button>
              </div>

              <div class="box">
                <div class="title">NOTA FISCAL ELETRÔNICA Nº ${invoice.nfeNumber} - SÉRIE 1</div>
                <div><span class="bold">CHAVE DE ACESSO:</span> ${invoice.nfeKey}</div>
                <div><span class="bold">DATA DE EMISSÃO:</span> ${invoice.issueDate} ${invoice.issueTime}</div>
                <div><span class="bold">NATUREZA DA OPERAÇÃO:</span> ${invoice.operationType}</div>
                <div><span class="bold">PROTOCOLOS DE AUTORIZAÇÃO:</span> ${invoice.protocolNumber}</div>
              </div>

              <div class="box">
                <div class="bold" style="border-bottom:1px solid #000; margin-bottom:4px;">EMISSOR</div>
                <div><span class="bold">${invoice.issuer.name}</span> - CNPJ: ${invoice.issuer.cnpj}</div>
                <div>IE: ${invoice.issuer.ie} | ${invoice.issuer.address} - ${invoice.issuer.city}/${invoice.issuer.uf}</div>
              </div>

              <div class="box">
                <div class="bold" style="border-bottom:1px solid #000; margin-bottom:4px;">DESTINATÁRIO / REMETENTE</div>
                <div><span class="bold">${invoice.recipient.name}</span> - CNPJ/CPF: ${invoice.recipient.cnpj}</div>
                <div>IE: ${invoice.recipient.ie} | ${invoice.recipient.address} - ${invoice.recipient.city}/${invoice.recipient.uf}</div>
              </div>

              <div class="box">
                <div class="bold">DADOS DOS PRODUTOS / SERVIÇOS</div>
                <table>
                  <thead>
                    <tr>
                      <th>CÓDIGO</th>
                      <th>DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                      <th>NCM</th>
                      <th>QTD</th>
                      <th>VALOR UNIT.</th>
                      <th>VALOR TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map(item => `
                      <tr>
                        <td>${item.code}</td>
                        <td>${item.description}</td>
                        <td>${item.ncm}</td>
                        <td>${item.qty} ${item.unit}</td>
                        <td>R$ ${item.unitPrice.toFixed(2)}</td>
                        <td>R$ ${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="box">
                <div class="row">
                  <div><span class="bold">VALOR TOTAL DOS PRODUTOS:</span> R$ ${invoice.totalProductsValue.toFixed(2)}</div>
                  <div><span class="bold">VALOR TOTAL DA NOTA:</span> R$ ${invoice.totalInvoiceValue.toFixed(2)}</div>
                </div>
              </div>

              <script>
                setTimeout(function() {
                  window.print();
                }, 400);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn("Popup block fallback to window.print", e);
    }
    window.print();
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(invoice.nfeKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe-${invoice.nfeNumber.replace(/\D/g, '')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachToCanvas = () => {
    if (onAttachInvoiceNodeToCanvas) {
      onAttachInvoiceNodeToCanvas(invoice, selectedCustomerId, selectedOrderId);
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 2500);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[92vh] bg-[#0E131F] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Emissão de Nota Fiscal Eletrônica (NF-e Modelo 55)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SEFAZ SP • AUTORIZADA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                DANFE • Relação Comercial Integrada com Cliente & Pedido do Canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab navigation */}
            <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-white/5 mr-2">
              <button
                onClick={() => setActiveTab('danfe')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'danfe'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Visualizar DANFE
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ajustar Dados
              </button>
              <button
                onClick={() => setActiveTab('xml')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'xml'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                XML da NF-e
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Linked Entity Selector Filter Bar */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Cliente:
              </span>
              <select
                value={selectedCustomerId}
                onChange={(e) =>
                  handleRegenerateFromSelection(e.target.value, selectedOrderId)
                }
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {customerNodes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.data.cnpj || 'Sem CNPJ'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                Pedido / Produto:
              </span>
              <select
                value={selectedOrderId}
                onChange={(e) =>
                  handleRegenerateFromSelection(selectedCustomerId, e.target.value)
                }
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {orderNodes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.data.orderCode || o.name} — {formatCurrency(o.data.orderValue || 0)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Valor Total: {formatCurrency(invoice.grandTotal)}
            </span>
            <button
              onClick={() =>
                handleRegenerateFromSelection(selectedCustomerId, selectedOrderId)
              }
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
              title="Recalcular impostos e dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090D16]">
          {/* TAB 1: DANFE PREVIEW (Official Layout Simulation) */}
          {activeTab === 'danfe' && (
            <div
              id="danfe-printable-container"
              className="max-w-4xl mx-auto bg-white text-black p-6 rounded-xl shadow-2xl border border-slate-300 font-sans select-text print:p-0 print:border-none print:shadow-none"
            >
              {/* DANFE Header Box */}
              <div className="border border-black p-3 mb-2 flex flex-col md:flex-row gap-4">
                {/* Issuer Info */}
                <div className="flex-1">
                  <h1 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
                    {invoice.issuerName}
                  </h1>
                  <p className="text-[10px] text-slate-700 leading-tight">
                    {invoice.issuerAddress} - {invoice.issuerCity} / {invoice.issuerState}
                  </p>
                  <p className="text-[10px] text-slate-700 mt-1">
                    <span className="font-bold">CNPJ:</span> {invoice.issuerCnpj} &nbsp;|&nbsp;
                    <span className="font-bold">IE:</span> {invoice.issuerIe}
                  </p>
                </div>

                {/* DANFE center marker */}
                <div className="w-48 text-center border-x border-black px-2 flex flex-col justify-center">
                  <div className="font-extrabold text-lg">DANFE</div>
                  <div className="text-[9px] leading-tight font-medium text-slate-800">
                    Documento Auxiliar da Nota Fiscal Eletrônica
                  </div>
                  <div className="mt-1 flex justify-center gap-3 text-[10px] font-mono">
                    <span>
                      0 - ENTRADA <br />
                      <span className="font-bold border border-black px-1.5 py-0.5">1</span> 1 - SAÍDA
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold">
                    Nº {invoice.nfeNumber}
                  </div>
                  <div className="text-[9px] font-mono">SÉRIE {invoice.series}</div>
                </div>

                {/* Access Key & Barcode */}
                <div className="w-72 flex flex-col justify-between text-[10px]">
                  <div>
                    <span className="font-bold block text-[9px] uppercase">
                      CHAVE DE ACESSO
                    </span>
                    <div className="font-mono text-[9px] tracking-widest bg-slate-100 p-1 border border-slate-400 text-center font-bold">
                      {invoice.nfeKey.match(/.{1,4}/g)?.join(' ') || invoice.nfeKey}
                    </div>
                  </div>

                  {/* Visual Barcode Graphic */}
                  <div className="my-1 py-1 px-2 bg-slate-50 border border-slate-300 flex items-center justify-center">
                    <svg className="w-full h-8" viewBox="0 0 200 30" preserveAspectRatio="none">
                      <rect x="0" y="0" width="200" height="30" fill="#fff" />
                      {Array.from({ length: 44 }).map((_, i) => (
                        <rect
                          key={i}
                          x={i * 4.5 + 2}
                          y="2"
                          width={i % 3 === 0 ? '3' : i % 2 === 0 ? '1.5' : '2'}
                          height="26"
                          fill="#000"
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="text-[9px] leading-tight text-slate-700">
                    <span className="font-bold">Protocolo de Autorização:</span>
                    <br />
                    {invoice.protocolNumber}
                  </div>
                </div>
              </div>

              {/* DESTINATÁRIO / REMETENTE */}
              <div className="border border-black p-2 mb-2 text-[10px]">
                <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 mb-1.5 bg-slate-100 px-1">
                  DESTINATÁRIO / REMETENTE
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      NOME / RAZÃO SOCIAL
                    </span>
                    <span className="font-bold">{invoice.recipientName}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      CNPJ / CPF
                    </span>
                    <span className="font-mono font-bold">{invoice.recipientCnpj}</span>
                  </div>

                  <div className="col-span-6">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      ENDEREÇO
                    </span>
                    <span>{invoice.recipientAddress}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      MUNICÍPIO
                    </span>
                    <span>{invoice.recipientCity}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      UF
                    </span>
                    <span>{invoice.recipientState}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">
                      INSCRIÇÃO ESTADUAL
                    </span>
                    <span>{invoice.recipientIe || 'ISENTO'}</span>
                  </div>
                </div>
              </div>

              {/* FATURA / DUPLICATAS */}
              <div className="border border-black p-2 mb-2 text-[10px]">
                <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 mb-1 bg-slate-100 px-1">
                  FATURA / FORMA DE PAGAMENTO ({invoice.paymentMethod})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {invoice.installments.map((inst) => (
                    <div
                      key={inst.number}
                      className="p-1.5 border border-slate-300 rounded bg-slate-50 text-[9px] font-mono"
                    >
                      <span className="font-bold">PARCELA {inst.number}/3:</span>{' '}
                      {formatCurrency(inst.value)} &nbsp;|&nbsp;
                      <span className="text-slate-600">
                        Venc: {inst.dueDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CÁLCULO DO IMPOSTO */}
              <div className="border border-black p-2 mb-2 text-[10px]">
                <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 mb-1 bg-slate-100 px-1">
                  CÁLCULO DO IMPOSTO
                </div>
                <div className="grid grid-cols-6 gap-2 text-right">
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold text-left">
                      BASE CÁLC. ICMS
                    </span>
                    <span className="font-mono">{formatCurrency(invoice.icmsBase)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold text-left">
                      VALOR DO ICMS
                    </span>
                    <span className="font-mono">{formatCurrency(invoice.icmsValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold text-left">
                      VALOR DO IPI
                    </span>
                    <span className="font-mono">{formatCurrency(invoice.ipiValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold text-left">
                      PIS (0.65%)
                    </span>
                    <span className="font-mono">{formatCurrency(invoice.pisValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase font-bold text-left">
                      COFINS (3.0%)
                    </span>
                    <span className="font-mono">{formatCurrency(invoice.cofinsValue)}</span>
                  </div>
                  <div className="bg-slate-100 p-1 border border-slate-400 font-bold">
                    <span className="text-slate-900 block text-[8px] uppercase font-extrabold text-left">
                      TOTAL DA NOTA
                    </span>
                    <span className="font-mono text-emerald-800 font-bold text-xs">
                      {formatCurrency(invoice.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DADOS DOS PRODUTOS / SERVIÇOS */}
              <div className="border border-black mb-2 text-[9px]">
                <div className="font-bold text-[9px] uppercase border-b border-black p-1 bg-slate-100">
                  DADOS DOS PRODUTOS / SERVIÇOS
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-50 text-[8px] uppercase font-bold">
                      <th className="p-1 border-r border-black">CÓDIGO</th>
                      <th className="p-1 border-r border-black">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                      <th className="p-1 border-r border-black">NCM</th>
                      <th className="p-1 border-r border-black">CFOP</th>
                      <th className="p-1 border-r border-black">UN</th>
                      <th className="p-1 border-r border-black text-right">QTD</th>
                      <th className="p-1 border-r border-black text-right">VL. UNIT</th>
                      <th className="p-1 border-r border-black text-right">VL. TOTAL</th>
                      <th className="p-1 border-r border-black text-right">ICMS %</th>
                      <th className="p-1 text-right">IPI %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-300 font-mono">
                        <td className="p-1 border-r border-black">{item.code}</td>
                        <td className="p-1 border-r border-black font-sans font-medium">
                          {item.description}
                        </td>
                        <td className="p-1 border-r border-black">{item.ncm}</td>
                        <td className="p-1 border-r border-black">{item.cfop}</td>
                        <td className="p-1 border-r border-black">{item.unit}</td>
                        <td className="p-1 border-r border-black text-right">{item.quantity}</td>
                        <td className="p-1 border-r border-black text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-1 border-r border-black text-right font-bold">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="p-1 border-r border-black text-right">
                          {item.icmsPercent}%
                        </td>
                        <td className="p-1 text-right">{item.ipiPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DADOS ADICIONAIS */}
              <div className="border border-black p-2 text-[9px]">
                <div className="font-bold text-[8px] uppercase border-b border-black pb-0.5 mb-1 bg-slate-100 px-1">
                  DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES
                </div>
                <p className="text-slate-700 leading-tight">
                  {invoice.additionalInfo}
                </p>
                <div className="mt-2 pt-1 border-t border-slate-200 text-[8px] font-mono text-slate-500">
                  Emitido através do XCanvas Gestão Industrial • Rastreabilidade SEFAZ integrada.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT INVOICE DATA / PRODUCTS */}
          {activeTab === 'editor' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 bg-slate-900 border border-white/10 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Dados do Destinatário (Cliente)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Razão Social / Nome</label>
                    <input
                      type="text"
                      value={invoice.recipientName}
                      onChange={(e) =>
                        setInvoice({ ...invoice, recipientName: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={invoice.recipientCnpj}
                      onChange={(e) =>
                        setInvoice({ ...invoice, recipientCnpj: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={invoice.recipientAddress}
                      onChange={(e) =>
                        setInvoice({ ...invoice, recipientAddress: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">E-mail Fiscal</label>
                    <input
                      type="text"
                      value={invoice.recipientEmail || ''}
                      onChange={(e) =>
                        setInvoice({ ...invoice, recipientEmail: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Items manager */}
              <div className="p-4 bg-slate-900 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Itens / Produtos da Nota</span>
                  </h3>
                  <button
                    onClick={() => {
                      const newItem: InvoiceItem = {
                        id: `item-${Date.now()}`,
                        code: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
                        description: 'Serviço de Montagem / Acessório Industrial',
                        ncm: '8462.10.00',
                        cfop: '5.101',
                        quantity: 1,
                        unit: 'UN',
                        unitPrice: 15000,
                        totalPrice: 15000,
                        icmsPercent: 18,
                        ipiPercent: 5,
                      };
                      const updatedItems = [...invoice.items, newItem];
                      const newTotal = updatedItems.reduce((s, i) => s + i.totalPrice, 0);
                      setInvoice({
                        ...invoice,
                        items: updatedItems,
                        productsTotal: newTotal,
                        icmsBase: newTotal,
                        icmsValue: Math.round(newTotal * 0.18),
                        ipiValue: Math.round(newTotal * 0.05),
                        grandTotal: newTotal + Math.round(newTotal * 0.05),
                      });
                    }}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {invoice.items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-3 bg-slate-950/60 border border-white/5 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => {
                            const copy = [...invoice.items];
                            copy[idx].description = e.target.value;
                            setInvoice({ ...invoice, items: copy });
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white font-medium"
                        />
                        <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                          <span>NCM: {it.ncm}</span>
                          <span>CFOP: {it.cfop}</span>
                          <span>Qtd: {it.quantity} {it.unit}</span>
                        </div>
                      </div>

                      <div className="w-32">
                        <label className="text-[10px] text-slate-400 font-mono block">Valor (R$)</label>
                        <input
                          type="number"
                          value={it.totalPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...invoice.items];
                            copy[idx].totalPrice = val;
                            copy[idx].unitPrice = val;
                            const newTotal = copy.reduce((s, i) => s + i.totalPrice, 0);
                            setInvoice({
                              ...invoice,
                              items: copy,
                              productsTotal: newTotal,
                              icmsBase: newTotal,
                              icmsValue: Math.round(newTotal * 0.18),
                              ipiValue: Math.round(newTotal * 0.05),
                              grandTotal: newTotal + Math.round(newTotal * 0.05),
                            });
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      {invoice.items.length > 1 && (
                        <button
                          onClick={() => {
                            const copy = invoice.items.filter((_, i) => i !== idx);
                            const newTotal = copy.reduce((s, i) => s + i.totalPrice, 0);
                            setInvoice({
                              ...invoice,
                              items: copy,
                              productsTotal: newTotal,
                              icmsBase: newTotal,
                              icmsValue: Math.round(newTotal * 0.18),
                              ipiValue: Math.round(newTotal * 0.05),
                              grandTotal: newTotal + Math.round(newTotal * 0.05),
                            });
                          }}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional notes */}
              <div className="p-4 bg-slate-900 border border-white/10 rounded-xl space-y-2">
                <label className="text-xs font-bold text-white block">
                  Informações Complementares / Observações Fiscais
                </label>
                <textarea
                  value={invoice.additionalInfo}
                  onChange={(e) =>
                    setInvoice({ ...invoice, additionalInfo: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                />
              </div>
            </div>
          )}

          {/* TAB 3: XML SEFAZ */}
          {activeTab === 'xml' && (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-300 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" />
                  Arquivo XML Assinado e Validado pelo Padrão SEFAZ v4.00
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyXml}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedXml ? 'Copiado!' : 'Copiar XML'}</span>
                  </button>
                  <button
                    onClick={handleDownloadXml}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Arquivo .xml</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-950 border border-white/10 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed">
                {xmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyKey}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 transition-colors font-mono"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave de Acesso'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Baixar XML</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isSuccessFeedback && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                NF-e Fixada no Canvas com Sucesso!
              </span>
            )}

            <button
              onClick={handleAttachToCanvas}
              className="flex items-center gap-1.5 bg-blue-600/90 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-blue-500/20 transition-all"
              title="Adiciona um novo quadro de Nota Fiscal conectado aos nós no Canvas"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Fixar Quadro NF-e no Canvas</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar DANFE (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
