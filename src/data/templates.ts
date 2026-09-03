import { CanvasNode, Connection, PresentationStep, PresentationSlide } from '../types/canvas';

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: CanvasNode[];
  connections: Connection[];
  presentationSteps?: PresentationStep[];
}

export const INDUSTRIAL_MACHINE_TEMPLATE: WorkspaceTemplate = {
  id: 'industrial-machine',
  name: 'Gestão Industrial — Máquina Hidráulica X-500',
  description: 'Fluxo completo de Engenharia, Comercial, Produção, Compras, Checklist e KPIs.',
  category: 'Indústria & Produção',
  nodes: [
    // --- GRUPO COMERCIAL & CLIENTE ---
    {
      id: 'grp-comercial',
      type: 'group',
      name: '01. Área Comercial & CRM',
      x: 50,
      y: 80,
      width: 700,
      height: 500,
      color: 'blue',
      status: 'Em Andamento',
      createdAt: '2026-08-20',
      updatedAt: '2026-09-01',
      tags: ['comercial', 'crm'],
      data: {
        description: 'Gestão de relacionamento, propostas e pedidos de venda.',
        groupColor: '#3b82f6',
        groupIcon: 'Building2',
      },
    },
    {
      id: 'node-client-1',
      type: 'customer',
      name: 'Empresa ABC S/A Indústria',
      x: 90,
      y: 160,
      width: 300,
      height: 220,
      color: 'blue',
      status: 'Aprovado',
      createdAt: '2026-08-15',
      updatedAt: '2026-09-01',
      tags: ['tier-1', 'automotivo', 'prioridade'],
      assignee: 'Renata Valente',
      data: {
        cnpj: '12.345.678/0001-90',
        contactName: 'Eng. Roberto Albuquerque',
        phone: '(11) 98765-4321',
        email: 'roberto@empresaabc.com.br',
        address: 'Av. Industrial, 4500 - São Bernardo do Campo / SP',
        customerSegment: 'Manufatura Pesada',
        ordersCount: 4,
        projectsCount: 2,
        totalRevenue: 'R$ 1.450.000',
        notes: 'Cliente estratégico com novos projetos previstos para o 4º trimestre.',
      },
    },
    {
      id: 'node-order-1',
      type: 'order',
      name: 'Pedido #10254 — Máquina X-500',
      x: 430,
      y: 160,
      width: 280,
      height: 380,
      color: 'emerald',
      status: 'Em Produção',
      createdAt: '2026-08-22',
      updatedAt: '2026-09-01',
      tags: ['#urgente', '#produção', '#clienteABC'],
      assignee: 'Carlos Silva',
      data: {
        orderCode: 'PED-10254',
        customerName: 'Empresa ABC S/A',
        orderValue: 250000,
        orderStatus: 'Em Produção',
        deliveryDeadline: '2026-09-20',
        orderProgress: 80,
        itemsList: [
          'Estrutura metálica usinada',
          'Sistema hidráulico 350 bar',
          'Pintura eletrostática epóxi',
          'Painel CLP Siemens com IHM',
        ],
      },
    },

    // --- GRUPO ENGENHARIA & PROJETOS ---
    {
      id: 'grp-projetos',
      type: 'group',
      name: '02. Engenharia & P&D',
      x: 780,
      y: 80,
      width: 720,
      height: 500,
      color: 'cyan',
      status: 'Em Andamento',
      createdAt: '2026-08-23',
      updatedAt: '2026-09-01',
      tags: ['engenharia', 'cad', 'p&d'],
      data: {
        description: 'Dimensionamento estrutural, simulação hidráulica e desenhos técnicos.',
        groupColor: '#06b6d4',
        groupIcon: 'Cpu',
      },
    },
    {
      id: 'node-project-1',
      type: 'project',
      name: 'Projeto PX-2026-042 — Prensa 50T',
      x: 820,
      y: 160,
      width: 320,
      height: 390,
      color: 'cyan',
      status: 'Em Andamento',
      createdAt: '2026-08-24',
      updatedAt: '2026-09-01',
      tags: ['engenharia', 'máquina-x', 'solidworks'],
      assignee: 'João Mendes',
      data: {
        projectCode: 'PX-2026-042',
        clientName: 'Empresa ABC S/A',
        budget: 250000,
        spent: 178000,
        projectProgress: 72,
        subModules: [
          'Desenhos Mecânicos 3D (SolidWorks)',
          'Esquema Hidráulico com Válvulas Proporcionais',
          'Programação de CLP & Segurança NR-12',
          'Manual de Operação e Manutenção',
        ],
      },
    },
    {
      id: 'node-note-1',
      type: 'note',
      name: 'Observação Técnica',
      x: 1160,
      y: 395,
      width: 310,
      height: 160,
      color: 'amber',
      status: 'Alerta',
      createdAt: '2026-08-28',
      updatedAt: '2026-09-01',
      tags: ['fornecedor', 'alerta', 'motor'],
      assignee: 'Marcos Suprimentos',
      data: {
        noteText: '⚠️ Verificar com urgência o fornecedor do motor trifásico 30cv WEG. Prazo de entrega confirmado para dia 05/09.',
        isWarning: true,
      },
    },

    // --- GRUPO PRODUÇÃO & FABRICAÇÃO ---
    {
      id: 'grp-producao',
      type: 'group',
      name: '03. Chão de Fábrica & Qualidade',
      x: 50,
      y: 610,
      width: 1450,
      height: 540,
      color: 'emerald',
      status: 'Em Produção',
      createdAt: '2026-08-25',
      updatedAt: '2026-09-01',
      tags: ['chão-de-fábrica', 'iso9001', 'kanban'],
      data: {
        description: 'Acompanhamento em tempo real das etapas de montagem e usinagem.',
        groupColor: '#10b981',
        groupIcon: 'Factory',
      },
    },
    {
      id: 'node-checklist-1',
      type: 'checklist',
      name: 'Roteiro de Produção X-500',
      x: 90,
      y: 690,
      width: 320,
      height: 420,
      color: 'emerald',
      status: 'Em Andamento',
      createdAt: '2026-08-25',
      updatedAt: '2026-09-01',
      tags: ['fabricação', 'qualidade'],
      assignee: 'Mestre Gilberto',
      data: {
        items: [
          { id: 'chk-1', text: 'Comprar matéria-prima (Aço 1045)', checked: true, assignee: 'Marcos' },
          { id: 'chk-2', text: 'Cortar peças no laser fibra CNC', checked: true, assignee: 'Gilberto' },
          { id: 'chk-3', text: 'Dobrar chapas na prensa dobradeira', checked: true, assignee: 'Gilberto' },
          { id: 'chk-4', text: 'Usinar componentes no Centro CNC', checked: true, assignee: 'Tiago' },
          { id: 'chk-5', text: 'Soldar estrutura conforme norma AWS', checked: true, assignee: 'André' },
          { id: 'chk-6', text: 'Pintar e aplicar fundo anticorrosivo', checked: false, assignee: 'Ronaldo' },
          { id: 'chk-7', text: 'Montar sistema hidráulico e cilindro', checked: false, assignee: 'João' },
          { id: 'chk-8', text: 'Testar pressão e laudo de conformidade', checked: false, assignee: 'Carlos' },
        ],
      },
    },
    {
      id: 'node-kanban-1',
      type: 'kanban',
      name: 'Controle de Tarefas (Kanban)',
      x: 440,
      y: 690,
      width: 650,
      height: 420,
      color: 'slate',
      status: 'Em Produção',
      createdAt: '2026-08-26',
      updatedAt: '2026-09-01',
      tags: ['kanban', 'sprint-producao'],
      assignee: 'Engenharia & Chão de Fábrica',
      data: {
        columns: [
          { id: 'col-todo', title: 'A FAZER', color: '#64748b' },
          { id: 'col-in-progress', title: 'EM ANDAMENTO', color: '#3b82f6' },
          { id: 'col-done', title: 'CONCLUÍDO', color: '#10b981' },
        ],
        cards: [
          {
            id: 'kcard-1',
            title: 'Comprar motor 30cv WEG',
            columnId: 'col-todo',
            assignee: 'Marcos',
            priority: 'urgente',
            dueDate: '05/09',
            tags: ['compras'],
          },
          {
            id: 'kcard-2',
            title: 'Soldagem do Chassi Principal',
            columnId: 'col-in-progress',
            assignee: 'André',
            priority: 'alta',
            dueDate: '08/09',
            tags: ['solda'],
          },
          {
            id: 'kcard-3',
            title: 'Montagem do Bloco de Válvulas',
            columnId: 'col-in-progress',
            assignee: 'João',
            priority: 'media',
            dueDate: '10/09',
            tags: ['hidráulica'],
          },
          {
            id: 'kcard-4',
            title: 'Corte a Laser das Chapas',
            columnId: 'col-done',
            assignee: 'Gilberto',
            priority: 'alta',
            dueDate: '28/08',
            tags: ['cnc'],
          },
          {
            id: 'kcard-5',
            title: 'Inspeção Dimensional Ultrassom',
            columnId: 'col-done',
            assignee: 'Inspetor Braga',
            priority: 'media',
            dueDate: '30/08',
            tags: ['qualidade'],
          },
        ],
      },
    },
    {
      id: 'node-doc-1',
      type: 'document',
      name: 'Documentação Técnica',
      x: 1120,
      y: 690,
      width: 340,
      height: 190,
      color: 'indigo',
      status: 'Aprovado',
      createdAt: '2026-08-25',
      updatedAt: '2026-09-01',
      tags: ['cad', 'solidworks', 'revisao-b'],
      assignee: 'João Mendes',
      data: {
        docType: 'CAD',
        docVersion: 'v2.4 Final',
        fileSize: '48.2 MB',
        description: 'Conjunto mecânico completo 3D e memorial de cálculo estrutural.',
      },
    },
    {
      id: 'node-text-title',
      type: 'text',
      name: 'Header do Workspace',
      x: 60,
      y: 10,
      width: 680,
      height: 60,
      color: 'slate',
      status: 'Aprovado',
      createdAt: '2026-09-01',
      updatedAt: '2026-09-01',
      tags: [],
      data: {
        content: '# SISTEMA INDUSTRIAL INTEGRADO — XCANVAS\nOrganização visual de pedidos, projetos, produção e KPIs.',
        fontSize: '2xl',
        isBold: true,
        textType: 'heading',
      },
    },
  ],
  connections: [
    {
      id: 'conn-1',
      fromId: 'node-client-1',
      toId: 'node-order-1',
      fromHandle: 'right',
      toHandle: 'left',
      label: 'gerou pedido',
      color: '#38bdf8',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
      animated: true,
    },
    {
      id: 'conn-2',
      fromId: 'node-order-1',
      toId: 'node-project-1',
      fromHandle: 'right',
      toHandle: 'left',
      label: 'originou projeto',
      color: '#06b6d4',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
    },
    {
      id: 'conn-3',
      fromId: 'node-project-1',
      toId: 'node-note-1',
      fromHandle: 'right',
      toHandle: 'left',
      label: 'alerta técnico',
      color: '#f59e0b',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
    },
    {
      id: 'conn-5',
      fromId: 'node-project-1',
      toId: 'node-checklist-1',
      fromHandle: 'bottom',
      toHandle: 'top',
      label: 'ordem de fabricação',
      color: '#10b981',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
      animated: true,
    },
    {
      id: 'conn-6',
      fromId: 'node-checklist-1',
      toId: 'node-kanban-1',
      fromHandle: 'right',
      toHandle: 'left',
      label: 'distribuição de tarefas',
      color: '#10b981',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
    },
    {
      id: 'conn-7',
      fromId: 'node-project-1',
      toId: 'node-doc-1',
      fromHandle: 'bottom',
      toHandle: 'top',
      label: 'especificações CAD',
      color: '#6366f1',
      lineStyle: 'curved',
      arrow: 'end',
      strokeWidth: 2,
    },
  ],
  presentationSteps: [
    {
      id: 'step-1',
      title: '1. Cliente e Proposta Comercial',
      nodeIds: ['grp-comercial', 'node-client-1', 'node-order-1'],
      description: 'Entrada do pedido da Empresa ABC com valor aprovado de R$ 250.000.',
      zoomScale: 0.9,
    },
    {
      id: 'step-2',
      title: '2. Engenharia e Planejamento',
      nodeIds: ['grp-projetos', 'node-project-1', 'node-note-1'],
      description: 'Projeto PX-2026-042 com especificações e alerta de suprimentos.',
      zoomScale: 0.9,
    },
    {
      id: 'step-3',
      title: '3. Linha de Fabricação & Kanban',
      nodeIds: ['grp-producao', 'node-checklist-1', 'node-kanban-1'],
      description: 'Acompanhamento do chão de fábrica: 5/8 etapas de usinagem concluídas.',
      zoomScale: 0.85,
    },
  ],
};

