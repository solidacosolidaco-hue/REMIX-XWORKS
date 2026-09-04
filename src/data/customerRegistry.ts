
export interface RegisteredCustomer {
  id: string;
  name: string; // Nome fantasia ou nome principal
  corporateName: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  cnpj: string; // CNPJ ou CPF
  personType: 'PJ' | 'PF';
  stateRegistration?: string; // Inscrição Estadual (IE)
  municipalRegistration?: string; // Inscrição Municipal (IM)
  customerSegment: string; // Segmento / Ramo de Atividade
  status: 'Ativo' | 'Prospecção' | 'Inativo' | 'Bloqueado';
  contactName: string; // Contato principal
  contactRole?: string; // Cargo
  phone?: string; // Telefone Comercial
  cellphone?: string; // Celular / WhatsApp
  email: string; // E-mail principal
  billingEmail?: string; // E-mail Financeiro / XML NFe
  website?: string;
  zipCode?: string; // CEP
  street?: string; // Logradouro
  number?: string; // Número
  complement?: string; // Complemento
  neighborhood?: string; // Bairro
  city: string; // Cidade
  state: string; // UF (ex: SP)
  address?: string; // Resumo textual
  paymentTerm?: string; // Condição de Pagamento (ex: 30 DDL)
  creditLimit?: number; // Limite de Crédito (R$)
  totalRevenue?: string; // Faturamento total (R$)
  ordersCount?: number; // Qtd pedidos ativos
  notes?: string; // Observações gerais
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'industrial_canvas_customer_registry_v1';

export const INITIAL_REGISTERED_CUSTOMERS: RegisteredCustomer[] = [
  {
    id: 'cust-reg-001',
    name: 'Empresa ABC S/A',
    corporateName: 'Empresa ABC Indústria e Comércio S/A',
    tradeName: 'Empresa ABC',
    cnpj: '12.345.678/0001-90',
    personType: 'PJ',
    stateRegistration: '109.876.543.110',
    municipalRegistration: '45.890/2021',
    customerSegment: 'Manufatura & Metalmecânica',
    status: 'Ativo',
    contactName: 'Renata Valente',
    contactRole: 'Diretora de Suprimentos & Compras',
    phone: '(11) 3456-7890',
    cellphone: '(11) 98765-4321',
    email: 'renata.valente@empresaabc.com.br',
    billingEmail: 'nfe.financeiro@empresaabc.com.br',
    website: 'www.empresaabc.com.br',
    zipCode: '04578-000',
    street: 'Av. das Indústrias',
    number: '1500',
    complement: 'Galpão 4',
    neighborhood: 'Distrito Industrial',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. das Indústrias, 1500 - São Paulo, SP',
    paymentTerm: '30 / 60 DDL',
    creditLimit: 250000,
    totalRevenue: 'R$ 100.000',
    ordersCount: 1,
    notes: 'Cliente prioritário para peças usinadas e corte a laser.',
    createdAt: '2026-01-10',
    updatedAt: '2026-09-02',
  },
  {
    id: 'cust-reg-002',
    name: 'Metalúrgica Alvorada Ltda',
    corporateName: 'Metalúrgica Alvorada Estruturas e Peças Ltda',
    tradeName: 'Metalúrgica Alvorada',
    cnpj: '45.678.910/0001-23',
    personType: 'PJ',
    stateRegistration: '284.112.990.115',
    municipalRegistration: '12.345/2019',
    customerSegment: 'Estruturas Metálicas & Caldeiraria',
    status: 'Ativo',
    contactName: 'Carlos Eduardo Ramos',
    contactRole: 'Gerente de Operações Industriais',
    phone: '(19) 3210-9988',
    cellphone: '(19) 99123-4567',
    email: 'carlos.ramos@metalalvorada.com.br',
    billingEmail: 'contabilidade@metalalvorada.com.br',
    website: 'www.metalalvorada.com.br',
    zipCode: '13050-000',
    street: 'Rodovia Anhanguera, km 98',
    number: 'S/N',
    complement: 'Módulo B',
    neighborhood: 'Jardim das Oliveiras',
    city: 'Campinas',
    state: 'SP',
    address: 'Rod. Anhanguera, km 98 - Campinas, SP',
    paymentTerm: '28 DDL',
    creditLimit: 180000,
    totalRevenue: 'R$ 240.000',
    ordersCount: 2,
    notes: 'Exige certificado de matéria-prima e ensaio não destrutivo.',
    createdAt: '2026-02-15',
    updatedAt: '2026-08-20',
  },
  {
    id: 'cust-reg-003',
    name: 'Construtora & Engenharia Horizonte',
    corporateName: 'Horizonte Obras e Infraestrutura S/A',
    tradeName: 'Construtora Horizonte',
    cnpj: '78.901.234/0001-56',
    personType: 'PJ',
    stateRegistration: '987.654.321.001',
    municipalRegistration: '77.889/2018',
    customerSegment: 'Construção Civil & Infraestrutura',
    status: 'Ativo',
    contactName: 'Eng. Mariana Souza',
    contactRole: 'Coordenadora de Suprimentos de Obras',
    phone: '(31) 3322-1100',
    cellphone: '(31) 98456-7890',
    email: 'mariana.souza@horizonteobras.com.br',
    billingEmail: 'fiscal@horizonteobras.com.br',
    website: 'www.horizonteobras.com.br',
    zipCode: '30140-061',
    street: 'Av. Afonso Pena',
    number: '3100',
    complement: '14º Andar',
    neighborhood: 'Funcionários',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Av. Afonso Pena, 3100 - Belo Horizonte, MG',
    paymentTerm: '45 DDL',
    creditLimit: 500000,
    totalRevenue: 'R$ 520.000',
    ordersCount: 3,
    notes: 'Entregas devem ser agendadas com 48h de antecedência no canteiro.',
    createdAt: '2026-03-01',
    updatedAt: '2026-08-30',
  },
  {
    id: 'cust-reg-004',
    name: 'TechSol Automação & Robótica',
    corporateName: 'TechSol Sistemas Tecnológicos EIRELI',
    tradeName: 'TechSol Automação',
    cnpj: '33.222.111/0001-88',
    personType: 'PJ',
    stateRegistration: 'ISENTO',
    municipalRegistration: '99.112/2022',
    customerSegment: 'Automação Industrial & Tecnologia',
    status: 'Ativo',
    contactName: 'Rodrigo Vasconcelos',
    contactRole: 'Diretor Técnico de P&D',
    phone: '(41) 3040-5060',
    cellphone: '(41) 99877-6655',
    email: 'rodrigo@techsol.ind.br',
    billingEmail: 'pagamentos@techsol.ind.br',
    website: 'www.techsol.ind.br',
    zipCode: '80215-090',
    street: 'Rua Brigadeiro Franco',
    number: '2800',
    complement: 'Conj. 802',
    neighborhood: 'Rebouças',
    city: 'Curitiba',
    state: 'PR',
    address: 'Rua Brigadeiro Franco, 2800 - Curitiba, PR',
    paymentTerm: 'À Vista (5% desc)',
    creditLimit: 120000,
    totalRevenue: 'R$ 85.000',
    ordersCount: 1,
    notes: 'Projetos sob encomenda de gabaritos e chapas finas especiais.',
    createdAt: '2026-04-12',
    updatedAt: '2026-07-15',
  },
  {
    id: 'cust-reg-005',
    name: 'AgroMáquinas do Brasil',
    corporateName: 'AgroMáquinas Implementos Agrícolas Ltda',
    tradeName: 'AgroMáquinas Brasil',
    cnpj: '61.432.876/0001-04',
    personType: 'PJ',
    stateRegistration: '512.443.210.988',
    municipalRegistration: '33.441/2020',
    customerSegment: 'Máquinas & Agronegócio',
    status: 'Ativo',
    contactName: 'Fernando Alcantara',
    contactRole: 'Gerente Geral de Produção',
    phone: '(16) 3600-4422',
    cellphone: '(16) 99655-4433',
    email: 'fernando@agromaquinasbrasil.com.br',
    billingEmail: 'financeiro@agromaquinasbrasil.com.br',
    website: 'www.agromaquinasbrasil.com.br',
    zipCode: '14095-000',
    street: 'Av. Presidente Kennedy',
    number: '4200',
    complement: 'Parque Industrial Norte',
    neighborhood: 'Ribeirânia',
    city: 'Ribeirão Preto',
    state: 'SP',
    address: 'Av. Pres. Kennedy, 4200 - Ribeirão Preto, SP',
    paymentTerm: '30 / 60 / 90 DDL',
    creditLimit: 350000,
    totalRevenue: 'R$ 310.000',
    ordersCount: 2,
    notes: 'Fornecimento contínuo de eixos e flanges.',
    createdAt: '2026-05-20',
    updatedAt: '2026-08-10',
  },
];

export function getRegisteredCustomers(): RegisteredCustomer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_CUSTOMERS));
      return INITIAL_REGISTERED_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_REGISTERED_CUSTOMERS;
  } catch {
    return INITIAL_REGISTERED_CUSTOMERS;
  }
}

