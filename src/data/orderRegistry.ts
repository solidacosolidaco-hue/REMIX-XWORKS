
export interface OrderItem {
  id: string;
  code?: string;
  description: string;
  quantity: number;
  unit: string; // 'UN' | 'PC' | 'KG' | 'CJ' | 'M' | 'HR' | 'LOT'
  unitPrice: number;
  taxRate?: number; // IPI %
  subtotal: number;
}

export type CommercialOrderStatus =
  | 'Orçamento em Elaboração'
  | 'Orçamento Enviado'
  | 'Aprovado pelo Cliente'
  | 'Pedido de Venda Confirmado'
  | 'Em Produção'
  | 'Faturado'
  | 'Cancelado';

export interface RegisteredOrder {
  id: string;
  orderType: 'order' | 'budget'; // 'order' = Pedido de Venda, 'budget' = Orçamento / Proposta Comercial
  salesOrderNumber: string; // Ex: 'PV-4497'
  budgetNumber: string; // Ex: 'ORC-2026-8821' (número de ordem de orçamento)
  clientOrderNumber?: string; // Ex: 'OC-90214' / Pedido de Compra do Cliente
  title: string;
  customerId?: string;
  customerName: string;
  customerCnpj?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salesRep: string; // Vendedor / Responsável Comercial
  status: CommercialOrderStatus;
  issueDate: string; // Data de Emissão / Elaboração
  deliveryDeadline: string; // Prazo de Entrega / Previsão
  validUntil?: string; // Validade da proposta (para orçamentos)
  items: OrderItem[];
  itemsSubtotal: number;
  shippingCost: number;
  shippingType: 'CIF' | 'FOB';
  carrierName?: string;
  discountAmount: number;
  taxAmount: number; // Impostos (IPI / ICMS)
  totalValue: number; // Valor Total Líquido / Faturado (0 se for apenas descritivo)
  withoutValue?: boolean; // Pedido sem valor monetário (apenas dados descritivos/informativos)
  descriptiveNotes?: string; // Dados descritivos, escopo e especificações técnicas
  paymentMethod: string; // Boleto Bancário, Faturamento Direto, PIX
  paymentConditions: string; // Ex: 30 DDL, 28/56 DDL, 30% Sinal + 70% Entrega
  deliveryAddress?: string;
  commercialNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'industrial_canvas_order_registry_v1';

export const INITIAL_REGISTERED_ORDERS: RegisteredOrder[] = [
  {
    id: 'ord-reg-4497',
    orderType: 'order',
    salesOrderNumber: 'PV-4497',
    budgetNumber: 'ORC-2026-8821',
    clientOrderNumber: 'OC-90214/26',
    title: 'Pedido #PED-4497 - Conjunto Estrutural Usinado',
    customerId: 'cust-reg-001',
    customerName: 'Empresa ABC S/A',
    customerCnpj: '12.345.678/0001-90',
    contactName: 'Renata Valente',
    contactEmail: 'renata.valente@empresaabc.com.br',
    contactPhone: '(11) 98765-4321',
    salesRep: 'Carlos Mendes',
    status: 'Pedido de Venda Confirmado',
    issueDate: '2026-08-25',
    deliveryDeadline: '2026-09-20',
    validUntil: '2026-09-10',
    items: [
      {
        id: 'item-1',
        code: 'EST-4401',
        description: 'Estrutura metálica usinada em viga W250x38.5 com furações CNC',
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
    ],
    itemsSubtotal: 250000,
    shippingCost: 4800,
    shippingType: 'CIF',
    carrierName: 'Jamef Encomendas Urgentes',
    discountAmount: 5000,
    taxAmount: 13300,
    totalValue: 263100,
    paymentMethod: 'Boleto Bancário Faturado',
    paymentConditions: '28/56 DDL após emissão da NF-e',
    deliveryAddress: 'Av. das Indústrias, 1500 - Galpão 4, São Paulo - SP',
    commercialNotes: 'Exigido certificado de matéria-prima rastreado e ensaio por ultrassom das soldas conforme AWS D1.1.',
    createdAt: '2026-08-25T09:30:00Z',
    updatedAt: '2026-08-28T14:15:00Z',
  },
  {
    id: 'ord-reg-8822',
    orderType: 'budget',
    salesOrderNumber: 'PV-Pendente',
    budgetNumber: 'ORC-2026-8822',
    clientOrderNumber: 'COT-7718',
    title: 'Orçamento #ORC-8822 - Usinagem de Cilindros e Buchas em Bronze TM-23',
    customerId: 'cust-reg-002',
    customerName: 'Metalúrgica Alvorada Ltda',
    customerCnpj: '23.456.789/0001-01',
    contactName: 'Carlos Eduardo Oliveira',
    contactEmail: 'compras@metalurgicaalvorada.com.br',
    contactPhone: '(19) 99876-5432',
    salesRep: 'Mariana Duarte',
    status: 'Orçamento Enviado',
    issueDate: '2026-08-28',
    deliveryDeadline: '2026-09-30',
    validUntil: '2026-09-12',
    items: [
      {
        id: 'item-10',
        code: 'BRZ-102',
        description: 'Bucha usinada em bronze SAE 660 flangeada Øext 180mm x Øint 130mm x 220mm',
        quantity: 12,
        unit: 'PC',
        unitPrice: 3850,
        taxRate: 5,
        subtotal: 46200,
      },
      {
        id: 'item-11',
        code: 'EIX-4140',
        description: 'Eixo escalonado temperado por indução Aço SAE 4140 retificado h6',
        quantity: 6,
        unit: 'PC',
        unitPrice: 8900,
        taxRate: 6.5,
        subtotal: 53400,
      },
    ],
    itemsSubtotal: 99600,
    shippingCost: 1800,
    shippingType: 'FOB',
    carrierName: 'Transportes Rodoviários Braspress',
    discountAmount: 2000,
    taxAmount: 5780,
    totalValue: 105180,
    paymentMethod: 'Boleto Bancário',
    paymentConditions: '30/60 DDL',
    deliveryAddress: 'Rodovia Anhanguera, km 104 - Distrito Industrial, Campinas - SP',
    commercialNotes: 'Proposta com validade de 15 dias corridos. Variações cambiais ou de cotação do cobre acima de 5% serão renegociadas.',
    createdAt: '2026-08-28T11:00:00Z',
    updatedAt: '2026-08-28T16:00:00Z',
  },
  {
    id: 'ord-reg-4310',
    orderType: 'order',
    salesOrderNumber: 'PV-4310',
    budgetNumber: 'ORC-2026-8715',
    clientOrderNumber: 'PO-88219-A',
    title: 'Pedido #PED-4310 - Tanque de Armazenamento Aço Inox 316L 15.000L',
    customerId: 'cust-reg-004',
    customerName: 'AgroMáquinas & Implementos Brasil S/A',
    customerCnpj: '45.678.901/0001-23',
    contactName: 'Eng. Fernando Souza',
    contactEmail: 'fernando.souza@agromaquinas.ind.br',
    contactPhone: '(16) 99123-4567',
    salesRep: 'Roberto Dias',
    status: 'Em Produção',
    issueDate: '2026-08-10',
    deliveryDeadline: '2026-10-15',
    validUntil: '2026-08-20',
    items: [
      {
        id: 'item-20',
        code: 'TNQ-316L',
        description: 'Tanque cilíndrico vertical inox 316L 15.000L com camisa dimple para aquecimento',
        quantity: 1,
        unit: 'UN',
        unitPrice: 185000,
        taxRate: 5,
        subtotal: 185000,
      },
      {
        id: 'item-21',
        code: 'AGIT-03',
        description: 'Agitador mecânico tipo âncora com motoredutor SEW 7.5cv e inversor',
        quantity: 1,
        unit: 'UN',
        unitPrice: 42000,
        taxRate: 8,
        subtotal: 42000,
      },
    ],
    itemsSubtotal: 227000,
    shippingCost: 8500,
    shippingType: 'CIF',
    carrierName: 'Transpes Cargas Especiais',
    discountAmount: 0,
    taxAmount: 12610,
    totalValue: 248110,
    paymentMethod: 'Depósito / TED Bancária',
    paymentConditions: '40% Sinal no aceite + 30% no teste hidrostático + 30% no despacho',
    deliveryAddress: 'Av. Brasil Agro, 880 - Polo Tecnológico, Ribeirão Preto - SP',
    commercialNotes: 'Acompanha Data Book completo: laudo de radiografia 100% de soldas, certificado de teste hidrostático e teste de rugosidade Ra < 0.4µm.',
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-15T18:20:00Z',
  },
  {
    id: 'ord-reg-8901',
    orderType: 'budget',
    salesOrderNumber: 'PV-Pendente',
    budgetNumber: 'ORC-2026-8901',
    clientOrderNumber: 'PROPOSTA-PENDENTE',
    title: 'Orçamento #ORC-8901 - Vigas de Rolamento de Ponte Rolante 25T',
    customerId: 'cust-reg-003',
    customerName: 'Construtora & Engenharia Horizonte S/A',
    customerCnpj: '34.567.890/0001-12',
    contactName: 'Luciana Martins',
    contactEmail: 'luciana.martins@horizonteengenharia.com.br',
    contactPhone: '(31) 98456-7890',
    salesRep: 'Carlos Mendes',
    status: 'Orçamento em Elaboração',
    issueDate: '2026-09-01',
    deliveryDeadline: '2026-11-10',
    validUntil: '2026-09-21',
    items: [
      {
        id: 'item-30',
        code: 'VIG-EST-50',
        description: 'Viga eletrossoldada perfil I especial de 1200mm alma x 24 metros vão livre Aço ASTM A572 Gr50',
        quantity: 4,
        unit: 'CJ',
        unitPrice: 78000,
        taxRate: 5,
        subtotal: 312000,
      },
      {
        id: 'item-31',
        code: 'TRILHO-TR37',
        description: 'Trilhos de translação TR-37 perfurados e soldados com sapatas de fixação elásticas',
        quantity: 96,
        unit: 'M',
        unitPrice: 620,
        taxRate: 5,
        subtotal: 59520,
      },
    ],
    itemsSubtotal: 371520,
    shippingCost: 12000,
    shippingType: 'FOB',
    carrierName: 'Transportadora a definir pelo cliente',
    discountAmount: 11520,
    taxAmount: 18000,
    totalValue: 390000,
    paymentMethod: 'Faturamento Direto / Carta de Crédito',
    paymentConditions: 'Entrada 30% + 3 parcelas de 30/60/90 DDL',
    deliveryAddress: 'Canteiro de Obras Expansão Sul, Contagem - MG',
    commercialNotes: 'Preço válido com retenção de impostos conforme legislação federal para construção pesada.',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-02T13:40:00Z',
  },
];

export function getRegisteredOrders(): RegisteredOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_ORDERS));
      return INITIAL_REGISTERED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_ORDERS));
    return INITIAL_REGISTERED_ORDERS;
  } catch (e) {
    console.warn('Error reading order registry from localStorage, falling back to initial data:', e);
    return INITIAL_REGISTERED_ORDERS;
  }
}

