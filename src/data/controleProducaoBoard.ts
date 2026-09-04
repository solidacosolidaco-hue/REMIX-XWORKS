import { CanvasNode, Connection } from '../types/canvas';

export const CONTROLE_PRODUCAO_NODES: CanvasNode[] = [
  {
    "x": -728,
    "y": -1267,
    "id": "node-group-1788472576784",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "COMERCIAL",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 1398,
    "height": 1411,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 4147,
    "y": -1374,
    "id": "node-group-1788472649224",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "ENGENHARIA",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 677,
    "height": 2021,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 1716,
    "y": -1281,
    "id": "node-group-1788472688375",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "PCP",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 1261,
    "height": 1993,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 5526,
    "y": -1427,
    "id": "node-group-1788472896335",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "COMPRAS",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 964,
    "height": 1815,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 7442,
    "y": -1483,
    "id": "node-group-1788472914047",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "CORTE E DOBRA",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 857,
    "height": 1975,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 9231,
    "y": -1508,
    "id": "node-group-1788472935696",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "USINAGEM",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 778,
    "height": 1994,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 10686,
    "y": -1565,
    "id": "node-group-1788472965431",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "SERRA FITA",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 750,
    "height": 2049,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 12446,
    "y": -1470,
    "id": "node-group-1788472991703",
    "data": {
      "groupIcon": "Layers",
      "description": "Setor delimitado de processos"
    },
    "name": "FINANCEIRO",
    "tags": [
      "group"
    ],
    "type": "group",
    "color": "blue",
    "width": 973,
    "height": 2022,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 240,
    "y": -1083,
    "id": "node-budget-1788473070448",
    "data": {
      "status": "Aprovado",
      "content": "Clique duas vezes para editar o texto...",
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "hideValue": false,
      "issueDate": "2026-08-25",
      "itemsList": [
        "Estrutura metálica usinada em viga W250 com furações CNC",
        "Sistema hidráulico de acionamento 350 bar com manifold integrado",
        "Pintura eletrostática epóxi espessura mínima 180 micras - Cor RAL 5010"
      ],
      "orderType": "order",
      "startDate": "2026-09-01",
      "taxAmount": 13300,
      "enableGlow": true,
      "orderItems": [
        {
          "id": "item-1",
          "code": "EST-4401",
          "unit": "CJ",
          "taxRate": 5,
          "quantity": 4,
          "subtotal": 130000,
          "unitPrice": 32500,
          "description": "Estrutura metálica usinada em viga W250 com furações CNC"
        },
        {
          "id": "item-2",
          "code": "HID-8802",
          "unit": "UN",
          "taxRate": 8,
          "quantity": 2,
          "subtotal": 85000,
          "unitPrice": 42500,
          "description": "Sistema hidráulico de acionamento 350 bar com manifold integrado"
        },
        {
          "id": "item-3",
          "code": "PIN-009",
          "unit": "LOT",
          "taxRate": 0,
          "quantity": 1,
          "subtotal": 35000,
          "unitPrice": 35000,
          "description": "Pintura eletrostática epóxi espessura mínima 180 micras - Cor RAL 5010"
        }
      ],
      "orderValue": 263100,
      "carrierName": "Jamef Encomendas Urgentes",
      "contactName": "Renata Valente",
      "budgetNumber": "ORC-2026-8821",
      "contactEmail": "renata.valente@empresaabc.com.br",
      "contactPhone": "(11) 98765-4321",
      "customerCnpj": "12.345.678/0001-90",
      "customerName": "Novo Cliente",
      "shippingCost": 4800,
      "shippingType": "CIF",
      "withoutValue": false,
      "hideValueOnly": false,
      "itemsSubtotal": 250000,
      "orderProgress": 0,
      "paymentMethod": "Boleto Bancário Faturado",
      "discountAmount": 5000,
      "commercialNotes": "Exigido certificado de matéria-prima e ensaio por ultrassom das soldas conforme AWS D1.1.",
      "descriptiveOnly": false,
      "totalOrderValue": 263100,
      "commercialStatus": "Pedido de Venda Confirmado",
      "deliveryDeadline": "2026-09-20",
      "deliveryLocation": "Av. das Indústrias, 1500 - Galpão 4, São Paulo - SP",
      "descriptiveNotes": "",
      "salesOrderNumber": "PV-4498",
      "clientOrderNumber": "OC-90214/26",
      "paymentConditions": "28/56 DDL após emissão da NF-e",
      "connectionPointsPerSide": 3
    },
    "name": "Pedido #PV-4498 - Empresa ABC S/A",
    "tags": [
      "budget"
    ],
    "type": "order",
    "color": "emerald",
    "width": 280,
    "height": 180,
    "status": "Em Produção",
    "createdAt": "01/09/2026",
    "updatedAt": "2026-09-03T22:04:53.672Z"
  },
  {
    "x": 1755,
    "y": -1090,
    "id": "node-production_order-1788473130600",
    "data": {
      "deadline": "2026-09-15",
      "opNumber": "OP-3233",
      "priority": "Normal",
      "refOrder": "#91417",
      "currentValue": 100,
      "orderProgress": 100,
      "progressPercent": 100,
      "projectProgress": 100
    },
    "name": "Ordem de Produção",
    "tags": [
      "production_order"
    ],
    "type": "production_order",
    "color": "amber",
    "width": 320,
    "height": 350,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 2133,
    "y": -1003,
    "id": "node-production_route-1788473137087",
    "data": {
      "steps": [
        {
          "id": "step-10",
          "name": "Corte e Preparação de Tarugo SAE 4340",
          "status": "Concluído",
          "deadline": "2026-09-04",
          "operator": "Marcos Silva (RE-204)",
          "sequence": 1,
          "startDate": "2026-09-02",
          "estimatedHours": 4,
          "machineOrWorkcenter": "Serra Fita Automática S-320"
        },
        {
          "id": "step-2",
          "name": "Torneamento CNC e Desbaste Pesado",
          "status": "Em Andamento",
          "deadline": "2026-09-09",
          "operator": "Carlos Eduardo (RE-118)",
          "sequence": 2,
          "startDate": "2026-09-05",
          "estimatedHours": 12,
          "machineOrWorkcenter": "Torno CNC Romi GL-240"
        },
        {
          "id": "step-3",
          "name": "Fresamento de Canais e Rasgos de Chaveta",
          "status": "Pendente",
          "deadline": "2026-09-14",
          "operator": "André Luiz (RE-305)",
          "sequence": 3,
          "startDate": "2026-09-10",
          "estimatedHours": 8,
          "machineOrWorkcenter": "Centro de Usinagem 4 Eixos Haas"
        },
        {
          "id": "step-4",
          "name": "Tratamento Térmico por Indução & Retífica",
          "status": "Pendente",
          "deadline": "2026-09-18",
          "operator": "Eng. Roberto (RE-102)",
          "sequence": 4,
          "startDate": "2026-09-15",
          "estimatedHours": 10,
          "machineOrWorkcenter": "Forno de Têmpera / Retífica Cilíndrica"
        },
        {
          "id": "step-5",
          "name": "Inspeção Dimensional & Controle de Qualidade (CQ)",
          "status": "Pendente",
          "deadline": "2026-09-22",
          "operator": "Inspetor Qualidade CQ",
          "sequence": 5,
          "startDate": "2026-09-19",
          "estimatedHours": 4,
          "machineOrWorkcenter": "Laboratório Metrológico 3D Tridimensional"
        }
      ],
      "dueDate": "2026-09-22",
      "routeCode": "ROT-2026-11",
      "startDate": "2026-09-02",
      "productTarget": "Eixo de Transmissão 50HP",
      "overallRouteProgress": 40,
      "connectionPointsPerSide": 5
    },
    "name": "Roteiro de Produção: Usinagem & Montagem",
    "tags": [
      "production_route"
    ],
    "type": "production_route",
    "color": "cyan",
    "width": 360,
    "height": 460,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 2557,
    "y": -998,
    "id": "node-attachment-1788473350184",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": true
        }
      ],
      "currentValue": 100,
      "orderProgress": 0,
      "progressPercent": 100,
      "projectProgress": 0,
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Central de Anexos & URLs",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 1027,
    "y": -769,
    "id": "node-document-1788473366216",
    "data": {
      "docType": "PDF",
      "fileSize": "4.2 MB",
      "docVersion": "v1.0",
      "description": "Documento contendo especificações técnicas e requisitos normativos."
    },
    "name": "Especificação Técnica",
    "tags": [
      "document"
    ],
    "type": "document",
    "color": "blue",
    "width": 300,
    "height": 200,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 4310,
    "y": -1116,
    "id": "node-project-1788473609495",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "clientName": "Cliente Associado",
      "subModules": [
        "Modelagem 3D",
        "Elétrica e Automação",
        "Testes"
      ],
      "projectCode": "PX-2026",
      "currentValue": 100,
      "orderProgress": 100,
      "progressPercent": 100,
      "projectProgress": 100,
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Projeto PX-555",
    "tags": [
      "project"
    ],
    "type": "project",
    "color": "blue",
    "width": 340,
    "height": 280,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 3448,
    "y": -1417,
    "id": "node-document-1788473622695",
    "data": {
      "docType": "PDF",
      "fileSize": "4.2 MB",
      "docVersion": "v1.0",
      "description": "Documento contendo especificações técnicas e requisitos normativos."
    },
    "name": "Especificação Técnica",
    "tags": [
      "document"
    ],
    "type": "document",
    "color": "blue",
    "width": 300,
    "height": 200,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 4961,
    "y": -1301,
    "id": "node-attachment-1788473695832",
    "data": {
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": true
        }
      ],
      "currentValue": 100,
      "progressPercent": 100
    },
    "name": "Central de Anexos & URLs",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 5666,
    "y": -1108,
    "id": "node-kanban-1788473881768",
    "data": {
      "cards": [
        {
          "id": "c1",
          "title": "Elaborar plano de montagem",
          "columnId": "col-todo",
          "priority": "alta"
        },
        {
          "id": "c2",
          "title": "Comprar componentes de reposição",
          "columnId": "col-in-progress",
          "priority": "media"
        }
      ],
      "columns": [
        {
          "id": "col-todo",
          "color": "#64748b",
          "title": "A FAZER"
        },
        {
          "id": "col-in-progress",
          "color": "#3b82f6",
          "title": "EM ANDAMENTO"
        },
        {
          "id": "col-done",
          "color": "#10b981",
          "title": "CONCLUÍDO"
        }
      ]
    },
    "name": "Fluxo de Tarefas",
    "tags": [
      "kanban"
    ],
    "type": "kanban",
    "color": "blue",
    "width": 620,
    "height": 360,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 6809,
    "y": -1309,
    "id": "node-attachment-1788473994752-0-919",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": false
        }
      ],
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Central de Anexos & URLs (Cópia)",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 7545,
    "y": -1223,
    "id": "node-kanban-1788474012039-0-776",
    "data": {
      "cards": [
        {
          "id": "c1",
          "title": "Elaborar plano de montagem",
          "columnId": "col-done",
          "priority": "alta"
        },
        {
          "id": "c2",
          "title": "Comprar componentes de reposição",
          "columnId": "col-done",
          "priority": "media"
        }
      ],
      "columns": [
        {
          "id": "col-todo",
          "color": "#64748b",
          "title": "A FAZER"
        },
        {
          "id": "col-in-progress",
          "color": "#3b82f6",
          "title": "EM ANDAMENTO"
        },
        {
          "id": "col-done",
          "color": "#10b981",
          "title": "CONCLUÍDO"
        }
      ],
      "currentValue": 100,
      "progressPercent": 100
    },
    "name": "Fluxo de Tarefas (Cópia)",
    "tags": [
      "kanban"
    ],
    "type": "kanban",
    "color": "blue",
    "width": 620,
    "height": 360,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": -703,
    "y": -1028,
    "id": "node-customer-1788474199479",
    "data": {
      "cnpj": "12.345.678/0001-90",
      "email": "contato@novocliente.com",
      "phone": "(11) 98765-4321",
      "address": "São Paulo - SP",
      "contactName": "Diretor Comercial",
      "ordersCount": 1,
      "totalRevenue": "R$ 100.000",
      "projectsCount": 1
    },
    "name": "Novo Cliente",
    "tags": [
      "customer"
    ],
    "type": "customer",
    "color": "blue",
    "width": 320,
    "height": 220,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  },
  {
    "x": 8577,
    "y": -1501,
    "id": "node-attachment-1788474288087-0-542",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": false
        }
      ],
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Central de Anexos & URLs (Cópia) (Cópia)",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 10168,
    "y": -1522,
    "id": "node-attachment-1788474296127-0-963",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": false
        }
      ],
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Central de Anexos & URLs (Cópia) (Cópia)",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 11766,
    "y": -1423,
    "id": "node-attachment-1788474306337-0-102",
    "data": {
      "dueDate": "2026-09-20",
      "deadline": "2026-09-20",
      "startDate": "2026-09-01",
      "attachments": [
        {
          "id": "att-1",
          "url": "https://drive.google.com/file/d/sample-cad",
          "name": "Desenho Técnico (CAD)",
          "type": "cad",
          "checked": true
        },
        {
          "id": "att-2",
          "url": "https://drive.google.com/file/d/sample-pdf",
          "name": "Especificação Técnica PDF",
          "type": "pdf",
          "checked": true
        },
        {
          "id": "att-3",
          "url": "https://docs.google.com/spreadsheets/d/sample-sheet",
          "name": "Planilha de Custo / Orçamento",
          "type": "doc",
          "checked": false
        }
      ],
      "deliveryDeadline": "2026-09-20"
    },
    "name": "Central de Anexos & URLs (Cópia) (Cópia)",
    "tags": [
      "attachment"
    ],
    "type": "attachment",
    "color": "blue",
    "width": 350,
    "height": 340,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 9296,
    "y": -1238,
    "id": "node-kanban-1788474345895-0-996",
    "data": {
      "cards": [
        {
          "id": "c1",
          "title": "Elaborar plano de montagem",
          "columnId": "col-todo",
          "priority": "alta"
        },
        {
          "id": "c2",
          "title": "Comprar componentes de reposição",
          "columnId": "col-in-progress",
          "priority": "media"
        }
      ],
      "columns": [
        {
          "id": "col-todo",
          "color": "#64748b",
          "title": "A FAZER"
        },
        {
          "id": "col-in-progress",
          "color": "#3b82f6",
          "title": "EM ANDAMENTO"
        },
        {
          "id": "col-done",
          "color": "#10b981",
          "title": "CONCLUÍDO"
        }
      ]
    },
    "name": "Fluxo de Tarefas (Cópia) (Cópia)",
    "tags": [
      "kanban"
    ],
    "type": "kanban",
    "color": "blue",
    "width": 620,
    "height": 360,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 10747,
    "y": -1306,
    "id": "node-kanban-1788474396735-0-138",
    "data": {
      "cards": [
        {
          "id": "c1",
          "title": "Elaborar plano de montagem",
          "columnId": "col-todo",
          "priority": "alta"
        },
        {
          "id": "c2",
          "title": "Comprar componentes de reposição",
          "columnId": "col-in-progress",
          "priority": "media"
        }
      ],
      "columns": [
        {
          "id": "col-todo",
          "color": "#64748b",
          "title": "A FAZER"
        },
        {
          "id": "col-in-progress",
          "color": "#3b82f6",
          "title": "EM ANDAMENTO"
        },
        {
          "id": "col-done",
          "color": "#10b981",
          "title": "CONCLUÍDO"
        }
      ]
    },
    "name": "Fluxo de Tarefas (Cópia) (Cópia)",
    "tags": [
      "kanban"
    ],
    "type": "kanban",
    "color": "blue",
    "width": 620,
    "height": 360,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": 12609,
    "y": -1162,
    "id": "node-kanban-1788474398927-0-122",
    "data": {
      "cards": [
        {
          "id": "c1",
          "title": "Elaborar plano de montagem",
          "columnId": "col-todo",
          "priority": "alta"
        },
        {
          "id": "c2",
          "title": "Comprar componentes de reposição",
          "columnId": "col-in-progress",
          "priority": "media"
        }
      ],
      "columns": [
        {
          "id": "col-todo",
          "color": "#64748b",
          "title": "A FAZER"
        },
        {
          "id": "col-in-progress",
          "color": "#3b82f6",
          "title": "EM ANDAMENTO"
        },
        {
          "id": "col-done",
          "color": "#10b981",
          "title": "CONCLUÍDO"
        }
      ]
    },
    "name": "Fluxo de Tarefas (Cópia) (Cópia)",
    "tags": [
      "kanban"
    ],
    "type": "kanban",
    "color": "blue",
    "width": 620,
    "height": 360,
    "locked": false,
    "status": "A Fazer",
    "createdAt": "03/09/2026",
    "updatedAt": "03/09/2026"
  },
  {
    "x": -228,
    "y": -1098,
    "id": "node-budget-1788487132054",
    "data": {
      "content": "Clique duas vezes para editar o texto...",
      "hideValue": false,
      "orderValue": 120000,
      "validUntil": "2026-09-25",
      "customerName": "Cliente em Prospecção",
      "hideValueOnly": false,
      "totalOrderValue": 120000,
      "paymentConditions": "30 DDL"
    },
    "name": "Texto",
    "tags": [
      "budget"
    ],
    "type": "budget",
    "color": "blue",
    "width": 280,
    "height": 180,
    "status": "A Fazer",
    "createdAt": "01/09/2026",
    "updatedAt": "01/09/2026"
  }
];