export function saveCustomerToRegistry(
  customerData: Partial<RegisteredCustomer> & { name: string; cnpj: string }
): RegisteredCustomer {
  const currentList = getRegisteredCustomers();
  const now = new Date().toISOString().split('T')[0];

  // Check if exists by id or CNPJ
  const existingIndex = currentList.findIndex(
    (c) => (customerData.id && c.id === customerData.id) || (customerData.cnpj && c.cnpj.trim() === customerData.cnpj.trim())
  );

  let updatedCustomer: RegisteredCustomer;

  if (existingIndex >= 0) {
    // Update existing
    const existing = currentList[existingIndex];
    updatedCustomer = {
      ...existing,
      ...customerData,
      corporateName: customerData.corporateName || customerData.name || existing.corporateName,
      tradeName: customerData.tradeName || customerData.name || existing.tradeName,
      address:
        customerData.address ||
        (customerData.street
          ? `${customerData.street}, ${customerData.number || 'S/N'} - ${customerData.city || ''}, ${customerData.state || ''}`
          : existing.address),
      updatedAt: now,
    };
    currentList[existingIndex] = updatedCustomer;
  } else {
    // Create new
    const newId = customerData.id || `cust-reg-${Date.now()}`;
    updatedCustomer = {
      id: newId,
      name: customerData.name,
      corporateName: customerData.corporateName || customerData.name,
      tradeName: customerData.tradeName || customerData.name,
      cnpj: customerData.cnpj,
      personType: customerData.personType || 'PJ',
      stateRegistration: customerData.stateRegistration || '',
      municipalRegistration: customerData.municipalRegistration || '',
      customerSegment: customerData.customerSegment || 'Geral',
      status: customerData.status || 'Ativo',
      contactName: customerData.contactName || 'Responsável Comercial',
      contactRole: customerData.contactRole || 'Contato',
      phone: customerData.phone || '',
      cellphone: customerData.cellphone || '',
      email: customerData.email || '',
      billingEmail: customerData.billingEmail || '',
      website: customerData.website || '',
      zipCode: customerData.zipCode || '',
      street: customerData.street || '',
      number: customerData.number || '',
      complement: customerData.complement || '',
      neighborhood: customerData.neighborhood || '',
      city: customerData.city || 'São Paulo',
      state: customerData.state || 'SP',
      address:
        customerData.address ||
        (customerData.street
          ? `${customerData.street}, ${customerData.number || 'S/N'} - ${customerData.city || 'São Paulo'}, ${customerData.state || 'SP'}`
          : 'São Paulo - SP'),
      paymentTerm: customerData.paymentTerm || '30 DDL',
      creditLimit: customerData.creditLimit || 50000,
      totalRevenue: customerData.totalRevenue || 'R$ 0',
      ordersCount: customerData.ordersCount ?? 0,
      notes: customerData.notes || '',
      createdAt: now,
      updatedAt: now,
    };
    currentList.unshift(updatedCustomer);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }


  return updatedCustomer;
}

export function searchCustomerRegistry(query: string): RegisteredCustomer[] {
  const list = getRegisteredCustomers();
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.corporateName.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
      c.cnpj.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.customerSegment.toLowerCase().includes(q)
    );
  });
}

export function deleteCustomerFromRegistry(id: string): void {
  const currentList = getRegisteredCustomers();
  const filtered = currentList.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete from localStorage:', err);
  }
}
