export type NodeType =
  | 'text'
  | 'note'
  | 'checklist'
  | 'kanban'
  | 'deadline'
  | 'calendar'
  | 'customer'
  | 'budget'
  | 'order'
  | 'project'
  | 'indicator'
  | 'progress'
  | 'document'
  | 'group'
  | 'invoice'
  | 'custom'
  | 'finalized_order'
  | 'financial_module'
  | 'product'
  | 'part'
  | 'service'
  | 'employee'
  | 'supervisor'
  | 'sector'
  | 'production_order'
  | 'production_route'
  | 'attachment'
  | 'interrupted_flow';

export type NodeStatus =
  | 'Ativo'
  | 'Inativo'
  | 'A Fazer'
  | 'Em Andamento'
  | 'Em Produção'
  | 'Aprovado'
  | 'Orçamento'
  | 'Concluído'
  | 'Atrasado'
  | 'Alerta'
  | 'Pendente'
  | 'Cancelado';

export type NodeColor =
  | 'slate'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'cyan'
  | 'indigo'
  | 'orange';

export type ModuleNature = 
  | 'Base de Dados' 
  | 'Fluxo Principal' 
  | 'Controle Operacional' 
  | 'Métrica de Desempenho' 
  | 'Avanço de Status'
  | 'Prazo Crítico'
  | 'Documentação' 
  | 'Setor' 
  | 'Suporte';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  assignee?: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  assignee?: string;
  dueDate?: string;
  startDate?: string;
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  tags?: string[];
  coverColor?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  commentsCount?: number;
  attachmentsCount?: number;
  progress?: number;
  linkUrl?: string;
  linkTitle?: string;
  links?: { id: string; title: string; url: string }[];
  estimatedHours?: number;
  budgetCost?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
}