export const CONTROLE_PRODUCAO_CONNECTIONS: Connection[] = [
  {
    "id": "conn-1788473462368",
    "toId": "node-production_order-1788473130600",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-document-1788473366216",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473471575",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-production_order-1788473130600",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473539839",
    "toId": "node-attachment-1788473350184",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-production_route-1788473137087",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473639135",
    "toId": "node-document-1788473622695",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473350184",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473762695",
    "toId": "node-attachment-1788473695832",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473350184",
    "animated": true,
    "autoSync": true,
    "toHandle": "top-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473898279",
    "toId": "node-kanban-1788473881768",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473695832",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788473947279",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-project-1788473609495",
    "animated": true,
    "autoSync": true,
    "toHandle": "right-5",
    "lineStyle": "curved",
    "fromHandle": "left-3",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474035775",
    "toId": "node-kanban-1788474012039-0-776",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473994752-0-919",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474059753",
    "toId": "node-attachment-1788473994752-0-919",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473350184",
    "animated": true,
    "autoSync": true,
    "toHandle": "top-1",
    "lineStyle": "curved",
    "fromHandle": "top-3",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474324023",
    "toId": "node-attachment-1788474288087-0-542",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-production_route-1788473137087",
    "animated": true,
    "autoSync": true,
    "toHandle": "top-1",
    "lineStyle": "curved",
    "fromHandle": "top-5",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474359055",
    "toId": "node-kanban-1788474345895-0-996",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788474288087-0-542",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474426991",
    "toId": "node-attachment-1788474296127-0-963",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473350184",
    "animated": true,
    "autoSync": true,
    "toHandle": "top-1",
    "lineStyle": "curved",
    "fromHandle": "top-2",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474436935",
    "toId": "node-attachment-1788474306337-0-102",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788473350184",
    "animated": true,
    "autoSync": true,
    "toHandle": "top-1",
    "lineStyle": "curved",
    "fromHandle": "top-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474490754",
    "toId": "node-project-1788473609495",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-document-1788473622695",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-3",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474502607",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-kanban-1788474012039-0-776",
    "animated": true,
    "autoSync": true,
    "toHandle": "bottom-5",
    "lineStyle": "curved",
    "fromHandle": "bottom-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474509368",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-kanban-1788473881768",
    "animated": true,
    "autoSync": true,
    "toHandle": "bottom-4",
    "lineStyle": "curved",
    "fromHandle": "bottom-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474531807",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-kanban-1788474345895-0-996",
    "animated": true,
    "autoSync": true,
    "toHandle": "bottom-4",
    "lineStyle": "curved",
    "fromHandle": "bottom-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474540511",
    "toId": "node-production_route-1788473137087",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-kanban-1788474396735-0-138",
    "animated": true,
    "autoSync": true,
    "toHandle": "bottom-4",
    "lineStyle": "curved",
    "fromHandle": "bottom-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788474652968",
    "toId": "node-kanban-1788474398927-0-122",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788474306337-0-102",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788485266907",
    "toId": "node-kanban-1788474396735-0-138",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-attachment-1788474296127-0-963",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-2",
    "dataExchange": {},
    "relationType": "custom"
  },
  {
    "id": "conn-1788487465858",
    "toId": "node-budget-1788487132054",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-customer-1788474199479",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom",
    "strokePattern": "solid"
  },
  {
    "id": "conn-1788487468458",
    "toId": "node-budget-1788473070448",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-budget-1788487132054",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom",
    "strokePattern": "solid"
  },
  {
    "id": "conn-1788487484146",
    "toId": "node-document-1788473366216",
    "arrow": "end",
    "color": "#38bdf8",
    "label": "relacionado",
    "fromId": "node-budget-1788473070448",
    "animated": true,
    "autoSync": true,
    "toHandle": "left-1",
    "lineStyle": "curved",
    "fromHandle": "right-1",
    "dataExchange": {},
    "relationType": "custom",
    "strokePattern": "solid"
  }
];