export const TEMPLATES: Record<string, { nodes: CanvasNode[], connections: Connection[] }> = {
  'Máquinas & ERP': {
    nodes: INDUSTRIAL_MACHINE_TEMPLATE.nodes,
    connections: INDUSTRIAL_MACHINE_TEMPLATE.connections
  },
  'Manutenção & Ativos': {
    nodes: [
      {
        id: 'grp-maintenance',
        type: 'group',
        name: '01. Gestão de Ativos e Manutenção',
        x: 50,
        y: 80,
        width: 1450,
        height: 600,
        color: 'blue',
        status: 'Em Produção',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['manutenção', 'ativos'],
        data: {
          description: 'Controle de manutenção preventiva e corretiva de máquinas.',
          groupColor: '#3b82f6',
          groupIcon: 'Settings',
        },
      },
      {
        id: 'node-asset-1',
        type: 'product',
        name: 'Prensa Hidráulica Master-3000',
        x: 100,
        y: 160,
        width: 300,
        height: 400,
        color: 'blue',
        status: 'Em Produção',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['ativo', 'maquina'],
        data: {
          sku: 'MAQ-PH3000',
          unitPrice: 150000,
          stockQty: 1,
          minStockQty: 1,
          category: 'Ativos',
          description: 'Máquina principal da linha de dobra.',
        },
      },
      {
        id: 'node-maint-checklist',
        type: 'checklist',
        name: 'Plano de Manutenção Trimestral',
        x: 430,
        y: 160,
        width: 320,
        height: 450,
        color: 'amber',
        status: 'Pendente',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['preventiva'],
        data: {
          items: [
            { id: '1', text: 'Verificar nível de óleo hidráulico', checked: true },
            { id: '2', text: 'Lubrificação dos guias lineares', checked: false },
            { id: '3', text: 'Inspeção visual de vazamentos', checked: false },
            { id: '4', text: 'Teste de pressão de pico', checked: false },
            { id: '5', text: 'Limpeza dos filtros de ar', checked: false },
          ],
        },
      },
      {
        id: 'node-maint-kanban',
        type: 'kanban',
        name: 'Ordens de Serviço (OS)',
        x: 780,
        y: 160,
        width: 650,
        height: 450,
        color: 'slate',
        status: 'Em Andamento',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['kanban', 'os'],
        data: {
          columns: [
            { id: 'todo', title: 'Solicitado' },
            { id: 'doing', title: 'Em Produção' },
            { id: 'done', title: 'Concluído' },
          ],
          cards: [
            { id: 't1', title: 'Troca de vedação', columnId: 'todo' },
            { id: 't2', title: 'Calibração sensores', columnId: 'todo' },
            { id: 't3', title: 'Pintura de proteção', columnId: 'doing' },
            { id: 't4', title: 'Ajuste de correia', columnId: 'done' },
          ]
        },
      },
    ],
    connections: []
  },
  'Qualidade & Metrologia': {
    nodes: [
      {
        id: 'grp-quality',
        type: 'group',
        name: 'Setor de Inspeção e Qualidade',
        x: 50,
        y: 80,
        width: 1450,
        height: 550,
        color: 'cyan',
        status: 'Em Produção',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['qualidade', 'ISO9001'],
        data: {
          description: 'Controle de não conformidades e laudos técnicos.',
          groupColor: '#06b6d4',
          groupIcon: 'ShieldCheck',
        },
      },
      {
        id: 'node-qc-doc',
        type: 'document',
        name: 'Procedimento de Inspeção PI-001',
        x: 100,
        y: 160,
        width: 340,
        height: 200,
        color: 'indigo',
        status: 'Aprovado',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['documento', 'procedimento'],
        data: {
          docType: 'PDF',
          fileSize: '1.2 MB',
          docVersion: 'v4.0',
          description: 'Autor: Eng. Qualidade',
        },
      },
      {
        id: 'node-qc-note',
        type: 'note',
        name: 'Relatório de Não Conformidade',
        x: 750,
        y: 160,
        width: 310,
        height: 320,
        color: 'amber',
        status: 'Alerta',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        tags: ['nota', 'rnc'],
        data: {
          noteText: 'Lote #4521 apresentou dureza abaixo do especificado (HB 120). Aguardando análise da metalurgia.',
        },
      },
    ],
    connections: []
  },
  'Gestão de Projetos Ágeis': {
    nodes: [
      {
        id: 'grp-agile', type: 'group', name: '01. Squad Ágil', x: 50, y: 50, width: 1200, height: 600, color: 'blue', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['sprint'], data: { description: 'Acompanhamento da Sprint Atual e backlog.' }
      },
      {
        id: 'node-proj-agile', type: 'project', name: 'Lançamento App v2.0', x: 90, y: 130, width: 320, height: 390, color: 'cyan', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['app'], data: { projectProgress: 45, subModules: ['UI/UX Redesign', 'Integração API', 'Testes Beta'] }
      },
      {
        id: 'node-kanban-agile', type: 'kanban', name: 'Sprint Board', x: 440, y: 130, width: 650, height: 420, color: 'slate', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['kanban'], data: { columns: [{id: 'todo', title: 'To Do'}, {id: 'doing', title: 'In Progress'}, {id: 'done', title: 'Done'}], cards: [{id: 'c1', title: 'Design System', columnId: 'doing'}, {id: 'c2', title: 'Setup DB', columnId: 'done'}, {id: 'c3', title: 'Login Screen', columnId: 'todo'}] }
      },
      {
        id: 'node-dev-1', type: 'employee', name: 'Desenvolvedor Frontend', x: 1120, y: 130, width: 280, height: 280, color: 'indigo', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['dev'], data: { role: 'Pleno', department: 'Engenharia' }
      }
    ],
    connections: []
  },
  'Fluxo de Vendas e CRM': {
    nodes: [
      {
        id: 'grp-crm', type: 'group', name: '01. Funil de Vendas', x: 50, y: 50, width: 1400, height: 500, color: 'emerald', status: 'Aprovado', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['vendas'], data: { description: 'Do lead até o faturamento.' }
      },
      {
        id: 'node-crm-cust', type: 'customer', name: 'Lead Qualificado', x: 90, y: 130, width: 300, height: 220, color: 'blue', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['lead'], data: { contactName: 'Maria Silva', email: 'contato@empresa.com' }
      },
      {
        id: 'node-crm-order', type: 'order', name: 'Proposta Comercial', x: 420, y: 130, width: 280, height: 350, color: 'amber', status: 'Orçamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['proposta'], data: { orderValue: 15000, itemsList: ['Consultoria 10h', 'Implantação Software'] }
      },
      {
        id: 'node-crm-inv', type: 'invoice', name: 'Nota Fiscal / Faturamento', x: 730, y: 130, width: 300, height: 240, color: 'emerald', status: 'A Fazer', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['nf'], data: {  }
      },
      {
        id: 'node-crm-fin', type: 'financial_module', name: 'Receita Prevista', x: 1060, y: 130, width: 320, height: 250, color: 'emerald', status: 'Aprovado', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['financeiro'], data: {  }
      }
    ],
    connections: [
      { id: 'c-crm-1', fromId: 'node-crm-cust', toId: 'node-crm-order', fromHandle: 'right', toHandle: 'left', strokeWidth: 2 },
      { id: 'c-crm-2', fromId: 'node-crm-order', toId: 'node-crm-inv', fromHandle: 'right', toHandle: 'left', strokeWidth: 2 },
      { id: 'c-crm-3', fromId: 'node-crm-inv', toId: 'node-crm-fin', fromHandle: 'right', toHandle: 'left', strokeWidth: 2 }
    ]
  },
  'Recursos Humanos (Onboarding)': {
    nodes: [
      {
        id: 'grp-hr', type: 'group', name: 'Integração de Novos Colaboradores', x: 50, y: 50, width: 1100, height: 500, color: 'rose', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['rh'], data: {}
      },
      {
        id: 'node-hr-emp', type: 'employee', name: 'Novo Contratado', x: 90, y: 130, width: 250, height: 200, color: 'indigo', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['onboarding'], data: { role: 'Analista Júnior', department: 'Marketing' }
      },
      {
        id: 'node-hr-chk', type: 'checklist', name: 'Passos do Onboarding', x: 380, y: 130, width: 320, height: 350, color: 'amber', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['checklist'], data: { items: [{id:'1', text:'Entrega Equipamentos', checked:true}, {id:'2', text:'Criação Email', checked:true}, {id:'3', text:'Treinamento Segurança', checked:false}] }
      },
      {
        id: 'node-hr-doc', type: 'document', name: 'Manual de Integração', x: 740, y: 130, width: 340, height: 180, color: 'slate', status: 'Aprovado', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['doc'], data: { docType: 'PDF', fileSize: '2.5 MB' }
      }
    ],
    connections: []
  },
  'Desenvolvimento de Software (P&D)': {
    nodes: [
      {
        id: 'grp-pd', type: 'group', name: 'Pesquisa & Desenvolvimento', x: 50, y: 50, width: 1200, height: 550, color: 'indigo', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['p&d'], data: {}
      },
      {
        id: 'node-pd-proj', type: 'project', name: 'Novo Algoritmo AI', x: 90, y: 130, width: 320, height: 390, color: 'cyan', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['ai'], data: { projectProgress: 20 }
      },
      {
        id: 'node-pd-kanban', type: 'kanban', name: 'Tarefas Dev', x: 440, y: 130, width: 650, height: 420, color: 'slate', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['kanban'], data: { columns: [{id: 'backlog', title: 'Backlog'}, {id: 'dev', title: 'Desenvolvimento'}], cards: [{id: 't1', title: 'Estudo de Viabilidade', columnId: 'dev'}] }
      }
    ],
    connections: []
  },
  'Planejamento Estratégico e Metas': {
    nodes: [
      {
        id: 'grp-strat', type: 'group', name: 'Objetivos Globais 2026', x: 50, y: 50, width: 1000, height: 600, color: 'amber', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['estrategia'], data: {}
      },
      {
        id: 'node-strat-proj', type: 'project', name: 'Expansão Internacional', x: 400, y: 130, width: 320, height: 350, color: 'indigo', status: 'Orçamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['projeto'], data: { projectProgress: 10 }
      }
    ],
    connections: []
  },
  'Logística e Frota': {
    nodes: [
      {
        id: 'grp-log', type: 'group', name: 'Operações e Entregas', x: 50, y: 50, width: 1100, height: 500, color: 'slate', status: 'Em Produção', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['logistica'], data: {}
      },
      {
        id: 'node-log-serv', type: 'service', name: 'Entrega Rota Sul', x: 90, y: 130, width: 280, height: 220, color: 'amber', status: 'Em Produção', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['entrega'], data: { estimatedHours: 8 }
      },
      {
        id: 'node-log-emp', type: 'employee', name: 'Motorista', x: 400, y: 130, width: 250, height: 200, color: 'blue', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['frota'], data: { role: 'Motorista Categoria D' }
      }
    ],
    connections: [
       { id: 'c-log-1', fromId: 'node-log-emp', toId: 'node-log-serv', fromHandle: 'left', toHandle: 'right', strokeWidth: 2 }
    ]
  },
  'Organização de Eventos': {
    nodes: [
      {
        id: 'grp-evt', type: 'group', name: 'Feira Setorial 2026', x: 50, y: 50, width: 1200, height: 550, color: 'rose', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['evento'], data: {}
      },
      {
        id: 'node-evt-proj', type: 'project', name: 'Estande e Marketing', x: 90, y: 130, width: 320, height: 350, color: 'rose', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['evento'], data: { projectProgress: 60 }
      },
      {
        id: 'node-evt-chk', type: 'checklist', name: 'Preparativos', x: 440, y: 130, width: 320, height: 350, color: 'amber', status: 'Em Andamento', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['check'], data: { items: [{id:'1', text:'Reservar Espaço', checked:true}, {id:'2', text:'Brindes', checked:false}] }
      },
      {
        id: 'node-evt-fin', type: 'financial_module', name: 'Orçamento do Evento', x: 790, y: 130, width: 320, height: 250, color: 'emerald', status: 'Aprovado', createdAt: '2026-09-02', updatedAt: '2026-09-02', tags: ['financeiro'], data: {  }
      }
    ],
    connections: []
  }
};

export const initialIndustrialNodes: CanvasNode[] = INDUSTRIAL_MACHINE_TEMPLATE.nodes;
export const initialIndustrialConnections: Connection[] = INDUSTRIAL_MACHINE_TEMPLATE.connections;
export const industrialPresentationSlides: PresentationSlide[] = (INDUSTRIAL_MACHINE_TEMPLATE.presentationSteps || []).map((step) => ({
  id: step.id,
  title: step.title,
  targetNodeIds: step.nodeIds,
  description: step.description,
  zoomLevel: step.zoomScale,
}));

