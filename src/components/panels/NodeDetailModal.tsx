import React, { useState, useEffect, useMemo } from 'react';
import { CanvasNode, NodeStatus, Connection, NodeType, NodeColor, KanbanColumn } from '../../types/canvas';
import { 
  X, Save, Copy, Trash2, Maximize2, Tag, User, CheckCircle2, DollarSign, 
  Layers, FileText, Wrench, ShieldCheck, Clock, Link2, Building2, Search, 
  Plus, MapPin, Phone, Mail, Globe, CreditCard, Briefcase, Check, 
  AlertCircle, Database, Sparkles, ChevronDown, CheckCheck, RefreshCw, FileCheck,
  ShoppingCart, Receipt, Truck, Percent, Calculator, ArrowRightLeft, Package
} from 'lucide-react';
import { 
  getRegisteredCustomers, 
  saveCustomerToRegistry, 
  RegisteredCustomer 
} from '../../data/customerRegistry';
import {
  getRegisteredOrders,
  saveRegisteredOrder,
  generateNextNumber,
  RegisteredOrder,
  OrderItem,
  CommercialOrderStatus,
} from '../../data/orderRegistry';

interface NodeDetailModalProps {
  nodeId: string | null;
  nodes: CanvasNode[];
  connections: Connection[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (updatedNode: CanvasNode) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  nodeId,
  nodes,
  connections,
  isOpen,
  onClose,
  onUpdateNode,
  onDuplicateNode,
  onDeleteNode,
}) => {
  const node = nodes.find((n) => n.id === nodeId);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<NodeStatus>('A Fazer');
  const [assignee, setAssignee] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(250);
  const [nodeData, setNodeData] = useState<Record<string, any>>({});
  const [nodeType, setNodeType] = useState<NodeType>('budget');
  const [nodeColor, setNodeColor] = useState<NodeColor>('slate');
  const [connectionPoints, setConnectionPoints] = useState(3);
  const [enableGlow, setEnableGlow] = useState(true);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  // Specialized states for Customer (Quadro Base & Cadastro Mestre)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerActiveTab, setCustomerActiveTab] = useState<'identificacao' | 'contato' | 'endereco' | 'comercial'>('identificacao');
  const [saveToRegistry, setSaveToRegistry] = useState(true);
  const [loadedCustomerFeedback, setLoadedCustomerFeedback] = useState<string | null>(null);
  const [customerPersonType, setCustomerPersonType] = useState<'PJ' | 'PF'>('PJ');

  // Specialized states for Commercial Order & Budget (Orçamento & Pedido de Venda)
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [isOrderSearchOpen, setIsOrderSearchOpen] = useState(false);
  const [orderActiveTab, setOrderActiveTab] = useState<'geral' | 'itens' | 'condicoes'>('geral');
  const [saveOrderToRegistry, setSaveOrderToRegistry] = useState(true);
  const [loadedOrderFeedback, setLoadedOrderFeedback] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [customerInOrderSearch, setCustomerInOrderSearch] = useState('');

  const registeredCustomers = useMemo(() => {
    return getRegisteredCustomers();
  }, [isOpen, loadedCustomerFeedback]);

  const registeredOrders = useMemo(() => {
    return getRegisteredOrders();
  }, [isOpen, loadedOrderFeedback]);

  const filteredRegisteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return registeredOrders;
    const q = orderSearchQuery.toLowerCase();
    return registeredOrders.filter((o) => {
      return (
        o.title.toLowerCase().includes(q) ||
        o.salesOrderNumber.toLowerCase().includes(q) ||
        o.budgetNumber.toLowerCase().includes(q) ||
        (o.clientOrderNumber && o.clientOrderNumber.toLowerCase().includes(q)) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerCnpj && o.customerCnpj.toLowerCase().includes(q)) ||
        o.salesRep.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.items.some((it) => it.description.toLowerCase().includes(q) || (it.code && it.code.toLowerCase().includes(q)))
      );
    });
  }, [registeredOrders, orderSearchQuery]);

  const filteredCustomersForOrder = useMemo(() => {
    if (!customerInOrderSearch.trim()) return registeredCustomers;
    const q = customerInOrderSearch.toLowerCase();
    return registeredCustomers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.corporateName.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
      c.cnpj.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
    );
  }, [registeredCustomers, customerInOrderSearch]);

  const itemsSubtotal = useMemo(() => {
    return orderItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  }, [orderItems]);

  const totalOrderValue = useMemo(() => {
    if (nodeData.withoutValue) return 0;
    const shipping = Number(nodeData.shippingCost) || 0;
    const tax = Number(nodeData.taxAmount) || 0;
    const discount = Number(nodeData.discountAmount) || 0;
    return Math.max(0, itemsSubtotal + shipping + tax - discount);
  }, [nodeData.withoutValue, itemsSubtotal, nodeData.shippingCost, nodeData.taxAmount, nodeData.discountAmount]);

  const filteredRegisteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return registeredCustomers;
    const q = customerSearchQuery.toLowerCase();
    return registeredCustomers.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.corporateName.toLowerCase().includes(q) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
        c.cnpj.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.customerSegment.toLowerCase().includes(q)
      );
    });
  }, [registeredCustomers, customerSearchQuery]);

  useEffect(() => {
    if (node) {
      setNodeType(node.type);
      setName(node.name || '');
      setStatus(node.status || (node.type === 'customer' ? 'Ativo' : 'A Fazer'));
      setAssignee(node.assignee || '');
      setTagsInput(node.tags ? node.tags.join(', ') : '');
      setWidth(node.width || (node.type === 'order' || node.type === 'budget' || node.type === 'customer' ? 340 : 300));
      setHeight(node.height || 250);
      setNodeData({ ...(node.data || {}) });
      setNodeColor(node.color || 'slate');
      setConnectionPoints(node.data?.connectionPointsPerSide ?? 3);
      setEnableGlow(node.data?.enableGlow !== false);
      setKanbanColumns(node.data?.columns || [
        { id: 'col-todo', title: 'A FAZER', color: '#64748b' },
        { id: 'col-in-progress', title: 'EM ANDAMENTO', color: '#3b82f6' },
        { id: 'col-done', title: 'CONCLUÍDO', color: '#10b981' },
      ]);
      setCustomerPersonType(node.data?.personType || 'PJ');
      setCustomerSearchQuery('');
      setIsCustomerSearchOpen(false);
      setLoadedCustomerFeedback(null);

      // Initialize Commercial Order / Budget details
      if (node.type === 'order' || node.type === 'budget') {
        const isNodeWithoutVal = Boolean(
          node.data?.withoutValue ||
          node.data?.descriptiveOnly ||
          (node.data?.orderValue === 0 && !node.data?.totalOrderValue)
        );

        const currentItems: OrderItem[] = (node.data?.orderItems && node.data.orderItems.length > 0)
          ? node.data.orderItems
          : (node.data?.itemsList && node.data.itemsList.length > 0)
            ? node.data.itemsList.map((desc: string, idx: number) => ({
                id: `item-${idx + 1}`,
                code: `PECA-0${idx + 1}`,
                description: desc,
                quantity: 1,
                unit: 'UN',
                unitPrice: isNodeWithoutVal ? 0 : Math.round((node.data?.orderValue || 250000) / (node.data?.itemsList?.length || 1)),
                taxRate: isNodeWithoutVal ? 0 : 5,
                subtotal: isNodeWithoutVal ? 0 : Math.round((node.data?.orderValue || 250000) / (node.data?.itemsList?.length || 1)),
              }))
            : isNodeWithoutVal
            ? [
                {
                  id: 'item-1',
                  code: 'EST-4401',
                  description: 'Estrutura metálica usinada em viga W250 com furações CNC',
                  quantity: 4,
                  unit: 'CJ',
                  unitPrice: 0,
                  taxRate: 0,
                  subtotal: 0,
                },
                {
                  id: 'item-2',
                  code: 'HID-8802',
                  description: 'Sistema hidráulico de acionamento 350 bar com manifold integrado',
                  quantity: 2,
                  unit: 'UN',
                  unitPrice: 0,
                  taxRate: 0,
                  subtotal: 0,
                },
              ]
            : [
                {
                  id: 'item-1',
                  code: 'EST-4401',
                  description: 'Estrutura metálica usinada em viga W250 com furações CNC',
                  quantity: 4,
                  unit: 'CJ',
                  unitPrice: 32500,
                  taxRate: 5,
                  subtotal: 130000,
                },
                {
                  id: 'item-2',
                  code: 'HID-8802',
                  description: 'Sistema hidráulico de acionamento 350 bar com manifold integrado',
                  quantity: 2,
                  unit: 'UN',
                  unitPrice: 42500,
                  taxRate: 8,
                  subtotal: 85000,
                },
                {
                  id: 'item-3',
                  code: 'PIN-009',
                  description: 'Pintura eletrostática epóxi espessura mínima 180 micras - Cor RAL 5010',
                  quantity: 1,
                  unit: 'LOT',
                  unitPrice: 35000,
                  taxRate: 0,
                  subtotal: 35000,
                },
              ];
        setOrderItems(currentItems);
        setOrderActiveTab('geral');
        setOrderSearchQuery('');
        setIsOrderSearchOpen(false);
        setIsCustomerSelectorOpen(false);
        setLoadedOrderFeedback(null);
        setNodeData((prev) => ({
          ...prev,
          orderType: node.type === 'budget' ? 'budget' : (prev.orderType || 'order'),
          withoutValue: isNodeWithoutVal,
          descriptiveOnly: isNodeWithoutVal,
          descriptiveNotes: node.data?.descriptiveNotes || '',
          salesOrderNumber: prev.salesOrderNumber || 'PV-4497',
          budgetNumber: prev.budgetNumber || 'ORC-2026-8821',
          clientOrderNumber: prev.clientOrderNumber || 'OC-90214/26',
          customerName: prev.customerName || 'Empresa ABC S/A',
          customerCnpj: prev.customerCnpj || '12.345.678/0001-90',
          contactName: prev.contactName || 'Renata Valente',
          contactEmail: prev.contactEmail || 'renata.valente@empresaabc.com.br',
          contactPhone: prev.contactPhone || '(11) 98765-4321',
          commercialStatus: prev.commercialStatus || (node.type === 'budget' ? 'Orçamento em Elaboração' : 'Pedido de Venda Confirmado'),
          issueDate: prev.issueDate || '2026-08-25',
          deliveryDeadline: prev.deliveryDeadline || '2026-09-20',
          shippingType: prev.shippingType || 'CIF',
          shippingCost: isNodeWithoutVal ? 0 : (prev.shippingCost ?? 4800),
          carrierName: prev.carrierName || 'Jamef Encomendas Urgentes',
          discountAmount: isNodeWithoutVal ? 0 : (prev.discountAmount ?? 5000),
          taxAmount: isNodeWithoutVal ? 0 : (prev.taxAmount ?? 13300),
          paymentMethod: prev.paymentMethod || 'Boleto Bancário Faturado',
          paymentConditions: isNodeWithoutVal ? 'Apenas Descritivo / Informativo' : (prev.paymentConditions || '28/56 DDL após emissão da NF-e'),
          deliveryLocation: prev.deliveryLocation || 'Av. das Indústrias, 1500 - Galpão 4, São Paulo - SP',
          commercialNotes: prev.commercialNotes || 'Exigido certificado de matéria-prima e ensaio por ultrassom das soldas conforme AWS D1.1.',
        }));
      }
    }
  }, [node, isOpen]);

  if (!isOpen || !node) return null;

  const handleSelectRegisteredCustomer = (cust: RegisteredCustomer) => {
    setName(cust.tradeName || cust.name);
    setStatus((cust.status as NodeStatus) || 'Ativo');
    if (cust.contactRole) setAssignee(cust.contactRole);
    setCustomerPersonType(cust.personType || 'PJ');

    setNodeData((prev) => ({
      ...prev,
      corporateName: cust.corporateName,
      tradeName: cust.tradeName || cust.name,
      cnpj: cust.cnpj,
      personType: cust.personType || 'PJ',
      stateRegistration: cust.stateRegistration || '',
      municipalRegistration: cust.municipalRegistration || '',
      customerSegment: cust.customerSegment || '',
      status: cust.status || 'Ativo',
      contactName: cust.contactName,
      contactRole: cust.contactRole || '',
      phone: cust.phone || '',
      cellphone: cust.cellphone || '',
      email: cust.email || '',
      billingEmail: cust.billingEmail || '',
      website: cust.website || '',
      zipCode: cust.zipCode || '',
      street: cust.street || '',
      number: cust.number || '',
      complement: cust.complement || '',
      neighborhood: cust.neighborhood || '',
      city: cust.city || 'São Paulo',
      state: cust.state || 'SP',
      address: cust.address || `${cust.city || 'São Paulo'} - ${cust.state || 'SP'}`,
      paymentTerm: cust.paymentTerm || '',
      creditLimit: cust.creditLimit || 0,
      totalRevenue: cust.totalRevenue || 'R$ 0',
      ordersCount: cust.ordersCount ?? 1,
      notes: cust.notes || '',
      registeredCustomerId: cust.id,
    }));

    setIsCustomerSearchOpen(false);
    setCustomerSearchQuery('');
    setLoadedCustomerFeedback(`Cliente "${cust.name}" carregado com sucesso!`);
    setTimeout(() => {
      setLoadedCustomerFeedback(null);
    }, 3500);
  };

  const handleResetToNewCustomer = () => {
    setName('Novo Cliente');
    setStatus('Ativo');
    setCustomerPersonType('PJ');
    setNodeData({
      corporateName: '',
      tradeName: '',
      cnpj: '',
      personType: 'PJ',
      stateRegistration: '',
      municipalRegistration: '',
      customerSegment: 'Manufatura & Metalmecânica',
      status: 'Ativo',
      contactName: '',
      contactRole: '',
      phone: '',
      cellphone: '',
      email: '',
      billingEmail: '',
      website: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      address: '',
      paymentTerm: '30 DDL',
      creditLimit: 50000,
      totalRevenue: 'R$ 0',
      ordersCount: 1,
      notes: '',
      registeredCustomerId: undefined,
    });
    setLoadedCustomerFeedback('Formulário limpo para cadastrar novo cliente!');
    setTimeout(() => {
      setLoadedCustomerFeedback(null);
    }, 3000);
  };

  const handleSelectRegisteredOrder = (ord: RegisteredOrder) => {
    setName(ord.title || `Pedido #${ord.salesOrderNumber || ord.budgetNumber}`);
    setStatus(ord.status === 'Faturado' ? 'Concluído' : ord.status === 'Em Produção' ? 'Em Andamento' : 'A Fazer');
    if (ord.salesRep) setAssignee(ord.salesRep);
    setOrderItems(ord.items || []);

    setNodeData((prev) => ({
      ...prev,
      orderType: ord.orderType,
      withoutValue: Boolean(ord.withoutValue || ord.totalValue === 0),
      descriptiveOnly: Boolean(ord.withoutValue || ord.totalValue === 0),
      descriptiveNotes: ord.descriptiveNotes || '',
      salesOrderNumber: ord.salesOrderNumber,
      budgetNumber: ord.budgetNumber,
      clientOrderNumber: ord.clientOrderNumber || '',
      customerName: ord.customerName,
      customerCnpj: ord.customerCnpj || '',
      contactName: ord.contactName || '',
      contactEmail: ord.contactEmail || '',
      contactPhone: ord.contactPhone || '',
      salesRep: ord.salesRep,
      commercialStatus: ord.status,
      issueDate: ord.issueDate,
      deliveryDeadline: ord.deliveryDeadline,
      validUntil: ord.validUntil || '',
      shippingCost: ord.shippingCost,
      shippingType: ord.shippingType,
      carrierName: ord.carrierName || '',
      discountAmount: ord.discountAmount,
      taxAmount: ord.taxAmount,
      itemsSubtotal: ord.itemsSubtotal,
      totalOrderValue: ord.totalValue,
      orderValue: ord.totalValue,
      paymentMethod: ord.paymentMethod,
      paymentConditions: ord.paymentConditions,
      deliveryLocation: ord.deliveryAddress || '',
      commercialNotes: ord.commercialNotes || '',
      registeredOrderId: ord.id,
      orderItems: ord.items,
      itemsList: ord.items.map((i) => i.description),
    }));

    setIsOrderSearchOpen(false);
    setOrderSearchQuery('');
    setLoadedOrderFeedback(`Pedido / Orçamento "${ord.salesOrderNumber || ord.budgetNumber} - ${ord.customerName}" carregado!`);
    setTimeout(() => {
      setLoadedOrderFeedback(null);
    }, 3500);
  };

  const handleResetToNewOrder = (type: 'order' | 'budget') => {
    const nextSales = type === 'order' ? generateNextNumber('order') : 'PV-Pendente';
    const nextBudget = generateNextNumber('budget');
    const newTitle = type === 'order' ? `Pedido #${nextSales} - Novo Cliente` : `Orçamento #${nextBudget} - Proposta Inicial`;
    setName(newTitle);
    setStatus('A Fazer');
    const defaultItems: OrderItem[] = [
      {
        id: `item-${Date.now()}`,
        code: 'PECA-01',
        description: 'Conjunto Estrutural Usinado em Aço Carbono',
        quantity: 1,
        unit: 'UN',
        unitPrice: 20000,
        taxRate: 5,
        subtotal: 20000,
      }
    ];
    setOrderItems(defaultItems);
    setNodeData({
      orderType: type,
      salesOrderNumber: nextSales,
      budgetNumber: nextBudget,
      clientOrderNumber: '',
      customerName: 'Cliente a Definir',
      customerCnpj: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      commercialStatus: type === 'order' ? 'Pedido de Venda Confirmado' : 'Orçamento em Elaboração',
      issueDate: new Date().toISOString().slice(0, 10),
      deliveryDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      shippingCost: 0,
      shippingType: 'CIF',
      carrierName: '',
      discountAmount: 0,
      taxAmount: 1000,
      itemsSubtotal: 20000,
      totalOrderValue: 21000,
      orderValue: 21000,
      paymentMethod: 'Boleto Bancário Faturado',
      paymentConditions: '30 DDL',
      deliveryLocation: '',
      commercialNotes: '',
      registeredOrderId: undefined,
    });
    setLoadedOrderFeedback(`Formulário limpo para novo ${type === 'order' ? 'Pedido de Venda' : 'Orçamento'}!`);
    setTimeout(() => {
      setLoadedOrderFeedback(null);
    }, 3000);
  };

  const handleConvertToSalesOrder = () => {
    const newSalesNum = generateNextNumber('order');
    const custName = nodeData.customerName || 'Cliente';
    const newTitle = `Pedido #${newSalesNum} - ${custName}`;
    setName(newTitle);
    setNodeType('order');
    setNodeData((prev) => ({
      ...prev,
      orderType: 'order',
      salesOrderNumber: newSalesNum,
      commercialStatus: 'Pedido de Venda Confirmado',
    }));
    setLoadedOrderFeedback(`Orçamento convertido com sucesso! Gerado Pedido de Venda ${newSalesNum}.`);
    setTimeout(() => {
      setLoadedOrderFeedback(null);
    }, 4000);
  };

  const handleGenerateSalesOrderNumber = () => {
    const nextNum = generateNextNumber('order');
    handleDataChange('salesOrderNumber', nextNum);
    if (!name || name.includes('Pedido') || name.includes('PV-')) {
      setName(`Pedido #${nextNum} - ${nodeData.customerName || 'Cliente'}`);
    }
  };

  const handleGenerateBudgetNumber = () => {
    const nextNum = generateNextNumber('budget');
    handleDataChange('budgetNumber', nextNum);
  };

  const handleSelectCustomerForOrder = (cust: RegisteredCustomer) => {
    setNodeData((prev) => ({
      ...prev,
      customerName: cust.tradeName || cust.corporateName || cust.name,
      customerCnpj: cust.cnpj,
      contactName: cust.contactName || prev.contactName,
      contactEmail: cust.email || prev.contactEmail,
      contactPhone: cust.cellphone || cust.phone || prev.contactPhone,
      paymentConditions: cust.paymentTerm || prev.paymentConditions || '30 DDL',
      deliveryLocation: cust.address || `${cust.city || 'São Paulo'} - ${cust.state || 'SP'}`,
    }));
    setIsCustomerSelectorOpen(false);
    setCustomerInOrderSearch('');
    setLoadedOrderFeedback(`Dados do cliente "${cust.name}" vinculados ao pedido!`);
    setTimeout(() => {
      setLoadedOrderFeedback(null);
    }, 3000);
  };

  const handleUpdateOrderItem = (idx: number, field: keyof OrderItem, val: any) => {
    setOrderItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : item.quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
        item.subtotal = Math.round(q * p * 100) / 100;
      }
      next[idx] = item;
      return next;
    });
  };

  const handleAddOrderItem = () => {
    const isWithoutVal = Boolean(nodeData.withoutValue);
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      code: `PECA-0${orderItems.length + 1}`,
      description: isWithoutVal ? 'Novo Item Descritivo / Especificação Técnica' : 'Novo Item / Peça Usinada',
      quantity: 1,
      unit: 'UN',
      unitPrice: isWithoutVal ? 0 : 5000,
      taxRate: isWithoutVal ? 0 : 5,
      subtotal: isWithoutVal ? 0 : 5000,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  const handleClearItemPrices = () => {
    setOrderItems((prev) =>
      prev.map((item) => ({
        ...item,
        unitPrice: 0,
        taxRate: 0,
        subtotal: 0,
      }))
    );
  };

  const handleRemoveOrderItem = (idx: number) => {
    if (orderItems.length <= 1) {
      alert('O pedido deve conter pelo menos 1 item.');
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let finalData = { 
      ...nodeData,
      connectionPointsPerSide: connectionPoints,
      enableGlow: enableGlow,
    };
    if (nodeType === 'kanban') {
      finalData.columns = kanbanColumns;
    }
    let finalName = name;

    if (nodeType === 'customer') {
      const composedAddr = nodeData.street
        ? `${nodeData.street}${nodeData.number ? ', ' + nodeData.number : ''}${nodeData.neighborhood ? ' - ' + nodeData.neighborhood : ''} - ${nodeData.city || 'São Paulo'}, ${nodeData.state || 'SP'}`
        : (nodeData.address || `${nodeData.city || 'São Paulo'} - ${nodeData.state || 'SP'}`);

      finalName = nodeData.tradeName || nodeData.corporateName || name || 'Novo Cliente';
      finalData.address = composedAddr;
      finalData.personType = customerPersonType;
      finalData.tradeName = nodeData.tradeName || finalName;
      finalData.corporateName = nodeData.corporateName || finalName;
      finalData.city = nodeData.city || 'São Paulo';
      finalData.state = nodeData.state || 'SP';

      if (saveToRegistry) {
        const savedCustomer = saveCustomerToRegistry({
          id: nodeData.registeredCustomerId,
          name: finalName,
          corporateName: finalData.corporateName,
          tradeName: finalData.tradeName,
          cnpj: nodeData.cnpj || '00.000.000/0001-00',
          personType: customerPersonType,
          stateRegistration: nodeData.stateRegistration,
          municipalRegistration: nodeData.municipalRegistration,
          customerSegment: nodeData.customerSegment || 'Manufatura & Indústria',
          status: (status as any) || 'Ativo',
          contactName: nodeData.contactName || 'Contato Comercial',
          contactRole: nodeData.contactRole,
          phone: nodeData.phone,
          cellphone: nodeData.cellphone,
          email: nodeData.email || '',
          billingEmail: nodeData.billingEmail,
          website: nodeData.website,
          zipCode: nodeData.zipCode,
          street: nodeData.street,
          number: nodeData.number,
          complement: nodeData.complement,
          neighborhood: nodeData.neighborhood,
          city: nodeData.city || 'São Paulo',
          state: nodeData.state || 'SP',
          address: composedAddr,
          paymentTerm: nodeData.paymentTerm || '30 DDL',
          creditLimit: Number(nodeData.creditLimit) || 0,
          totalRevenue: nodeData.totalRevenue || 'R$ 0',
          ordersCount: Number(nodeData.ordersCount) || 1,
          notes: nodeData.notes || '',
        });
        finalData.registeredCustomerId = savedCustomer.id;
      }
    }

    if (nodeType === 'order' || nodeType === 'budget') {
      const isWithoutVal = Boolean(nodeData.withoutValue);
      const currentItems = orderItems.length > 0 ? orderItems : (nodeData.orderItems || []);
      const subtotal = isWithoutVal ? 0 : currentItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
      const shipping = isWithoutVal ? 0 : (Number(nodeData.shippingCost) || 0);
      const discount = isWithoutVal ? 0 : (Number(nodeData.discountAmount) || 0);
      const tax = isWithoutVal ? 0 : (Number(nodeData.taxAmount) || 0);
      const totalVal = isWithoutVal ? 0 : Math.max(0, subtotal + shipping + tax - discount);

      finalData.withoutValue = isWithoutVal;
      finalData.descriptiveOnly = isWithoutVal;
      finalData.descriptiveNotes = nodeData.descriptiveNotes || '';
      finalData.orderItems = currentItems;
      finalData.itemsList = currentItems.map((i) => i.description);
      finalData.itemsSubtotal = subtotal;
      finalData.totalOrderValue = totalVal;
      finalData.orderValue = totalVal;
      finalData.salesOrderNumber = nodeData.salesOrderNumber || 'PV-4497';
      finalData.budgetNumber = nodeData.budgetNumber || 'ORC-2026-8821';
      finalData.orderType = nodeType;

      finalName = name || (finalData.orderType === 'order' 
        ? `Pedido #${finalData.salesOrderNumber} - ${finalData.customerName || 'Cliente'}`
        : `Orçamento #${finalData.budgetNumber} - ${finalData.customerName || 'Cliente'}`);

      if (saveOrderToRegistry) {
        const savedOrder = saveRegisteredOrder({
          id: nodeData.registeredOrderId,
          title: finalName,
          orderType: finalData.orderType,
          withoutValue: isWithoutVal,
          descriptiveNotes: nodeData.descriptiveNotes || '',
          salesOrderNumber: finalData.salesOrderNumber,
          budgetNumber: finalData.budgetNumber,
          clientOrderNumber: nodeData.clientOrderNumber || '',
          customerName: nodeData.customerName || 'Empresa ABC S/A',
          customerCnpj: nodeData.customerCnpj || '',
          contactName: nodeData.contactName || '',
          contactEmail: nodeData.contactEmail || '',
          contactPhone: nodeData.contactPhone || '',
          salesRep: assignee || node.assignee || 'Carlos Mendes',
          status: (nodeData.commercialStatus as any) || (finalData.orderType === 'order' ? 'Pedido de Venda Confirmado' : 'Orçamento em Elaboração'),
          issueDate: nodeData.issueDate || new Date().toISOString().slice(0, 10),
          deliveryDeadline: nodeData.deliveryDeadline || '2026-09-20',
          validUntil: nodeData.validUntil || '',
          items: currentItems,
          itemsSubtotal: subtotal,
          shippingCost: shipping,
          shippingType: nodeData.shippingType || 'CIF',
          carrierName: nodeData.carrierName || '',
          discountAmount: discount,
          taxAmount: tax,
          totalValue: totalVal,
          paymentMethod: isWithoutVal ? 'Apenas Descritivo / Sem Cobrança' : (nodeData.paymentMethod || 'Boleto Bancário Faturado'),
          paymentConditions: isWithoutVal ? 'Sem valor financeiro' : (nodeData.paymentConditions || '28/56 DDL após emissão da NF-e'),
          deliveryAddress: nodeData.deliveryLocation || '',
          commercialNotes: nodeData.commercialNotes || '',
        });
        finalData.registeredOrderId = savedOrder.id;
      }
    }

    const updated: CanvasNode = {
      ...node,
      type: nodeType,
      color: nodeType === 'order' ? 'emerald' : (nodeType === 'budget' ? 'amber' : nodeColor),
      name: finalName,
      status,
      assignee: assignee || undefined,
      tags,
      width: Number(width) || (node ? node.width : 320),
      height: Number(height) || (node ? node.height : 220),
      updatedAt: new Date().toISOString(),
      data: finalData,
    };

    onUpdateNode(updated);
    onClose();
  };

  const handleDataChange = (key: string, value: any) => {
    setNodeData((prev) => ({ ...prev, [key]: value }));
  };

  const startDate = nodeData.startDate || nodeData.deliveryDeadline || '01/09/2026';
  const dueDate = nodeData.dueDate || nodeData.deliveryDeadline || '20/09/2026';
  const cycleProgress = nodeData.projectProgress ?? nodeData.orderProgress ?? nodeData.progressPercent ?? (status === 'Concluído' ? 100 : (status === 'Em Andamento' ? 50 : 0));

  return (
    <div
      id="node-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="node-detail-modal-content"
        className={`bg-slate-900 border border-slate-700/80 w-full ${nodeType === 'customer' || nodeType === 'order' || nodeType === 'budget' ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              nodeType === 'customer'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : nodeType === 'budget'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : nodeType === 'order'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {nodeType === 'customer' ? (
                <Building2 className="w-5 h-5" />
              ) : nodeType === 'budget' ? (
                <Calculator className="w-5 h-5" />
              ) : nodeType === 'order' ? (
                <ShoppingCart className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                  nodeType === 'customer'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : nodeType === 'budget'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : nodeType === 'order'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {nodeType === 'customer' 
                    ? 'QUADRO BASE • CLIENTE (CRM)' 
                    : nodeType === 'budget'
                    ? 'QUADRO • ORÇAMENTO & PROPOSTA COMERCIAL'
                    : nodeType === 'order'
                    ? 'QUADRO • PEDIDO DE VENDA COMERCIAL (PV)'
                    : nodeType}
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {node.id}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {nodeType === 'customer'
                  ? 'Cadastro & Gestão Completa de Cliente'
                  : nodeType === 'budget'
                  ? 'Emissão & Gestão Completa de Orçamento'
                  : nodeType === 'order'
                  ? 'Emissão & Gestão de Pedido de Venda'
                  : 'Detalhes & Edição Completa do Quadro'}
              </h2>
            </div>
          </div>
          <button
            id="node-detail-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-sm">
          {nodeType === 'customer' ? (
            <div className="space-y-4">
              {/* Customer Search & Quick Register Bar */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Base Central de Clientes
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {registeredCustomers.length} cadastrados
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToNewCustomer}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors w-fit"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    + Cadastrar Novo Cliente em Branco
                  </button>
                </div>

                {/* Search Input with dropdown */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerSearchOpen(true);
                      }}
                      onFocus={() => setIsCustomerSearchOpen(true)}
                      placeholder="Buscar cliente cadastrado por Nome Fantasia, Razão Social, CNPJ, Cidade ou Segmento..."
                      className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-9 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomerSearchOpen(!isCustomerSearchOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 rounded flex items-center gap-1"
                    >
                      Ver Lista <ChevronDown className={`w-3 h-3 transition-transform ${isCustomerSearchOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Results */}
                  {isCustomerSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-800">
                      <div className="p-2 bg-slate-950/90 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>Selecione para preencher este quadro com os dados cadastrais:</span>
                        <button
                          type="button"
                          onClick={() => setIsCustomerSearchOpen(false)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Fechar
                        </button>
                      </div>
                      {filteredRegisteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Nenhum cliente encontrado para "{customerSearchQuery}".
                          <button
                            type="button"
                            onClick={handleResetToNewCustomer}
                            className="block mx-auto mt-2 text-blue-400 hover:underline text-xs"
                          >
                            Cadastrar como novo cliente
                          </button>
                        </div>
                      ) : (
                        filteredRegisteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectRegisteredCustomer(c)}
                            className="w-full text-left p-3 hover:bg-blue-600/10 transition-colors flex items-start justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white group-hover:text-blue-300">
                                  {c.tradeName || c.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {c.personType}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  {c.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {c.corporateName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                                <span>CNPJ: {c.cnpj}</span>
                                <span>📍 {c.city}/{c.state}</span>
                                <span>🏷️ {c.customerSegment}</span>
                                <span>👤 {c.contactName}</span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <Check className="w-3 h-3" /> Preencher
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {loadedCustomerFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{loadedCustomerFeedback}</span>
                  </div>
                )}
              </div>

              {/* 4 Tabs Selector */}
              <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCustomerActiveTab('identificacao')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    customerActiveTab === 'identificacao'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  1. Identificação & Fiscal
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerActiveTab('contato')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    customerActiveTab === 'contato'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  2. Contatos & Comunicação
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerActiveTab('endereco')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    customerActiveTab === 'endereco'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  3. Endereço Completo
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerActiveTab('comercial')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    customerActiveTab === 'comercial'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  4. Comercial & Observações
                </button>
              </div>

              {/* Tab 1: Identificação & Fiscal */}
              {customerActiveTab === 'identificacao' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Razão Social (Nome Oficial) *
                      </label>
                      <input
                        type="text"
                        value={nodeData.corporateName || ''}
                        onChange={(e) => {
                          handleDataChange('corporateName', e.target.value);
                          if (!name || name === 'Cliente' || name === 'Novo Cliente') {
                            setName(e.target.value);
                          }
                        }}
                        placeholder="Ex: Indústrias Metalúrgicas Alvorada Ltda"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Nome Fantasia (Exibição no Quadro) *
                      </label>
                      <input
                        type="text"
                        value={nodeData.tradeName || name || ''}
                        onChange={(e) => {
                          setName(e.target.value);
                          handleDataChange('tradeName', e.target.value);
                        }}
                        placeholder="Ex: Metalúrgica Alvorada"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Tipo de Pessoa
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerPersonType('PJ');
                            handleDataChange('personType', 'PJ');
                          }}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            customerPersonType === 'PJ'
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          Pessoa Jurídica (PJ)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerPersonType('PF');
                            handleDataChange('personType', 'PF');
                          }}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            customerPersonType === 'PF'
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          Pessoa Física (PF)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        {customerPersonType === 'PJ' ? 'CNPJ' : 'CPF'} *
                      </label>
                      <input
                        type="text"
                        value={nodeData.cnpj || ''}
                        onChange={(e) => handleDataChange('cnpj', e.target.value)}
                        placeholder={customerPersonType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Inscrição Estadual (IE)
                      </label>
                      <input
                        type="text"
                        value={nodeData.stateRegistration || ''}
                        onChange={(e) => handleDataChange('stateRegistration', e.target.value)}
                        placeholder="Ex: 112.334.556.789 ou Isento"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Inscrição Municipal (IM)
                      </label>
                      <input
                        type="text"
                        value={nodeData.municipalRegistration || ''}
                        onChange={(e) => handleDataChange('municipalRegistration', e.target.value)}
                        placeholder="Ex: 987654-0"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Ramo de Atuação / Segmento
                      </label>
                      <input
                        list="customer-segments-list"
                        type="text"
                        value={nodeData.customerSegment || ''}
                        onChange={(e) => handleDataChange('customerSegment', e.target.value)}
                        placeholder="Ex: Manufatura & Metalmecânica"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <datalist id="customer-segments-list">
                        <option value="Manufatura & Metalmecânica" />
                        <option value="Usinagem & Caldeiraria" />
                        <option value="Construção Civil & Infraestrutura" />
                        <option value="Automação Industrial & Robótica" />
                        <option value="Máquinas & Implementos Agrícolas" />
                        <option value="Indústria Automotiva & Autopeças" />
                        <option value="Alimentos & Bebidas" />
                        <option value="Química & Petroquímica" />
                        <option value="Papel, Celulose & Embalagens" />
                        <option value="Distribuição & Logística" />
                      </datalist>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contatos & Comunicação */}
              {customerActiveTab === 'contato' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" /> Contato Principal (Nome)
                      </label>
                      <input
                        type="text"
                        value={nodeData.contactName || ''}
                        onChange={(e) => handleDataChange('contactName', e.target.value)}
                        placeholder="Ex: Carlos Eduardo de Oliveira"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Cargo / Departamento
                      </label>
                      <input
                        type="text"
                        value={nodeData.contactRole || ''}
                        onChange={(e) => handleDataChange('contactRole', e.target.value)}
                        placeholder="Ex: Gerente de Compras & Suprimentos"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Telefone Comercial Fixo
                      </label>
                      <input
                        type="text"
                        value={nodeData.phone || ''}
                        onChange={(e) => handleDataChange('phone', e.target.value)}
                        placeholder="Ex: (11) 3456-7890"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Celular / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={nodeData.cellphone || ''}
                        onChange={(e) => handleDataChange('cellphone', e.target.value)}
                        placeholder="Ex: (11) 98765-4321"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-400" /> E-mail Comercial / Cotações
                      </label>
                      <input
                        type="email"
                        value={nodeData.email || ''}
                        onChange={(e) => handleDataChange('email', e.target.value)}
                        placeholder="compras@cliente.com.br"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-purple-400" /> E-mail Financeiro / XML NF-e
                      </label>
                      <input
                        type="email"
                        value={nodeData.billingEmail || ''}
                        onChange={(e) => handleDataChange('billingEmail', e.target.value)}
                        placeholder="nfe@cliente.com.br"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website / Portal
                      </label>
                      <input
                        type="text"
                        value={nodeData.website || ''}
                        onChange={(e) => handleDataChange('website', e.target.value)}
                        placeholder="https://www.cliente.com.br"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" /> Responsável Interno (Assignee / Vendedor)
                      </label>
                      <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="Ex: Roberto Mendes (Comercial Interno)"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Endereço Completo */}
              {customerActiveTab === 'endereco' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> CEP
                      </label>
                      <input
                        type="text"
                        value={nodeData.zipCode || ''}
                        onChange={(e) => handleDataChange('zipCode', e.target.value)}
                        placeholder="00000-000"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Logradouro (Rua, Avenida, Rodovia)
                      </label>
                      <input
                        type="text"
                        value={nodeData.street || ''}
                        onChange={(e) => handleDataChange('street', e.target.value)}
                        placeholder="Ex: Av. das Indústrias Metalúrgicas"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={nodeData.number || ''}
                        onChange={(e) => handleDataChange('number', e.target.value)}
                        placeholder="Ex: 1500 ou S/N"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={nodeData.complement || ''}
                        onChange={(e) => handleDataChange('complement', e.target.value)}
                        placeholder="Ex: Galpão 03, Bloco B"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={nodeData.neighborhood || ''}
                        onChange={(e) => handleDataChange('neighborhood', e.target.value)}
                        placeholder="Ex: Distrito Industrial"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={nodeData.city || ''}
                        onChange={(e) => handleDataChange('city', e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Estado (UF)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={nodeData.state || ''}
                        onChange={(e) => handleDataChange('state', e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Comercial & Observações */}
              {customerActiveTab === 'comercial' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Status Cadastral
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as NodeStatus)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Em Andamento">Em Negociação</option>
                        <option value="A Fazer">Prospecção</option>
                        <option value="Bloqueado">Bloqueado / Inadimplente</option>
                        <option value="Concluído">Inativo / Arquivado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Condição de Pagamento
                      </label>
                      <input
                        type="text"
                        value={nodeData.paymentTerm || ''}
                        onChange={(e) => handleDataChange('paymentTerm', e.target.value)}
                        placeholder="Ex: 30 DDL ou 28/56 DDL"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Limite de Crédito (R$)
                      </label>
                      <input
                        type="number"
                        value={nodeData.creditLimit ?? 50000}
                        onChange={(e) => handleDataChange('creditLimit', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Faturamento Histórico Acumulado
                      </label>
                      <input
                        type="text"
                        value={nodeData.totalRevenue || 'R$ 0'}
                        onChange={(e) => handleDataChange('totalRevenue', e.target.value)}
                        placeholder="Ex: R$ 380.000"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Quantidade de Pedidos Ativos
                      </label>
                      <input
                        type="number"
                        value={nodeData.ordersCount ?? 1}
                        onChange={(e) => handleDataChange('ordersCount', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-pink-400" /> Tags / Rótulos
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="ex: vip, direto, pecas-pesadas"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                      Observações Gerais & Requisitos de Entrega / Notas Fiscais
                    </label>
                    <textarea
                      rows={3}
                      value={nodeData.notes || ''}
                      onChange={(e) => handleDataChange('notes', e.target.value)}
                      placeholder="Insira observações relevantes sobre o cliente, restrições de descarga, laudos técnicos exigidos, etc..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Central Registry Synchronization Checkbox */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    id="sync-to-registry-checkbox"
                    type="checkbox"
                    checked={saveToRegistry}
                    onChange={(e) => setSaveToRegistry(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="sync-to-registry-checkbox" className="text-xs text-slate-300 cursor-pointer select-none">
                    <span className="font-semibold text-blue-300">Salvar / Atualizar na Base Central de Clientes</span> (permite buscar e reutilizar em outros fluxos)
                  </label>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Base Geral Ativa</span>
                </div>
              </div>
            </div>
          ) : (nodeType === 'order' || nodeType === 'budget') ? (
            <div className="space-y-4">
              {/* Order/Budget Search Bar & Quick Fill */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 ${nodeType === 'budget' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <Search className="w-3.5 h-3.5" />
                    {nodeType === 'budget' 
                      ? 'Buscar Orçamentos da Base ou Criar Novo' 
                      : 'Buscar Pedidos da Base ou Criar Novo'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {nodeType === 'order' && (
                      <button
                        type="button"
                        onClick={() => handleResetToNewOrder('order')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                        title="Limpar e criar novo Pedido de Venda"
                      >
                        <Plus className="w-3 h-3" />
                        + Novo Pedido (PV)
                      </button>
                    )}
                    {nodeType === 'budget' && (
                      <button
                        type="button"
                        onClick={() => handleResetToNewOrder('budget')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors"
                        title="Limpar e criar novo Orçamento"
                      >
                        <Plus className="w-3 h-3" />
                        + Novo Orçamento (ORC)
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => {
                          setOrderSearchQuery(e.target.value);
                          setIsOrderSearchOpen(true);
                        }}
                        onFocus={() => setIsOrderSearchOpen(true)}
                        placeholder={nodeType === 'budget' 
                          ? "Buscar por Nº Orçamento (ORC), Cliente, CNPJ, Vendedor..." 
                          : "Buscar por Nº Pedido (PV), Cliente, CNPJ, Vendedor..."}
                        className={`w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-${nodeType === 'budget' ? 'amber' : 'emerald'}-500`}
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      {orderSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderSearchQuery('');
                          }}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOrderSearchOpen(!isOrderSearchOpen)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1 border border-slate-700 transition-colors"
                    >
                      <span>Ver Cadastrados ({registeredOrders.length})</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Registered Orders Dropdown List */}
                  {isOrderSearchOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-800">
                      {filteredRegisteredOrders.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Nenhum pedido ou orçamento encontrado com o termo "{orderSearchQuery}".
                        </div>
                      ) : (
                        filteredRegisteredOrders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => handleSelectRegisteredOrder(ord)}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  ord.orderType === 'budget'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {ord.salesOrderNumber || ord.budgetNumber}
                                </span>
                                {ord.budgetNumber && ord.salesOrderNumber && ord.orderType === 'order' && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    (Orç: {ord.budgetNumber})
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-white truncate">
                                  {ord.customerName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                                <span>{ord.title}</span>
                                {ord.customerCnpj && <span className="font-mono text-slate-500">{ord.customerCnpj}</span>}
                                {ord.salesRep && <span>Resp: {ord.salesRep}</span>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-mono font-bold text-emerald-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ord.totalValue)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {ord.status}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Feedback pill */}
                {loadedOrderFeedback && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{loadedOrderFeedback}</span>
                  </div>
                )}
              </div>

              {/* Order Type Selector, Conversion & Summary Bar */}
              <div className={`p-3 rounded-xl bg-slate-950/60 border ${nodeType === 'budget' ? 'border-amber-900/50' : 'border-emerald-900/50'} flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Tipo:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-900 border border-slate-800">
                    <div
                      className={`px-3 py-1 text-xs font-medium rounded-md shadow-sm ${
                        nodeType === 'order'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-slate-950 font-bold'
                      }`}
                    >
                      {nodeType === 'order' ? 'Pedido de Venda (PV)' : 'Orçamento / Proposta (ORC)'}
                    </div>
                  </div>

                  {nodeType === 'budget' && (
                    <button
                      type="button"
                      onClick={handleConvertToSalesOrder}
                      className="ml-2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                      title="Transformar este orçamento em um Pedido de Venda oficial com numeração PV"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Converter em Pedido de Venda</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      {nodeData.withoutValue ? 'Modalidade do Pedido' : `Total do ${nodeType === 'budget' ? 'Orçamento' : 'Pedido'} Comercial`}
                    </span>
                    {nodeData.withoutValue ? (
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 text-sky-400" />
                        Apenas Descritivo (Sem Valor)
                      </span>
                    ) : (
                      <span className={`text-sm font-mono font-bold ${nodeType === 'budget' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Order/Budget */}
              <div className="flex border-b border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setOrderActiveTab('geral')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                    orderActiveTab === 'geral'
                      ? nodeType === 'budget' ? 'border-amber-500 text-amber-300 bg-amber-950/20' : 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Identificação & Vínculos
                </button>
                <button
                  type="button"
                  onClick={() => setOrderActiveTab('itens')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                    orderActiveTab === 'itens'
                      ? nodeType === 'budget' ? 'border-amber-500 text-amber-300 bg-amber-950/20' : 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Itens do {nodeType === 'budget' ? 'Orçamento' : 'Pedido'} ({orderItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderActiveTab('condicoes')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                    orderActiveTab === 'condicoes'
                      ? nodeType === 'budget' ? 'border-amber-500 text-amber-300 bg-amber-950/20' : 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Condições, Frete & Totalizador
                </button>
              </div>

              {/* TAB 1: IDENTIFICAÇÃO & VÍNCULOS */}
              {orderActiveTab === 'geral' && (
                <div className="space-y-3.5">
                  {/* Card: Pedido sem valor comercial (Apenas descritivo de informação) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    nodeData.withoutValue
                      ? 'bg-sky-950/30 border-sky-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="order-without-value-checkbox"
                          type="checkbox"
                          checked={Boolean(nodeData.withoutValue)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleDataChange('withoutValue', checked);
                            handleDataChange('descriptiveOnly', checked);
                            if (checked) {
                              handleDataChange('orderValue', 0);
                              handleDataChange('totalOrderValue', 0);
                            }
                          }}
                          className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="order-without-value-checkbox" className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span>Pedido sem valor comercial (Apenas dados descritivos de informação)</span>
                            {nodeData.withoutValue && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-medium">
                                Modo Informativo Ativo
                              </span>
                            )}
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Permite manter o pedido de venda sem valor financeiro ou cobrança, contendo apenas dados descritivos, especificações técnicas, escopo de fornecimento e instruções de execução.
                          </p>
                        </div>
                      </div>
                    </div>

                    {nodeData.withoutValue && (
                      <div className="mt-3 pt-3 border-t border-sky-500/20 space-y-1.5">
                        <label className="block text-xs font-mono font-semibold text-sky-300">
                          Dados Descritivos, Escopo Técnico e Informações do Pedido:
                        </label>
                        <textarea
                          rows={3}
                          value={nodeData.descriptiveNotes || ''}
                          onChange={(e) => handleDataChange('descriptiveNotes', e.target.value)}
                          placeholder="Exemplo: Escopo de montagem mecânica conforme desenho ENG-4002. Requisitos de tolerância H7. Fornecimento puramente para homologação técnica interna, sem faturamento comercial..."
                          className="w-full bg-slate-950 border border-sky-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-sans leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 1: Order Numbers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-mono font-semibold text-slate-300">
                          Nº Ordem de Orçamento
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateBudgetNumber}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                          title="Gerar próximo número de orçamento"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Gerar Próx.
                        </button>
                      </div>
                      <input
                        type="text"
                        value={nodeData.budgetNumber || ''}
                        onChange={(e) => handleDataChange('budgetNumber', e.target.value)}
                        placeholder="ORC-2026-8821"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-mono font-semibold text-slate-300">
                          Nº Pedido de Venda (PV)
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSalesOrderNumber}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                          title="Gerar próximo número de pedido de venda"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Gerar Próx.
                        </button>
                      </div>
                      <input
                        type="text"
                        value={nodeData.salesOrderNumber || ''}
                        onChange={(e) => handleDataChange('salesOrderNumber', e.target.value)}
                        placeholder="PV-4497"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Ordem de Compra Cliente (PO/OC)
                      </label>
                      <input
                        type="text"
                        value={nodeData.clientOrderNumber || ''}
                        onChange={(e) => handleDataChange('clientOrderNumber', e.target.value)}
                        placeholder="OC-90214/26"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Title & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Título / Descrição do Pedido no Quadro
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: Pedido #PV-4497 - Empresa ABC S/A"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Status Comercial
                      </label>
                      <select
                        value={nodeData.commercialStatus || (nodeData.orderType === 'order' ? 'Pedido de Venda Confirmado' : 'Orçamento em Elaboração')}
                        onChange={(e) => {
                          handleDataChange('commercialStatus', e.target.value);
                          if (e.target.value === 'Faturado') setStatus('Concluído');
                          else if (e.target.value === 'Em Produção') setStatus('Em Andamento');
                          else setStatus('A Fazer');
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Orçamento em Elaboração">Orçamento em Elaboração</option>
                        <option value="Orçamento Enviado">Orçamento Enviado ao Cliente</option>
                        <option value="Aprovado pelo Cliente">Aprovado pelo Cliente</option>
                        <option value="Pedido de Venda Confirmado">Pedido de Venda Confirmado</option>
                        <option value="Em Produção">Em Produção na Fábrica</option>
                        <option value="Faturado">Faturado / Despachado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Client Selector from Registered Customers */}
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-blue-300 font-bold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Cliente Vinculado ao Pedido
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCustomerSelectorOpen(!isCustomerSelectorOpen)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 flex items-center gap-1 transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          <span>Buscar na Base de Clientes ({registeredCustomers.length})</span>
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>

                        {isCustomerSelectorOpen && (
                          <div className="absolute right-0 top-full mt-1 z-40 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 divide-y divide-slate-800">
                            <input
                              type="text"
                              value={customerInOrderSearch}
                              onChange={(e) => setCustomerInOrderSearch(e.target.value)}
                              placeholder="Filtrar por nome, CNPJ ou cidade..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white mb-2 focus:outline-none focus:border-blue-500"
                            />
                            <div className="max-h-52 overflow-y-auto space-y-1 pt-1">
                              {filteredCustomersForOrder.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => handleSelectCustomerForOrder(c)}
                                  className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-left"
                                >
                                  <div className="text-xs font-semibold text-white">{c.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span className="font-mono">{c.cnpj}</span>
                                    <span>{c.city} - {c.state}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">Razão Social / Nome Fantasia</label>
                        <input
                          type="text"
                          value={nodeData.customerName || ''}
                          onChange={(e) => handleDataChange('customerName', e.target.value)}
                          placeholder="Empresa ABC S/A"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">CNPJ do Cliente</label>
                        <input
                          type="text"
                          value={nodeData.customerCnpj || ''}
                          onChange={(e) => handleDataChange('customerCnpj', e.target.value)}
                          placeholder="12.345.678/0001-90"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Contato no Cliente</label>
                        <input
                          type="text"
                          value={nodeData.contactName || ''}
                          onChange={(e) => handleDataChange('contactName', e.target.value)}
                          placeholder="Renata Valente"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Telefone / Celular</label>
                        <input
                          type="text"
                          value={nodeData.contactPhone || ''}
                          onChange={(e) => handleDataChange('contactPhone', e.target.value)}
                          placeholder="(11) 98765-4321"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">E-mail Comercial</label>
                        <input
                          type="email"
                          value={nodeData.contactEmail || ''}
                          onChange={(e) => handleDataChange('contactEmail', e.target.value)}
                          placeholder="compras@cliente.com"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Vendedor / Responsável</label>
                        <input
                          type="text"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                          placeholder="Carlos Mendes"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Data de Emissão / Proposta
                      </label>
                      <input
                        type="date"
                        value={nodeData.issueDate || ''}
                        onChange={(e) => handleDataChange('issueDate', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Prazo de Entrega / Despacho
                      </label>
                      <input
                        type="date"
                        value={nodeData.deliveryDeadline || ''}
                        onChange={(e) => handleDataChange('deliveryDeadline', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                        Validade da Proposta / Orçamento
                      </label>
                      <input
                        type="date"
                        value={nodeData.validUntil || ''}
                        onChange={(e) => handleDataChange('validUntil', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ITENS DO PEDIDO */}
              {orderActiveTab === 'itens' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      Composição de Itens, Peças e Serviços Usinados
                    </span>
                    <div className="flex items-center gap-2">
                      {nodeData.withoutValue && (
                        <button
                          type="button"
                          onClick={handleClearItemPrices}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 flex items-center gap-1 transition-colors"
                          title="Zerar todos os preços unitários mantendo apenas a descrição e quantidade das peças"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          Zerar Preços dos Itens
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddOrderItem}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Adicionar Item ao Pedido
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                            <th className="p-2.5 w-24">Código/Desenho</th>
                            <th className="p-2.5 min-w-[200px]">Descrição da Peça / Serviço</th>
                            <th className="p-2.5 w-16 text-center">Qtd</th>
                            <th className="p-2.5 w-16 text-center">Unid.</th>
                            <th className="p-2.5 w-28 text-right">
                              Valor Unit. (R$)
                              {nodeData.withoutValue && <span className="text-[8px] text-sky-400 block font-normal">(Opcional)</span>}
                            </th>
                            <th className="p-2.5 w-16 text-center">IPI (%)</th>
                            <th className="p-2.5 w-28 text-right">Subtotal (R$)</th>
                            <th className="p-2.5 w-12 text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {orderItems.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.code || ''}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'code', e.target.value)}
                                  placeholder="PECA-01"
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-1.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'description', e.target.value)}
                                  placeholder="Descrição detalhada..."
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'quantity', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-1 py-1 text-xs text-center font-mono text-white focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.unit}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'unit', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-1 py-1 text-xs text-center font-mono text-white focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="UN">UN</option>
                                  <option value="PC">PC</option>
                                  <option value="KG">KG</option>
                                  <option value="CJ">CJ</option>
                                  <option value="M">M</option>
                                  <option value="LOT">LOT</option>
                                  <option value="HR">HR</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'unitPrice', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-2 py-1 text-xs text-right font-mono text-white focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.taxRate ?? 0}
                                  onChange={(e) => handleUpdateOrderItem(idx, 'taxRate', Number(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700/60 rounded px-1 py-1 text-xs text-center font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="p-2 text-right font-mono font-semibold">
                                {nodeData.withoutValue && item.subtotal === 0 ? (
                                  <span className="text-sky-400 text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-sky-950/50 border border-sky-500/20">
                                    Descritivo
                                  </span>
                                ) : (
                                  <span className="text-emerald-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(idx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Remover item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">
                        Total de itens: <strong className="text-white">{orderItems.length}</strong> | Quantidade somada: <strong className="text-white">{orderItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono uppercase">Subtotal dos Produtos:</span>
                        <span className="text-sm font-mono font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemsSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONDIÇÕES COMERCIAIS & TOTALIZADOR */}
              {orderActiveTab === 'condicoes' && (
                <div className="space-y-4">
                  {/* Freight & Logistics */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      Frete & Logística de Entrega
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Modalidade do Frete</label>
                        <select
                          value={nodeData.shippingType || 'CIF'}
                          onChange={(e) => handleDataChange('shippingType', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="CIF">CIF (Por conta do vendedor / incluso)</option>
                          <option value="FOB">FOB (Por conta do destinatário / cliente)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Valor do Frete (R$)</label>
                        <input
                          type="number"
                          value={nodeData.shippingCost ?? 0}
                          onChange={(e) => handleDataChange('shippingCost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Transportadora Indicada</label>
                        <input
                          type="text"
                          value={nodeData.carrierName || ''}
                          onChange={(e) => handleDataChange('carrierName', e.target.value)}
                          placeholder="Jamef, Braspress, etc."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment & Taxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        Condições de Faturamento & Pagamento
                      </span>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Forma de Pagamento</label>
                        <select
                          value={nodeData.paymentMethod || 'Boleto Bancário Faturado'}
                          onChange={(e) => handleDataChange('paymentMethod', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Boleto Bancário Faturado">Boleto Bancário Faturado</option>
                          <option value="Faturamento Direto">Faturamento Direto</option>
                          <option value="Depósito / TED / PIX">Depósito / TED / PIX</option>
                          <option value="Cartão BNDES / Finame">Cartão BNDES / Finame</option>
                          <option value="Carta de Crédito (LC)">Carta de Crédito (LC)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Condição de Pagamento (Prazos)</label>
                        <input
                          type="text"
                          value={nodeData.paymentConditions || ''}
                          onChange={(e) => handleDataChange('paymentConditions', e.target.value)}
                          placeholder="ex: 28/56 DDL após emissão da NF-e"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-emerald-400" />
                        Descontos & Impostos Finais
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Descontos (-) R$</label>
                          <input
                            type="number"
                            value={nodeData.discountAmount ?? 0}
                            onChange={(e) => handleDataChange('discountAmount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs font-mono text-rose-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Impostos Adicionais (+) R$</label>
                          <input
                            type="number"
                            value={nodeData.taxAmount ?? 0}
                            onChange={(e) => handleDataChange('taxAmount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Local / Endereço de Entrega</label>
                        <input
                          type="text"
                          value={nodeData.deliveryLocation || ''}
                          onChange={(e) => handleDataChange('deliveryLocation', e.target.value)}
                          placeholder="Av. Industrial, Galpão 4..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complete Commercial Total Calculation Card */}
                  {nodeData.withoutValue ? (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/40 via-slate-950/80 to-slate-950 border border-sky-500/40 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-sky-400" />
                            <span className="text-xs text-sky-300 uppercase font-mono font-bold tracking-wider">
                              PEDIDO SEM VALOR COMERCIAL
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                              Apenas Informativo / Descritivo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 max-w-xl leading-relaxed">
                            Este pedido está configurado com dados exclusivamente descritivos de informação. Valores monetários, fretes e impostos não são cobrados ou somados nesta emissão.
                          </p>
                        </div>
                        <div className="text-lg sm:text-xl font-mono font-bold text-sky-300 px-3 py-1.5 rounded-lg bg-sky-950/70 border border-sky-500/30 self-start sm:self-auto shadow-inner">
                          SEM VALOR
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-950/80 to-slate-950 border border-emerald-500/30">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono mb-3 pb-3 border-b border-white/5">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Subtotal dos Produtos</span>
                          <span className="text-white font-semibold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemsSubtotal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">(+) Frete</span>
                          <span className="text-slate-200">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(nodeData.shippingCost) || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">(+) Impostos / IPI</span>
                          <span className="text-amber-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(nodeData.taxAmount) || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">(-) Descontos</span>
                          <span className="text-rose-400">
                            - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(nodeData.discountAmount) || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs text-emerald-300 uppercase font-mono font-bold tracking-wider">
                            VALOR TOTAL DO PEDIDO COMERCIAL
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Valor faturado final contemplando itens, frete, impostos e deduções.
                          </p>
                        </div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 drop-shadow">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commercial Notes */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                      Observações Comerciais, Cláusulas e Instruções Técnicas
                    </label>
                    <textarea
                      rows={3}
                      value={nodeData.commercialNotes || ''}
                      onChange={(e) => handleDataChange('commercialNotes', e.target.value)}
                      placeholder="Insira cláusulas de garantia, laudos técnicos exigidos, restrições de descarga, inspeção final com cliente..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Central Registry Synchronization Checkbox for Orders */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    id="sync-order-registry-checkbox"
                    type="checkbox"
                    checked={saveOrderToRegistry}
                    onChange={(e) => setSaveOrderToRegistry(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="sync-order-registry-checkbox" className="text-xs text-slate-300 cursor-pointer select-none">
                    <span className="font-semibold text-emerald-300">Salvar / Atualizar na Base Central de Pedidos e Orçamentos</span> (permite buscar e reutilizar em outros fluxos)
                  </label>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Base de Pedidos Ativa</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase">
                    Título / Nome do Quadro
                  </label>
                  <input
                    id="node-detail-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Nome do quadro..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase">
                    Status Operacional
                  </label>
                  <select
                    id="node-detail-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as NodeStatus)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="A Fazer">A Fazer</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Revisão">Revisão</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Responsável (Assignee)
                  </label>
                  <input
                    id="node-detail-assignee"
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Ana Silva"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-pink-400" /> Subgrupos / Tags (separados por vírgula)
                  </label>
                  <input
                    id="node-detail-tags"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="ex: urgente, producao, alfa"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-800/80 my-4" />

              {/* Customização e Aparência do Quadro */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Customização & Aparência Visual
                </h4>

                {/* Accent Theme Color Selector */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Cor do Tema de Destaque do Quadro
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'slate', bg: 'bg-slate-500', label: 'Cinza' },
                      { name: 'blue', bg: 'bg-blue-500', label: 'Azul' },
                      { name: 'emerald', bg: 'bg-emerald-500', label: 'Verde' },
                      { name: 'amber', bg: 'bg-amber-500', label: 'Amarelo' },
                      { name: 'rose', bg: 'bg-rose-500', label: 'Rosa' },
                      { name: 'purple', bg: 'bg-purple-500', label: 'Roxo' },
                      { name: 'cyan', bg: 'bg-cyan-500', label: 'Ciano' },
                      { name: 'indigo', bg: 'bg-indigo-500', label: 'Índigo' },
                      { name: 'orange', bg: 'bg-orange-500', label: 'Laranja' },
                    ].map((c) => {
                      const isActive = nodeColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setNodeColor(c.name as NodeColor)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isActive
                              ? `bg-slate-900 border-slate-200 text-white shadow-md shadow-white/5`
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                          title={c.label}
                        >
                          <span className={`w-3 h-3 rounded-full ${c.bg} shrink-0`} />
                          <span>{c.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-slate-100 ml-1 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider for Width & Height */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-slate-400 uppercase">Largura do Quadro</span>
                      <span className="text-white font-bold">{width}px</span>
                    </div>
                    <input
                      type="range"
                      min="260"
                      max="600"
                      step="10"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-slate-400 uppercase">Altura do Quadro</span>
                      <span className="text-white font-bold">{height}px</span>
                    </div>
                    <input
                      type="range"
                      min="180"
                      max="600"
                      step="10"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Connection points count & Glow Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-slate-400 uppercase">Pontos de Conexão (por lado)</span>
                      <span className="text-white font-bold">{connectionPoints}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="1"
                      value={connectionPoints}
                      onChange={(e) => setConnectionPoints(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-mono text-slate-400 uppercase block">Efeito Glow (Brilho Neon)</span>
                      <span className="text-[10px] text-slate-500 block">Ativa brilho luminoso ao redor do quadro</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableGlow}
                        onChange={(e) => setEnableGlow(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Kanban Column Customizer if type is Kanban */}
              {nodeType === 'kanban' && (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Gestão das Colunas do Kanban ({kanbanColumns.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `col-${Date.now()}`;
                        setKanbanColumns([
                          ...kanbanColumns,
                          { id: newId, title: 'NOVA COLUNA', color: '#a855f7' }
                        ]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-950/40 hover:shadow-sky-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Coluna
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {kanbanColumns.map((col, idx) => (
                      <div key={col.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              Coluna {idx + 1}
                            </label>
                            {kanbanColumns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setKanbanColumns(kanbanColumns.filter((c) => c.id !== col.id));
                                }}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
                                title="Excluir Coluna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={col.title}
                            onChange={(e) => {
                              const next = [...kanbanColumns];
                              next[idx] = { ...col, title: e.target.value.toUpperCase() };
                              setKanbanColumns(next);
                            }}
                            placeholder="TÍTULO DA COLUNA"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-sky-500 uppercase"
                          />
                        </div>
                        
                        <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cor do Indicador</span>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: col.color || '#3b82f6' }}
                            />
                            <input
                              type="color"
                              value={col.color || '#3b82f6'}
                              onChange={(e) => {
                                const next = [...kanbanColumns];
                                next[idx] = { ...col, color: e.target.value };
                                setKanbanColumns(next);
                              }}
                              className="w-7 h-7 bg-transparent border-0 p-0 rounded cursor-pointer shrink-0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}



          {/* Dynamic Type-specific properties */}
          {node.type === 'financial_module' && (
            <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-500/30 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">⚙️ Parâmetros Financeiros & Fiscais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Receita Bruta (R$)</label>
                  <input
                    type="number"
                    value={nodeData.grossRevenue || 450000}
                    onChange={(e) => handleDataChange('grossRevenue', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Custos de Produção (R$)</label>
                  <input
                    type="number"
                    value={nodeData.productionCost || 260000}
                    onChange={(e) => handleDataChange('productionCost', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Impostos / Retenções (R$)</label>
                  <input
                    type="number"
                    value={nodeData.taxes || 49500}
                    onChange={(e) => handleDataChange('taxes', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Código Fiscal / NF-e</label>
                  <input
                    type="text"
                    value={nodeData.fiscalCode || ''}
                    onChange={(e) => handleDataChange('fiscalCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {node.type === 'invoice' && (
            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">🧾 Dados da Nota Fiscal (NF-e)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Número da Nota</label>
                  <input
                    type="text"
                    value={nodeData.invoiceNumber || ''}
                    onChange={(e) => handleDataChange('invoiceNumber', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    value={nodeData.invoiceValue || 0}
                    onChange={(e) => handleDataChange('invoiceValue', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {node.type === 'progress' && (
            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">📊 Etapas / Tarefas do Progresso</h4>
              <div className="space-y-2">
                {(nodeData.milestones || []).map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={m.achieved}
                      onChange={(e) => {
                        const newMilestones = [...(nodeData.milestones || [])];
                        newMilestones[idx].achieved = e.target.checked;
                        
                        const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                        const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                        
                        setNodeData(prev => ({
                          ...prev,
                          milestones: newMilestones,
                          currentValue: newProgress
                        }));
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const newMilestones = [...(nodeData.milestones || [])];
                        newMilestones[idx].name = e.target.value;
                        handleDataChange('milestones', newMilestones);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        const newMilestones = [...(nodeData.milestones || [])];
                        newMilestones.splice(idx, 1);
                        
                        const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                        const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                        
                        setNodeData(prev => ({
                          ...prev,
                          milestones: newMilestones,
                          currentValue: newProgress
                        }));
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remover Etapa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newMilestones = [...(nodeData.milestones || []), { name: 'Nova Etapa', achieved: false }];
                    
                    const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                    const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                    
                    setNodeData(prev => ({
                      ...prev,
                      milestones: newMilestones,
                      currentValue: newProgress
                    }));
                  }}
                  className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  + Adicionar Etapa
                </button>
              </div>
            </div>
          )}

          {node.type === 'production_route' && (
            <div className="p-4 bg-cyan-950/30 rounded-xl border border-cyan-500/30 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300">⚙️ Parâmetros do Roteiro de Produção</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Código do Roteiro</label>
                  <input
                    type="text"
                    value={nodeData.routeCode || ''}
                    onChange={(e) => handleDataChange('routeCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Peça / Produto Vinculado</label>
                  <input
                    type="text"
                    value={nodeData.productTarget || ''}
                    onChange={(e) => handleDataChange('productTarget', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Data de Início do Roteiro</label>
                  <input
                    type="date"
                    value={nodeData.startDate || ''}
                    onChange={(e) => handleDataChange('startDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Prazo Final do Roteiro</label>
                  <input
                    type="date"
                    value={nodeData.dueDate || ''}
                    onChange={(e) => handleDataChange('dueDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {node.type === 'custom' && (
            <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-500/30 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">⚙️ Atributos do Objeto Customizado</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Orçamento (R$)</label>
                  <input
                    type="number"
                    value={nodeData.budget || 0}
                    onChange={(e) => handleDataChange('budget', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Gasto Atual (R$)</label>
                  <input
                    type="number"
                    value={nodeData.spent || 0}
                    onChange={(e) => handleDataChange('spent', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="node-detail-modal-delete"
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Excluir Quadro
            </button>
            <button
              id="node-detail-modal-duplicate"
              onClick={() => {
                onDuplicateNode(node.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Copy className="w-4 h-4" /> Duplicar
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="node-detail-modal-cancel"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              id="node-detail-modal-save"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 text-xs font-bold transition-all"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