export interface ProductionRouteStep {
  id: string;
  sequence: number; // 10, 20, 30, 40, etc.
  name: string;
  sector?: string;
  machineOrWorkcenter?: string;
  operator?: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  estimatedHours?: number;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  completedDate?: string;
  notes?: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  url: string;
  type?: 'pdf' | 'doc' | 'image' | 'link' | 'cad' | 'other';
  checked?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface CanvasNodeData {
  [key: string]: any;
  // Common / general
  description?: string;
  notes?: string;
  
  // Text node
  content?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  isBold?: boolean;
  isItalic?: boolean;
  textType?: 'heading' | 'subtitle' | 'body' | 'bullet';

  // Note node
  noteText?: string;
  isWarning?: boolean;

  // Checklist node
  items?: ChecklistItem[];

  // Attachment node
  attachments?: AttachmentItem[];

  // Kanban node
  columns?: KanbanColumn[];
  cards?: KanbanCard[];

  // Deadline node
  startDate?: string;
  dueDate?: string;
  progressPercent?: number;

  // Customer node (Quadro Base de Clientes)
  corporateName?: string;
  tradeName?: string;
  cnpj?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  customerSegment?: string;
  personType?: 'PJ' | 'PF';
  contactName?: string;
  contactRole?: string;
  phone?: string;
  cellphone?: string;
  email?: string;
  billingEmail?: string;
  website?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  address?: string;
  paymentTerm?: string;
  creditLimit?: number;
  ordersCount?: number;
  projectsCount?: number;
  totalRevenue?: string;
  registeredCustomerId?: string;

  // Order node (Pedido Comercial, Orçamento & Pedido de Venda)
  orderCode?: string;
  orderType?: 'order' | 'budget';
  salesOrderNumber?: string; // Nº Pedido de Venda (ex: PV-4497)
  budgetNumber?: string; // Nº Ordem de Orçamento / Proposta (ex: ORC-2026-8821)
  clientOrderNumber?: string; // Nº Ordem de Compra do Cliente (ex: OC-90214)
  customerName?: string;
  customerCnpj?: string;
  orderValue?: number;
  totalOrderValue?: number;
  withoutValue?: boolean; // Permite pedido de venda sem valor comercial (apenas dados descritivos/informativos)
  descriptiveOnly?: boolean; // Sinônimo para modo informativo/descritivo
  descriptiveNotes?: string; // Dados descritivos, escopo e instruções informativas
  hideValueOnly?: boolean; // Ocultar apenas a exibição visual do valor no quadro (modo sigilo/apresentação)
  hideValue?: boolean; // Sinônimo para ocultar valor visualmente
  itemsSubtotal?: number;
  shippingCost?: number;
  shippingType?: 'CIF' | 'FOB';
  carrierName?: string;
  discountAmount?: number;
  taxAmount?: number;
  commercialStatus?: string;
  issueDate?: string;
  validUntil?: string;
  paymentMethod?: string;
  paymentConditions?: string;
  deliveryLocation?: string;
  orderStatus?: string;
  itemsList?: string[];
  orderItems?: {
    id: string;
    code?: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxRate?: number;
    subtotal: number;
  }[];
  itemsDelivered?: number;
  deliveryDeadline?: string;
  orderProgress?: number;
  registeredOrderId?: string;

  // Project node
  projectCode?: string;
  clientName?: string;
  budget?: number;
  spent?: number;
  projectProgress?: number;
  subModules?: string[];

  // Indicator node
  kpiTitle?: string;
  kpiValue?: string;
  kpiTarget?: string;
  kpiTrend?: string;
  kpiTrendType?: 'up' | 'down' | 'neutral';
  kpiUnit?: string;
  kpiCategory?: string;

  // Progress node
  targetValue?: number;
  currentValue?: number;
  progressFormat?: 'percent' | 'count' | 'currency';
  milestones?: { name: string; achieved: boolean }[];

  // Document node
  docType?: 'PDF' | 'CAD' | 'DOC' | 'SHEET' | 'SPEC' | 'IMAGE';
  docVersion?: string;
  fileSize?: string;
  docUrl?: string;

  // Group node
  groupColor?: string;
  groupIcon?: string;
  childNodeIds?: string[];

  // Invoice / Nota Fiscal (NF-e) node
  invoiceNumber?: string;
  nfeKey?: string;
  nfeProtocol?: string;
  invoiceValue?: number;
  taxIcms?: number;
  taxIpi?: number;
  taxPis?: number;
  taxCofins?: number;
  totalTaxes?: number;
  nfeStatus?: 'Autorizada' | 'Pendente' | 'Cancelada' | 'Processando';
  recipientName?: string;
  connectedOrderId?: string;
  connectedCustomerId?: string;
  cfop?: string;

  // Product node
  sku?: string;
  unitPrice?: number;
  stockQty?: number;
  minStockQty?: number;
  category?: string;
  components?: string[];
  componentIds?: string[];

  // Part / Component node
  partNumber?: string;
  material?: string;
  dimensions?: string;
  partStock?: number;
  supplier?: string;

  // Service node
  serviceCode?: string;
  hourlyRate?: number;
  estimatedHours?: number;
  serviceCategory?: string;

  // Employee node
  employeeId?: string;
  role?: string;
  shift?: string;
  department?: string;
  employeeStatus?: 'Disponível' | 'Em Serviço' | 'Em Férias' | 'Ausente';

  // Supervisor node
  supervisorId?: string;
  managedSector?: string;
  subordinatesCount?: number;
  certifications?: string[];

  // Sector node
  sectorCode?: string;
  sectorCapacity?: string;
  activeWorkers?: number;
  activeMachineCount?: number;

  // Production Route / Roteiro de Produção node
  routeCode?: string;
  productTarget?: string;
  workstation?: string;
  steps?: ProductionRouteStep[];
  overallRouteProgress?: number;

  // Connection configuration
  connectionPointsPerSide?: number; // default is 3 (allows 1 to 5 connection ports per side)
  
  // Timer state
  isTimerRunning?: boolean;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: NodeColor;
  status: NodeStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  assignee?: string;
  locked?: boolean;
  groupId?: string;
  zIndex?: number;
  data: CanvasNodeData;
}

export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left';
export type ConnectionHandle =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-1'
  | 'top-2'
  | 'top-3'
  | 'top-4'
  | 'top-5'
  | 'right-1'
  | 'right-2'
  | 'right-3'
  | 'right-4'
  | 'right-5'
  | 'bottom-1'
  | 'bottom-2'
  | 'bottom-3'
  | 'bottom-4'
  | 'bottom-5'
  | 'left-1'
  | 'left-2'
  | 'left-3'
  | 'left-4'
  | 'left-5'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'right-top'
  | 'right-center'
  | 'right-bottom'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left-top'
  | 'left-center'
  | 'left-bottom'
  | string;
export type ConnectionLineStyle = 'curved' | 'straight' | 'orthogonal';
export type ConnectionArrow = 'start' | 'end' | 'both' | 'none';

export type ConnectionRelationType =
  | 'client_to_order'
  | 'order_to_project'
  | 'project_to_production'
  | 'order_to_invoice'
  | 'project_to_deadline'
  | 'deadline_to_indicator'
  | 'indicator_to_deadline'
  | 'progress_to_indicator'
  | 'indicator_to_progress'
  | 'status_to_indicator'
  | 'checklist_to_indicator'
  | 'kanban_to_indicator'
  | 'dependency'
  | 'technical_spec'
  | 'quality_check'
  | 'custom';

export interface ConnectionDataExchange {
  customerName?: string;
  cnpj?: string;
  orderCode?: string;
  orderValue?: number;
  productName?: string;
  deadline?: string;
  nfeNumber?: string;
  status?: string;
  notes?: string;
  progressPercent?: number;
  currentValue?: number;
  syncedAt?: string;
  [key: string]: any;
}

export type ConnectionStrokePattern = 'solid' | 'dashed' | 'dotted';

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  toConnectionId?: string;
  fromHandle?: ConnectionHandle;
  toHandle?: ConnectionHandle;
  label?: string;
  color?: string;
  lineStyle?: ConnectionLineStyle;
  arrow?: ConnectionArrow;
  strokeWidth?: number;
  animated?: boolean;
  strokePattern?: ConnectionStrokePattern;
  relationType?: ConnectionRelationType;
  dataExchange?: ConnectionDataExchange;
  autoSync?: boolean;
  attachments?: { id: string; name: string; url: string; type: 'url' | 'folder' }[];
  displayValue?: number;
}