export function saveRegisteredOrder(orderData: Partial<RegisteredOrder> & { title: string }): RegisteredOrder {
  const currentList = getRegisteredOrders();
  const now = new Date().toISOString();

  let updatedOrder: RegisteredOrder;
  const existingIdx = currentList.findIndex(
    (o) =>
      (orderData.id && o.id === orderData.id) ||
      (orderData.salesOrderNumber && o.salesOrderNumber === orderData.salesOrderNumber && orderData.salesOrderNumber !== 'PV-Pendente') ||
      (orderData.budgetNumber && o.budgetNumber === orderData.budgetNumber)
  );

  const defaultItems: OrderItem[] = orderData.items && orderData.items.length > 0
    ? orderData.items
    : [
        {
          id: 'item-default-1',
          code: 'PECA-01',
          description: orderData.title || 'Item Industrial Customizado',
          quantity: 1,
          unit: 'UN',
          unitPrice: orderData.totalValue || orderData.itemsSubtotal || 50000,
          taxRate: 5,
          subtotal: orderData.totalValue || orderData.itemsSubtotal || 50000,
        },
      ];

  const isWithoutVal = Boolean(orderData.withoutValue);
  const subtotal = isWithoutVal ? 0 : (orderData.itemsSubtotal ?? defaultItems.reduce((acc, it) => acc + (it.subtotal || 0), 0));
  const shipping = isWithoutVal ? 0 : (orderData.shippingCost ?? 0);
  const discount = isWithoutVal ? 0 : (orderData.discountAmount ?? 0);
  const tax = isWithoutVal ? 0 : (orderData.taxAmount ?? 0);
  const total = isWithoutVal ? 0 : (orderData.totalValue ?? (subtotal + shipping + tax - discount));

  if (existingIdx >= 0) {
    updatedOrder = {
      ...currentList[existingIdx],
      ...orderData,
      withoutValue: isWithoutVal,
      descriptiveNotes: orderData.descriptiveNotes ?? currentList[existingIdx].descriptiveNotes,
      items: defaultItems,
      itemsSubtotal: subtotal,
      shippingCost: shipping,
      discountAmount: discount,
      taxAmount: tax,
      totalValue: total,
      updatedAt: now,
    };
    currentList[existingIdx] = updatedOrder;
  } else {
    const id = orderData.id || `ord-reg-${Date.now().toString().slice(-6)}`;
    const type = orderData.orderType || 'order';
    const salesNum = orderData.salesOrderNumber || (type === 'order' ? `PV-${Math.floor(1000 + Math.random() * 9000)}` : 'PV-Pendente');
    const budgetNum = orderData.budgetNumber || `ORC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    updatedOrder = {
      id,
      orderType: type,
      salesOrderNumber: salesNum,
      budgetNumber: budgetNum,
      clientOrderNumber: orderData.clientOrderNumber || '',
      title: orderData.title,
      withoutValue: isWithoutVal,
      descriptiveNotes: orderData.descriptiveNotes || '',
      customerId: orderData.customerId,
      customerName: orderData.customerName || 'Cliente a Definir',
      customerCnpj: orderData.customerCnpj || '',
      contactName: orderData.contactName || '',
      contactEmail: orderData.contactEmail || '',
      contactPhone: orderData.contactPhone || '',
      salesRep: orderData.salesRep || 'Comercial',
      status: orderData.status || (type === 'order' ? 'Pedido de Venda Confirmado' : 'Orçamento em Elaboração'),
      issueDate: orderData.issueDate || new Date().toISOString().slice(0, 10),
      deliveryDeadline: orderData.deliveryDeadline || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      validUntil: orderData.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      items: defaultItems,
      itemsSubtotal: subtotal,
      shippingCost: shipping,
      shippingType: orderData.shippingType || 'CIF',
      carrierName: orderData.carrierName || '',
      discountAmount: discount,
      taxAmount: tax,
      totalValue: total,
      paymentMethod: orderData.paymentMethod || 'Boleto Bancário',
      paymentConditions: orderData.paymentConditions || '30 DDL',
      deliveryAddress: orderData.deliveryAddress || '',
      commercialNotes: orderData.commercialNotes || '',
      createdAt: now,
      updatedAt: now,
    };
    currentList.unshift(updatedOrder);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }


  return updatedOrder;
}

export function searchOrderRegistry(query: string): RegisteredOrder[] {
  const list = getRegisteredOrders();
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter((o) => {
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
}

export function deleteOrderFromRegistry(id: string): void {
  const currentList = getRegisteredOrders();
  const filtered = currentList.filter((o) => o.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete order from localStorage:', err);
  }
}

export function generateNextNumber(type: 'order' | 'budget'): string {
  const currentList = getRegisteredOrders();
  if (type === 'order') {
    const nums = currentList
      .map((o) => {
        const m = o.salesOrderNumber.match(/PV-(\d+)/);
        return m ? parseInt(m[1]) : 0;
      })
      .filter((n) => n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 4497;
    return `PV-${max + 1}`;
  } else {
    const year = new Date().getFullYear();
    const nums = currentList
      .map((o) => {
        const m = o.budgetNumber.match(/ORC-\d{4}-(\d+)/);
        return m ? parseInt(m[1]) : 0;
      })
      .filter((n) => n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 8901;
    return `ORC-${year}-${max + 1}`;
  }
}