export interface InvoiceItem {
  id: string;
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  icmsPercent: number;
  ipiPercent: number;
}

export interface InvoiceDocument {
  id: string;
  nfeNumber: string;
  series: string;
  issueDate: string;
  nfeKey: string;
  protocolNumber: string;
  status: 'Autorizada' | 'Pendente' | 'Cancelada';
  
  // Emitente
  issuerName: string;
  issuerCnpj: string;
  issuerIe: string;
  issuerAddress: string;
  issuerCity: string;
  issuerState: string;

  // Destinatário
  recipientName: string;
  recipientCnpj: string;
  recipientIe?: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientEmail?: string;
  recipientPhone?: string;

  // Origin info
  orderId?: string;
  orderCode?: string;
  customerId?: string;
  projectId?: string;
  productName?: string;

  // Items
  items: InvoiceItem[];

  // Totals & Taxes
  productsTotal: number;
  discountTotal: number;
  shippingTotal: number;
  icmsBase: number;
  icmsValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  grandTotal: number;

  // Payment
  paymentMethod: string;
  installments: { dueDate: string; value: number; number: number }[];
  additionalInfo?: string;
}

export interface TraceabilityRecord {
  customerId: string;
  customerName: string;
  customerCnpj: string;
  customerSegment?: string;
  orders: {
    orderId: string;
    orderCode: string;
    orderName: string;
    orderValue: number;
    status: string;
    deadline?: string;
    progress: number;
    isTimerStoppedDelayed?: boolean;
    delayReason?: string;
  }[];
  products: {
    projectId: string;
    projectCode: string;
    productName: string;
    status: string;
    progress: number;
    responsible?: string;
    isTimerStoppedDelayed?: boolean;
    delayReason?: string;
  }[];
  invoices: {
    invoiceId?: string;
    nfeNumber: string;
    nfeKey?: string;
    issueDate: string;
    value: number;
    status: string;
  }[];
  checklists: {
    checklistId: string;
    name: string;
    doneCount: number;
    totalCount: number;
  }[];
  totalValue: number;
  healthStatus: 'Normal' | 'Alerta' | 'Crítico';
  isTimerStoppedDelayed?: boolean;
  pendingManualCount?: number;
  timerAlertMessage?: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface PresentationSlide {
  id: string;
  title: string;
  targetNodeIds: string[];
  description?: string;
  zoomLevel?: number;
}

export interface PresentationStep {
  id: string;
  title: string;
  nodeIds: string[];
  description?: string;
  zoomScale?: number;
  duration?: number;
}

export interface HistorySnapshot {
  nodes: CanvasNode[];
  connections: Connection[];
  timestamp: number;
}

export interface CanvasFilter {
  searchQuery: string;
  typeFilter: NodeType | 'all';
  statusFilter: NodeStatus | 'all';
  assigneeFilter: string | 'all';
  tagFilter: string | 'all';
  hideUnmatched: boolean;
}

export type CanvasMode =
  | 'select'
  | 'pan'
  | 'connect'
  | 'investigation'
  | 'presentation';

export type CanvasTheme = 'white' | 'black' | 'gray' | 'dark' | 'light' | 'blueprint_light' | 'warm_light';

export interface CanvasBoard {
  id: string;
  name: string;
  nodes: CanvasNode[];
  connections: Connection[];
  viewport: Viewport;
  theme?: CanvasTheme;
  icon?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string; // ID do funcionário dono
  ownerName?: string; // Nome do funcionário responsável
  isShared?: boolean; // Se visível para todos os funcionários
}

