import {
  CanvasNode,
  NodeType,
  Connection,
  InvoiceDocument,
  InvoiceItem,
  TraceabilityRecord,
  ModuleNature,
} from '../types/canvas';

/**
 * Maps a node type to its functional nature/category.
 */
export function getNodeNature(type: NodeType): ModuleNature {
  switch (type) {
    case 'customer':
    case 'product':
    case 'part':
    case 'employee':
    case 'supervisor':
    case 'sector':
      return 'Base de Dados';
    case 'order':
    case 'project':
    case 'production_order':
    case 'finalized_order':
    case 'invoice':
    case 'financial_module':
    case 'service':
      return 'Fluxo Principal';
    case 'kanban':
    case 'checklist':
    case 'production_route':
      return 'Controle Operacional';
    case 'indicator':
      return 'Métrica de Desempenho';
    case 'progress':
      return 'Avanço de Status';
    case 'document':
    case 'note':
    case 'text':
      return 'Documentação';
    case 'deadline':
    case 'calendar':
      return 'Prazo Crítico';
    case 'group':
      return 'Setor';
    default:
      return 'Suporte';
  }
}

/**
 * Descriptions for each functional nature.
 */
export const NATURE_DESCRIPTIONS: Record<ModuleNature, string> = {
  'Base de Dados': 'Entidades fundamentais. Define quem são seus clientes, máquinas e equipe.',
  'Fluxo Principal': 'Onde o valor é gerado. Representa os pedidos e projetos ativos no faturamento.',
  'Controle Operacional': 'Gestão direta do "fazer". Onde as tarefas e roteiros de produção são operados.',
  'Métrica de Desempenho': 'Monitoramento de KPIs. Mede a eficiência, qualidade e resultados numéricos.',
  'Avanço de Status': 'Monitoramento visual do progresso físico vs. cronograma esperado.',
  'Prazo Crítico': 'Monitoramento de tempo. Alertas de datas de entrega e marcos importantes.',
  'Documentação': 'Acervo de conhecimento. Manuais, desenhos técnicos e registros de suporte.',
  'Setor': 'Estrutura organizacional. Delimita o espaço físico de cada departamento.',
  'Suporte': 'Módulos auxiliares para complementação de dados e notas.'
};

export interface SimplifiedViewData {
  title: string;
  subtitle: string;
  percentage: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  lateTasks: number;
  statusText: string;
  statusType: 'success' | 'warning' | 'error' | 'info';
  secondaryMetricLabel?: string;
  secondaryMetricValue?: string;
  items: { id: string; name: string; type: NodeType; status: string }[];
}

/**
 * Extracts executive metrics for the Simplified View based on a context filter.
 */
export function getSimplifiedViewData(
  nodes: CanvasNode[],
  connections: Connection[],
  filter: string = 'all',
  isAutopilotActive: boolean = false
): SimplifiedViewData {
  let targetNodes = nodes;
  let title = 'VISÃO GERAL DO CANVAS';
  let subtitle = 'SITUAÇÃO GERAL';

  // Apply context filtering
  if (filter !== 'all') {
    // If filter is an ID (specific node)
    const target = nodes.find((n) => n.id === filter);
    if (target) {
      const context = getConnectedContextForNode(target.id, nodes, connections);
      if (context) {
        targetNodes = context.clusterNodes;
        title = target.name.toUpperCase();
        subtitle = `STATUS DO ${target.type === 'customer' ? 'CLIENTE' : target.type === 'order' ? 'PEDIDO' : 'PROJETO'}`;
      }
    } else {
      // Functional filters
      if (filter === 'production') {
        targetNodes = nodes.filter(n => ['kanban', 'checklist', 'sector', 'project', 'production_order'].includes(n.type));
        title = 'STATUS DA PRODUÇÃO';
        subtitle = 'EFICIÊNCIA OPERACIONAL';
      } else if (filter === 'orders') {
        targetNodes = nodes.filter(n => n.type === 'order' || n.type === 'finalized_order' || n.type === 'production_order');
        title = 'STATUS DE PEDIDOS';
        subtitle = 'CARTEIRA DE VENDAS & PCP';
      } else if (filter === 'projects') {
        targetNodes = nodes.filter(n => n.type === 'project');
        title = 'STATUS DE PROJETOS';
        subtitle = 'ENGENHARIA & DESENVOLVIMENTO';
      } else if (filter === 'tasks') {
        targetNodes = nodes.filter(n => n.type === 'kanban' || n.type === 'checklist' || n.type === 'production_order');
        title = 'CONTROLE DE TAREFAS';
        subtitle = 'EXECUÇÃO DIÁRIA';
      }
    }
  }

  // Calculate metrics
  const kanbanNodes = targetNodes.filter(n => n.type === 'kanban');
  const checklistNodes = targetNodes.filter(n => n.type === 'checklist');
  const projectNodes = targetNodes.filter(n => n.type === 'project' || n.type === 'order' || n.type === 'production_order');
  
  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let lateTasksCount = 0;

  // Process Kanbans
  kanbanNodes.forEach(k => {
    const cards = k.data.cards || [];
    totalTasks += cards.length;
    completedTasks += cards.filter((c: any) => c.columnId === 'col-done' || c.status === 'Concluído').length;
    inProgressTasks += cards.filter((c: any) => c.columnId === 'col-progress' || c.status === 'Em Andamento').length;
    lateTasksCount += cards.filter((c: any) => c.priority === 'alta' && c.columnId !== 'col-done').length; // heuristic for late
  });

  // Process Checklists
  checklistNodes.forEach(c => {
    const items = c.data.items || [];
    totalTasks += items.length;
    completedTasks += items.filter((i: any) => i.checked).length;
    inProgressTasks += items.filter((i: any) => !i.checked).length > 0 ? 1 : 0;
  });

  // Check for node-level status "Atrasado" or if timer stopped and manual status not finished
  const manualNotUpdated = targetNodes.filter(n => 
    ['project', 'order', 'production_order', 'checklist', 'kanban'].includes(n.type) &&
    n.status !== 'Concluído' &&
    (n.status as string) !== 'Entregue' &&
    (n.status as string) !== 'Disponível'
  );

  if (!isAutopilotActive && manualNotUpdated.length > 0) {
    lateTasksCount += manualNotUpdated.length;
  } else {
    lateTasksCount += targetNodes.filter(n => n.status === 'Atrasado' || n.status === 'Alerta').length;
  }

  // Percentage calculation
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (projectNodes.length > 0 ? projectNodes[0].data.projectProgress || projectNodes[0].data.orderProgress || 0 : 0);

  // Status determination
  let statusText = `${percentage}% CONCLUÍDO E DENTRO DO PRAZO`;
  let statusType: 'success' | 'warning' | 'error' | 'info' = 'info';

  if (!isAutopilotActive && manualNotUpdated.length > 0) {
    statusText = `PROJETO ATRASADO: TEMPORIZADOR PARADO E ${manualNotUpdated.length} STATUS PENDENTES DE ATUALIZAÇÃO MANUAL`;
    statusType = 'error';
  } else if (lateTasksCount > 0) {
    statusText = `ATENÇÃO: EXISTEM ${lateTasksCount} ITENS COM ATRASO OU ALERTA`;
    statusType = 'error';
  } else if (percentage === 100) {
    statusText = 'OPERACIONAL CONCLUÍDO COM SUCESSO';
    statusType = 'success';
  } else if (percentage < 40) {
    statusText = 'FASE INICIAL DE EXECUÇÃO';
    statusType = 'warning';
  } else if (percentage >= 85) {
    statusText = 'PROJETO EM FASE DE FINALIZAÇÃO';
    statusType = 'success';
  }

  // Secondary metrics
  let secondaryLabel = 'VALOR TOTAL';
  let secondaryValue = 'R$ 0,00';
  
  if (filter === 'orders' || filter === 'all') {
    const totalVal = targetNodes.filter(n => n.type === 'order').reduce((acc, n) => acc + (n.data.orderValue || 0), 0);
    secondaryValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal);
  } else if (targetNodes.length > 0 && targetNodes[0].type === 'order') {
    secondaryValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetNodes[0].data.orderValue || 0);
  }

  return {
    title,
    subtitle,
    percentage,
    totalTasks,
    completedTasks,
    inProgressTasks,
    lateTasks: lateTasksCount,
    statusText,
    statusType,
    secondaryMetricLabel: secondaryLabel,
    secondaryMetricValue: secondaryValue,
    items: targetNodes.map(n => ({ id: n.id, name: n.name, type: n.type, status: n.status }))
  };
}

/**
 * Traverses nodes and connections to extract customer-to-product mapping,
 * financial totals, orders, projects, and invoice linkages.
 * 
 * Regra de Negócio Crítica:
 * Se o temporizador automático parar (isAutopilotActive === false) e os status manuais
 * não forem atualizados manualmente (não estão Concluído/Entregue), marcar nos relatórios
 * como "Projeto Atrasado".
 */
export function analyzeTraceability(
  nodes: CanvasNode[],
  connections: Connection[],
  isAutopilotActive: boolean = false
): TraceabilityRecord[] {
  const nodeMap = new Map<string, CanvasNode>(nodes.map((n) => [n.id, n]));

  // Find all customers (or treat any root business nodes as customer entities)
  const customerNodes = nodes.filter((n) => n.type === 'customer');

  const records: TraceabilityRecord[] = [];

  customerNodes.forEach((cust) => {
    // 1. Find direct and indirect connected nodes
    const visited = new Set<string>();
    const queue = [cust.id];
    visited.add(cust.id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      // Find downstream and upstream connections
      connections.forEach((conn) => {
        if (conn.fromId === currentId && !visited.has(conn.toId)) {
          visited.add(conn.toId);
          queue.push(conn.toId);
        }
        if (conn.toId === currentId && !visited.has(conn.fromId)) {
          visited.add(conn.fromId);
          queue.push(conn.fromId);
        }
      });
    }

    const linkedNodes = Array.from(visited)
      .map((id) => nodeMap.get(id))
      .filter((n): n is CanvasNode => n !== undefined && n.id !== cust.id);

    // Check if automatic timer is stopped and manual statuses were not marked finished
    let hasUnfinishedManualStatus = false;
    let pendingManualCount = 0;

    // Filter orders
    const orders = linkedNodes
      .filter((n) => n.type === 'order' || n.type === 'finalized_order')
      .map((o) => {
        const isFinished = (o.status as string) === 'Entregue' || o.status === 'Concluído' || (o.data.orderProgress ?? 0) >= 100;
        let finalStatus = o.status;
        let isDelayed = o.status === 'Atrasado' || o.status === 'Alerta';
        let delayReason = undefined;

        // Regra do Usuário: Se temporizador automático parar e status manual não for atualizado para concluído
        if (!isAutopilotActive && !isFinished) {
          finalStatus = 'Atrasado';
          isDelayed = true;
          hasUnfinishedManualStatus = true;
          pendingManualCount++;
          delayReason = 'Temporizador automático inativo/parado sem confirmação manual';
        }

        return {
          orderId: o.id,
          orderCode: o.data.orderCode || `#${o.id.slice(0, 5)}`,
          orderName: o.name,
          orderValue: o.data.orderValue || 0,
          status: finalStatus,
          deadline: o.data.deliveryDeadline,
          progress: o.data.orderProgress ?? 0,
          isTimerStoppedDelayed: !isAutopilotActive && !isFinished,
          delayReason,
        };
      });

    // Filter projects / products / production orders
    const products = linkedNodes
      .filter((n) => n.type === 'project' || n.type === 'production_order')
      .map((p) => {
        const isFinished = p.status === 'Concluído' || (p.data.projectProgress ?? (p.data as any).progressPercent ?? 0) >= 100;
        let finalStatus = p.status;
        let isDelayed = p.status === 'Atrasado' || p.status === 'Alerta';
        let delayReason = undefined;

        // Regra do Usuário: Se temporizador automático parar e status manual não for atualizado para concluído
        if (!isAutopilotActive && !isFinished) {
          finalStatus = 'Atrasado';
          isDelayed = true;
          hasUnfinishedManualStatus = true;
          pendingManualCount++;
          delayReason = 'Temporizador automático inativo/parado sem confirmação manual';
        }

        return {
          projectId: p.id,
          projectCode: p.data.projectCode || (p.data as any).opNumber || `PRJ-${p.id.slice(0, 4)}`,
          productName: p.name,
          status: finalStatus,
          progress: p.data.projectProgress ?? (p.data as any).progressPercent ?? 0,
          responsible: p.assignee || (p.data as any).supervisor || 'Engenharia',
          isTimerStoppedDelayed: !isAutopilotActive && !isFinished,
          delayReason,
        };
      });

    // Filter operational nodes (checklists, kanbans)
    linkedNodes.forEach((n) => {
      if (['checklist', 'kanban', 'deadline'].includes(n.type)) {
        const isNodeFinished = n.status === 'Concluído' || (n.status as string) === 'Disponível';
        if (!isAutopilotActive && !isNodeFinished) {
          hasUnfinishedManualStatus = true;
          pendingManualCount++;
        }
      }
    });

    // Filter invoices (NF-e)
    const invoices = linkedNodes
      .filter((n) => n.type === 'invoice')
      .map((inv) => ({
        invoiceId: inv.id,
        nfeNumber: inv.data.invoiceNumber || 'NF-001042',
        nfeKey: inv.data.nfeKey,
        issueDate: inv.data.issueDate || '2026-09-01',
        value: inv.data.invoiceValue || 0,
        status: inv.data.nfeStatus || 'Autorizada',
      }));

    // Filter checklists
    const checklists = linkedNodes
      .filter((n) => n.type === 'checklist')
      .map((chk) => {
        const items = chk.data.items || [];
        const done = items.filter((i) => i.checked).length;
        return {
          checklistId: chk.id,
          name: chk.name,
          doneCount: done,
          totalCount: items.length,
        };
      });

    // Total Contract Value
    let totalVal = orders.reduce((acc, curr) => acc + (curr.orderValue || 0), 0);
    if (totalVal === 0 && cust.data.totalRevenue) {
      // parse text like "R$ 1.450.000"
      const cleaned = cust.data.totalRevenue.replace(/\D/g, '');
      totalVal = cleaned ? parseInt(cleaned, 10) : 0;
    }

    // Determine Health
    // Se o temporizador parou e status manuais não foram atualizados -> saúde é Crítico / Projeto Atrasado
    let health: 'Normal' | 'Alerta' | 'Crítico' = 'Normal';
    const isTimerStoppedDelayed = !isAutopilotActive && (hasUnfinishedManualStatus || orders.some(o => o.isTimerStoppedDelayed) || products.some(p => p.isTimerStoppedDelayed));

    if (isTimerStoppedDelayed) {
      health = 'Crítico';
    } else {
      const hasDelayed = linkedNodes.some((n) => n.status === 'Atrasado' || n.status === 'Alerta');
      if (hasDelayed) {
        health = linkedNodes.some((n) => n.status === 'Atrasado') ? 'Crítico' : 'Alerta';
      }
    }

    records.push({
      customerId: cust.id,
      customerName: cust.name,
      customerCnpj: cust.data.cnpj || '00.000.000/0001-00',
      customerSegment: cust.data.customerSegment || 'Indústria',
      orders,
      products,
      invoices,
      checklists,
      totalValue: totalVal,
      healthStatus: health,
      isTimerStoppedDelayed,
      pendingManualCount,
      timerAlertMessage: isTimerStoppedDelayed
        ? '⚠️ Projeto Atrasado: Temporizador automático parado e status operacionais não confirmados manualmente.'
        : undefined,
    });
  });

  return records;
}

/**
 * Get detailed connected context for a specific node in the canvas.
 * Answers: "De qual produto é o cliente?" and "Qual cliente contratou este pedido/projeto?"
 */
export function getConnectedContextForNode(
  nodeId: string,
  nodes: CanvasNode[],
  connections: Connection[]
) {
  const nodeMap = new Map<string, CanvasNode>(nodes.map((n) => [n.id, n]));
  const targetNode = nodeMap.get(nodeId);

  if (!targetNode) return null;

  // Find incoming & outgoing direct connections
  const incomingConns = connections.filter((c) => c.toId === nodeId);
  const outgoingConns = connections.filter((c) => c.fromId === nodeId);

  const directNeighbors = [
    ...incomingConns.map((c) => nodeMap.get(c.fromId)),
    ...outgoingConns.map((c) => nodeMap.get(c.toId)),
  ].filter((n): n is CanvasNode => n !== undefined);

  // Traverse full cluster
  const visited = new Set<string>();
  const queue = [nodeId];
  visited.add(nodeId);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    connections.forEach((c) => {
      if (c.fromId === cur && !visited.has(c.toId)) {
        visited.add(c.toId);
        queue.push(c.toId);
      }
      if (c.toId === cur && !visited.has(c.fromId)) {
        visited.add(c.fromId);
        queue.push(c.fromId);
      }
    });
  }

  const clusterNodes = Array.from(visited)
    .map((id) => nodeMap.get(id))
    .filter((n): n is CanvasNode => n !== undefined);

  const connectedCustomer = clusterNodes.find((n) => n.type === 'customer');
  const connectedOrders = clusterNodes.filter((n) => n.type === 'order');
  const connectedProjects = clusterNodes.filter((n) => n.type === 'project');
  const connectedInvoices = clusterNodes.filter((n) => n.type === 'invoice');
  const connectedChecklists = clusterNodes.filter((n) => n.type === 'checklist');
  const connectedDeadlines = clusterNodes.filter((n) => n.type === 'deadline');

  const totalValue = connectedOrders.reduce(
    (sum, o) => sum + (o.data.orderValue || 0),
    0
  );

  return {
    targetNode,
    directNeighbors,
    clusterNodes,
    connectedCustomer,
    connectedOrders,
    connectedProjects,
    connectedInvoices,
    connectedChecklists,
    connectedDeadlines,
    totalValue,
  };
}

/**
 * Synchronize connected nodes when connection or node changes.
 * Cascades Customer data -> Order data -> Project data -> Invoice data.
 */
export function synchronizeFlowData(
  fromNode: CanvasNode,
  toNode: CanvasNode,
  currentConn?: Connection
): { updatedFromNode: CanvasNode; updatedToNode: CanvasNode; updatedConnection: Partial<Connection> } {
  let updatedFrom = { ...fromNode };
  let updatedTo = { ...toNode };
  let connDataExchange: Record<string, any> = {};
  let defaultLabel = currentConn?.label || 'conecta com';
  let relationType = currentConn?.relationType || 'custom';

  // 1. Customer -> Order
  if (fromNode.type === 'customer' && toNode.type === 'order') {
    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        customerName: fromNode.name,
        customerCnpj: fromNode.data.cnpj,
      },
    };
    connDataExchange = {
      customerName: fromNode.name,
      cnpj: fromNode.data.cnpj,
      orderCode: toNode.data.orderCode,
      orderValue: toNode.data.orderValue,
      status: toNode.status,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'gerou pedido';
    relationType = 'client_to_order';
  }

  // 2. Order -> Customer (Reverse direction)
  else if (fromNode.type === 'order' && toNode.type === 'customer') {
    updatedFrom = {
      ...updatedFrom,
      data: {
        ...updatedFrom.data,
        customerName: toNode.name,
        customerCnpj: toNode.data.cnpj,
      },
    };
    connDataExchange = {
      customerName: toNode.name,
      cnpj: toNode.data.cnpj,
      orderCode: fromNode.data.orderCode,
      orderValue: fromNode.data.orderValue,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'pertence a';
    relationType = 'client_to_order';
  }

  // 3. Order -> Project
  else if (fromNode.type === 'order' && toNode.type === 'project') {
    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        clientName: fromNode.data.customerName || updatedTo.data.clientName,
        budget: fromNode.data.orderValue || updatedTo.data.budget,
      },
    };
    connDataExchange = {
      customerName: fromNode.data.customerName,
      orderCode: fromNode.data.orderCode,
      productName: toNode.name,
      budget: fromNode.data.orderValue,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'originou projeto';
    relationType = 'order_to_project';
  }

  // 4. Project -> Checklist / Production
  else if (fromNode.type === 'project' && toNode.type === 'checklist') {
    defaultLabel = currentConn?.label || 'ordem de fabricação';
    relationType = 'project_to_production';
  }

  // 5. Order/Customer -> Invoice
  else if (toNode.type === 'invoice') {
    const custName =
      fromNode.type === 'customer'
        ? fromNode.name
        : fromNode.data.customerName || 'Cliente Industrial';
    const cnpjVal =
      fromNode.type === 'customer'
        ? fromNode.data.cnpj
        : fromNode.data.customerCnpj || '12.345.678/0001-90';
    const val = fromNode.data.orderValue || fromNode.data.budget || 150000;

    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        customerCnpj: cnpjVal,
        invoiceValue: val,
        nfeStatus: 'Autorizada',
      },
    };
    defaultLabel = currentConn?.label || 'faturamento emitido';
    relationType = 'order_to_invoice';
  }

  // 6. Deadline -> Indicator
  else if (fromNode.type === 'deadline' && toNode.type === 'indicator') {
    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        kpiValue: `${fromNode.data.progressPercent || 0}%`,
      },
    };
    connDataExchange = {
      progressPercent: fromNode.data.progressPercent,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'monitora prazo';
    relationType = 'deadline_to_indicator';
  }

  // 7. Indicator -> Deadline
  else if (fromNode.type === 'indicator' && toNode.type === 'deadline') {
    const kpiValNum = parseInt((fromNode.data.kpiValue || '0').replace('%', ''), 10);
    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        progressPercent: isNaN(kpiValNum) ? 0 : kpiValNum,
      },
    };
    connDataExchange = {
      progressPercent: isNaN(kpiValNum) ? 0 : kpiValNum,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'alimenta prazo';
    relationType = 'indicator_to_deadline';
  }

  // 8. Progress & Indicator Sync (Bi-directional check)
  const isProgress = (n: CanvasNode) => n.type === 'progress';
  const isIndicator = (n: CanvasNode) => n.type === 'indicator';
  const isChecklist = (n: CanvasNode) => n.type === 'checklist';
  const isKanban = (n: CanvasNode) => n.type === 'kanban';

  if ((isProgress(fromNode) && isIndicator(toNode)) || (isIndicator(fromNode) && isProgress(toNode))) {
    const progNode = isProgress(fromNode) ? fromNode : toNode;
    const indNode = isIndicator(fromNode) ? fromNode : toNode;
    const isProgSource = isProgress(fromNode);

    if (isProgSource) {
      updatedTo = {
        ...updatedTo,
        data: {
          ...updatedTo.data,
          kpiValue: `${progNode.data.currentValue || 0}%`,
          progressPercent: progNode.data.currentValue || 0,
          currentValue: progNode.data.currentValue || 0,
        },
      };
    } else {
      updatedFrom = {
        ...updatedFrom,
        data: {
          ...updatedFrom.data,
          kpiValue: `${toNode.data.currentValue || 0}%`,
          progressPercent: toNode.data.currentValue || 0,
          currentValue: toNode.data.currentValue || 0,
        },
      };
    }
    
    connDataExchange = {
      currentValue: progNode.data.currentValue,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'sincronizado';
    relationType = 'progress_to_indicator';
  }

  // 10. Checklist/Kanban -> Indicator (Monitoring)
  else if ((isChecklist(fromNode) || isKanban(fromNode)) && isIndicator(toNode)) {
    let pct = 0;
    if (isChecklist(fromNode)) {
      const items = fromNode.data.items || [];
      const done = items.filter((i: any) => i.checked).length;
      pct = items.length > 0 ? Math.round((done / items.length) * 100) : (fromNode.data.currentValue || 0);
    } else {
      const cards = fromNode.data.cards || [];
      const done = cards.filter((c: any) => c.columnId === 'col-done' || c.status === 'Concluído').length;
      pct = cards.length > 0 ? Math.round((done / cards.length) * 100) : (fromNode.data.currentValue || 0);
    }
    
    updatedTo = {
      ...updatedTo,
      data: {
        ...updatedTo.data,
        kpiValue: `${pct}%`,
        progressPercent: pct,
        currentValue: pct,
      },
    };
    connDataExchange = {
      progress: pct,
      syncedAt: new Date().toISOString(),
    };
    defaultLabel = currentConn?.label || 'monitora status';
    relationType = 'status_to_indicator';
  }

  return {
    updatedFromNode: updatedFrom,
    updatedToNode: updatedTo,
    updatedConnection: {
      label: defaultLabel,
      relationType: relationType as any,
      dataExchange: {
        ...currentConn?.dataExchange,
        ...connDataExchange,
      },
      autoSync: true,
    },
  };
}

/**
 * Generate a complete, Brazilian standard NF-e / DANFE document
 * dynamically pulling data from connected Customer, Order, and Project nodes.
 */
export function generateNFeDocument(
  customer?: CanvasNode | null,
  order?: CanvasNode | null,
  project?: CanvasNode | null
): InvoiceDocument {
  const nfeNum = Math.floor(100000 + Math.random() * 900000).toString();
  const rawKey = `3526090412345600018955001000${nfeNum}1098765432`;
  const formattedKey = rawKey.padEnd(44, '0').slice(0, 44);

  const clientName =
    customer?.name || order?.data.customerName || 'Empresa ABC S/A Indústria';
  const clientCnpj =
    customer?.data.cnpj || order?.data.customerCnpj || '12.345.678/0001-90';
  const clientAddr =
    customer?.data.address || 'Av. Industrial, 4500 - São Bernardo do Campo / SP';
  const clientEmail = customer?.data.email || 'fiscal@empresaabc.com.br';
  const clientPhone = customer?.data.phone || '(11) 98765-4321';

  const orderValue =
    order?.data.orderValue ||
    (customer?.data.totalRevenue ? 250000 : 180000);
  const itemsList = order?.data.itemsList || [
    project?.name || 'Máquina Hidráulica X-500 com CLP Siemens',
    'Conjunto de Válvulas Proporcionais 350 bar',
    'Laudo de Conformidade NR-12 e Teste Hidrostático',
  ];

  // Distribute items
  const items: InvoiceItem[] = itemsList.map((itemStr, idx) => {
    const portion = itemsList.length > 1 ? orderValue / itemsList.length : orderValue;
    return {
      id: `item-${idx + 1}`,
      code: `PROD-${1000 + idx * 15}`,
      description: itemStr,
      ncm: '8462.10.00',
      cfop: '5.101',
      quantity: 1,
      unit: 'UN',
      unitPrice: Math.round(portion),
      totalPrice: Math.round(portion),
      icmsPercent: 18,
      ipiPercent: 5,
    };
  });

  const productsTotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const icmsBase = productsTotal;
  const icmsValue = Math.round(icmsBase * 0.18);
  const ipiValue = Math.round(productsTotal * 0.05);
  const pisValue = Math.round(productsTotal * 0.0065);
  const cofinsValue = Math.round(productsTotal * 0.03);
  const grandTotal = productsTotal + ipiValue;

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    id: `nfe-doc-${Date.now()}`,
    nfeNumber: `000.${nfeNum}`,
    series: '001',
    issueDate: todayStr,
    nfeKey: formattedKey,
    protocolNumber: `135260098471234 - Autorizado em ${todayStr} 14:30:00`,
    status: 'Autorizada',

    // Issuer (Sua Empresa Industrial)
    issuerName: 'XCANVAS MÁQUINAS & SISTEMAS INDUSTRIAIS LTDA',
    issuerCnpj: '04.123.456/0001-89',
    issuerIe: '148.987.654.110',
    issuerAddress: 'Rodovia dos Bandeirantes, Km 68 - Distrito Industrial',
    issuerCity: 'Campinas',
    issuerState: 'SP',

    // Recipient
    recipientName: clientName,
    recipientCnpj: clientCnpj,
    recipientIe: '324.556.778.990',
    recipientAddress: clientAddr,
    recipientCity: 'São Bernardo do Campo',
    recipientState: 'SP',
    recipientEmail: clientEmail,
    recipientPhone: clientPhone,

    orderId: order?.id,
    orderCode: order?.data.orderCode || 'PED-10254',
    customerId: customer?.id,
    projectId: project?.id,
    productName: project?.name || itemsList[0],

    items,

    productsTotal,
    discountTotal: 0,
    shippingTotal: 0,
    icmsBase,
    icmsValue,
    ipiValue,
    pisValue,
    cofinsValue,
    grandTotal,

    paymentMethod: 'Boleto Bancário (30/60/90 Dias)',
    installments: [
      {
        number: 1,
        dueDate: '2026-10-01',
        value: Math.round(grandTotal / 3),
      },
      {
        number: 2,
        dueDate: '2026-11-01',
        value: Math.round(grandTotal / 3),
      },
      {
        number: 3,
        dueDate: '2026-12-01',
        value: grandTotal - Math.round(grandTotal / 3) * 2,
      },
    ],
    additionalInfo: `Documento emitido referente ao Pedido ${
      order?.data.orderCode || 'PED-10254'
    }. Produto vinculado: ${
      project?.name || 'Máquina Hidráulica X-500'
    }. Garantia contratual de 24 meses conforme proposta comercial.`,
  };
}

/**
 * Generate official simulated SEFAZ XML string
 */
export function generateNFeXml(nfe: InvoiceDocument): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${nfe.nfeKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>09876543</cNF>
        <natOp>VENDA DE PRODUCAO DO ESTABELECIMENTO</natOp>
        <mod>55</mod>
        <serie>${nfe.series}</serie>
        <nNF>${nfe.nfeNumber.replace(/\D/g, '')}</nNF>
        <dhEmi>${nfe.issueDate}T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3509502</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
      </ide>
      <emit>
        <CNPJ>${nfe.issuerCnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${nfe.issuerName}</xNome>
        <IE>${nfe.issuerIe.replace(/\D/g, '')}</IE>
        <enderEmit>
          <xLgr>${nfe.issuerAddress}</xLgr>
          <xMun>${nfe.issuerCity}</xMun>
          <UF>${nfe.issuerState}</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${nfe.recipientCnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${nfe.recipientName}</xNome>
        <enderDest>
          <xLgr>${nfe.recipientAddress}</xLgr>
          <xMun>${nfe.recipientCity}</xMun>
          <UF>${nfe.recipientState}</UF>
        </enderDest>
        <email>${nfe.recipientEmail || ''}</email>
      </dest>
      <det>
${nfe.items
  .map(
    (it, idx) => `        <det nItem="${idx + 1}">
          <prod>
            <cProd>${it.code}</cProd>
            <xProd>${it.description}</xProd>
            <NCM>${it.ncm.replace(/\D/g, '')}</NCM>
            <CFOP>${it.cfop.replace(/\D/g, '')}</CFOP>
            <uCom>${it.unit}</uCom>
            <qCom>${it.quantity}</qCom>
            <vUnCom>${it.unitPrice.toFixed(2)}</vUnCom>
            <vProd>${it.totalPrice.toFixed(2)}</vProd>
          </prod>
        </det>`
  )
  .join('\n')}
      </det>
      <total>
        <ICMSTot>
          <vBC>${nfe.icmsBase.toFixed(2)}</vBC>
          <vICMS>${nfe.icmsValue.toFixed(2)}</vICMS>
          <vIPI>${nfe.ipiValue.toFixed(2)}</vIPI>
          <vPIS>${nfe.pisValue.toFixed(2)}</vPIS>
          <vCOFINS>${nfe.cofinsValue.toFixed(2)}</vCOFINS>
          <vNF>${nfe.grandTotal.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <infAdic>
        <infCpl>${nfe.additionalInfo}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL_009</verAplic>
      <chNFe>${nfe.nfeKey}</chNFe>
      <dhRecbto>${nfe.issueDate}T14:30:15-03:00</dhRecbto>
      <nProt>${nfe.protocolNumber.split(' ')[0]}</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
}

/**
 * Retorna os tipos de nós que são compatíveis/recomendados
 * para se conectar a partir do nó de origem.
 */
export function getValidConnectionTargets(sourceType: NodeType): NodeType[] {
  const allModules: NodeType[] = [
    'customer',
    'order',
    'project',
    'production_order',
    'production_route',
    'product',
    'part',
    'service',
    'employee',
    'supervisor',
    'sector',
    'deadline',
    'calendar',
    'progress',
    'kanban',
    'checklist',
    'indicator',
    'invoice',
    'financial_module',
    'finalized_order',
    'text',
    'note',
    'document',
    'group',
    'custom',
    'budget',
    'attachment'
  ];

  // As per user request to avoid any "invalid" connections, we always return all modules here.
  return allModules;
}

/**
 * Checks if a connection between two node types makes operational sense.
 */
export function isConnectionLogicValid(fromType: NodeType, toType: NodeType): boolean {
  // Documentation and universal nodes are always valid as they are auxiliary
  // We simply return true here now to remove the "FLUXO ILÓGICO" red warning
  // as per the user's request.
  return true;
}

/**
 * Calculates the financial value flowing through a connection based on source or target node data.
 */
export function calculateConnectionValue(fromNode: CanvasNode, toNode: CanvasNode): number {
  // Check common financial fields in both nodes
  const fromValue = fromNode.data.orderValue || fromNode.data.budget || fromNode.data.invoiceValue || 0;
  const toValue = toNode.data.orderValue || toNode.data.budget || toNode.data.invoiceValue || 0;
  
  // Prefer the source value for "feeding" logic, or the higher of the two
  return Math.max(fromValue, toValue);
}

/**
 * Determines the stroke width of a connection based on its financial value.
 */
export function getStrokeWidthFromValue(value: number): number {
  if (value <= 0) return 2;
  if (value < 10000) return 2.5;
  if (value < 50000) return 3.5;
  if (value < 100000) return 5;
  if (value < 500000) return 7;
  return 8.5; // Reduced by 30% from 12
}

/**
 * Determines which handles of a node are "mandatory" or "strongly recommended"
 * but currently lack connections.
 */
export function getMissingMandatoryHandles(
  node: CanvasNode,
  allConnections: Connection[]
): string[] {
  const nodeConnections = allConnections.filter(
    (c) => c.fromId === node.id || c.toId === node.id
  );

  const missingHandles: string[] = [];

  // Logic: Each node type has expected "Input" or "Output" roles
  switch (node.type) {
    case 'customer':
      // Customers should always output to an Order or Project
      const hasOutput = nodeConnections.some((c) => c.fromId === node.id);
      if (!hasOutput) {
        // Recommend Right or Bottom output
        missingHandles.push('right-2');
      }
      break;

    case 'order':
      // Orders need an Input (Customer) and an Output (Project/Invoice)
      const hasOrderInput = nodeConnections.some((c) => c.toId === node.id);
      const hasOrderOutput = nodeConnections.some((c) => c.fromId === node.id);
      if (!hasOrderInput) missingHandles.push('left-2');
      if (!hasOrderOutput) missingHandles.push('right-2');
      break;

    case 'project':
      // Projects need an Input (Order) and Output (Production/Checklist)
      const hasProjectInput = nodeConnections.some((c) => c.toId === node.id);
      const hasProjectOutput = nodeConnections.some((c) => c.fromId === node.id);
      if (!hasProjectInput) missingHandles.push('left-2');
      if (!hasProjectOutput) missingHandles.push('right-2');
      break;

    case 'kanban':
    case 'checklist':
      // Operational nodes need Input (Project) and Output (Indicator/Progress)
      const hasOpInput = nodeConnections.some((c) => c.toId === node.id);
      if (!hasOpInput) missingHandles.push('left-2');
      break;

    case 'invoice':
      // Invoices need Input (Order) and Output (Financial)
      const hasInvInput = nodeConnections.some((c) => c.toId === node.id);
      const hasInvOutput = nodeConnections.some((c) => c.fromId === node.id);
      if (!hasInvInput) missingHandles.push('left-2');
      if (!hasInvOutput) missingHandles.push('bottom-2');
      break;

    case 'indicator':
    case 'progress':
      // Indicators need an Input to monitor
      const hasIndInput = nodeConnections.some((c) => c.toId === node.id);
      if (!hasIndInput) missingHandles.push('left-2');
      break;

    case 'financial_module':
      // Financial modules need Input (Invoice/Order)
      const hasFinInput = nodeConnections.some((c) => c.toId === node.id);
      if (!hasFinInput) missingHandles.push('left-2');
      break;

    case 'deadline':
      const hasDeadlineLink = nodeConnections.length > 0;
      if (!hasDeadlineLink) missingHandles.push('left-2');
      break;
  }

  return missingHandles;
}

/**
 * Provides specific guidance on what should be connected to a given handle.
 */
export function getHandleConnectionGuidance(
  nodeType: NodeType,
  handleId: string
): string {
  const isInput = handleId.includes('left') || handleId.includes('top');
  
  const guidance: Record<string, { input: string; output: string }> = {

    group: {
      input: 'AGRUPAMENTO: Conecte para trazer fluxo para dentro deste grupo de quadros.',
      output: 'AGRUPAMENTO: Conecte para apontar a saída deste grupo para a próxima fase do projeto.'
    },
    employee: {
      input: 'ATRIBUIÇÃO: Conecte a um serviço, quadro ou projeto para atribuir este colaborador como responsável.',
      output: 'VÍNCULO DE EQUIPE: Conecte este colaborador a uma tarefa ou quadro para definir quem irá executá-la.'
    },
    service: {
      input: 'DEPENDÊNCIA DE SERVIÇO: Conecte um funcionário ou recurso que executará este serviço.',
      output: 'PRÓXIMO PASSO: Conecte ao próximo serviço ou à entrega final do que foi feito aqui.'
    },
    document: {
      input: 'REFERÊNCIA DE DADOS: Conecte a um projeto ou processo que gerou este documento.',
      output: 'DADOS DISPONÍVEIS: Conecte este documento a outro quadro que precisará destas informações para continuar.'
    },
    customer: {
      input: 'Este é o início do fluxo. Geralmente não recebe conexões externas.',
      output: 'CONECTE A UM PEDIDO: O cliente precisa gerar um novo pedido de venda para iniciar o processo.'
    },
    order: {
      input: 'AGUARDANDO CLIENTE: Conecte a um quadro de Cliente para identificar a origem desta venda.',
      output: 'CONECTE A UM PROJETO OU NOTA: Este pedido precisa gerar um Projeto de Engenharia ou uma Nota Fiscal.'
    },
    project: {
      input: 'AGUARDANDO PEDIDO: Conecte a um Pedido para vincular os dados técnicos ao contrato comercial.',
      output: 'INICIE A PRODUÇÃO: Conecte a um Kanban ou Checklist para disparar as tarefas no chão de fábrica.'
    },
    kanban: {
      input: 'AGUARDANDO PROJETO: As tarefas precisam dos dados técnicos vindos de um Projeto.',
      output: 'MONITORE O AVANÇO: Conecte a um Indicador KPI para acompanhar a produtividade deste setor.'
    },
    checklist: {
      input: 'VINCULE A UM PROJETO: Este checklist deve ser alimentado pelas especificações do Projeto.',
      output: 'MONITORE O STATUS: Conecte a um Indicador de Progresso para visualizar a conclusão.'
    },
    invoice: {
      input: 'VINCULE AO PEDIDO: A nota fiscal deve ser gerada a partir dos valores de um Pedido.',
      output: 'FLUXO FINANCEIRO: Conecte ao Módulo Financeiro para processar o recebimento.'
    },
    indicator: {
      input: 'FONTE DE DADOS: Conecte a um Kanban, Checklist ou Prazo para que este gráfico tenha dados para exibir.',
      output: 'Este é um ponto final de visualização de dados.'
    },
    progress: {
      input: 'MONITORE UM PROCESSO: Conecte a um Checklist ou Projeto para exibir a barra de progresso real.',
      output: 'Este é um ponto final de visualização de progresso.'
    },
    financial_module: {
      input: 'RECEBA DADOS: Conecte a uma Nota Fiscal ou Pedido para alimentar o seu DRE e Fluxo de Caixa.',
      output: 'Relatórios financeiros consolidados.'
    },
    deadline: {
      input: 'VINCULE A UM PROJETO: Este prazo precisa monitorar um Projeto ou Pedido específico.',
      output: 'Alerta visual de tempo.'
    }
  };

  const typeGuidance = guidance[nodeType as string];
  if (!typeGuidance) return isInput ? 'Conecte a partir de um passo anterior para receber dados e formar uma sequência lógica no seu quadro.' : 'Clique, segure e arraste esta linha até outro bloco para criar uma dependência e mostrar o próximo passo do seu projeto.';

  return isInput ? typeGuidance.input : typeGuidance.output;
}

/**
 * Finds recommended handles on other nodes that could satisfy the missing mandatory handles of a node.
 */
export function getRecommendedProviderHandles(
  missingNode: CanvasNode,
  missingHandleIds: string[],
  allNodes: CanvasNode[],
  allConnections: Connection[]
): Record<string, string[]> {
  const recommendations: Record<string, string[]> = {};

  missingHandleIds.forEach(handleId => {
    const isInput = handleId.includes('left') || handleId.includes('top');
    
    allNodes.forEach(otherNode => {
      if (otherNode.id === missingNode.id) return;
      
      const targets = getValidTargetHandles(
        isInput ? otherNode : missingNode,
        isInput ? 'right-2' : handleId,
        isInput ? missingNode : otherNode
      );

      if (targets.length > 0) {
        if (!recommendations[otherNode.id]) recommendations[otherNode.id] = [];
        // If we are looking for a provider for an input, the other node needs to provide an output
        recommendations[otherNode.id].push(isInput ? 'right-2' : 'left-2');
      }
    });
  });

  return recommendations;
}

/**
 * Returns the exact handles that are valid targets for a connection starting from sourceHandleId.
 */
export function getValidTargetHandles(
  sourceNode: CanvasNode,
  sourceHandleId: string,
  targetNode: CanvasNode
): string[] {
  const isSourceOutput = sourceHandleId.includes('right') || sourceHandleId.includes('bottom');
  const validTargets: string[] = [];

  // Basic flow rule: Output -> Input or Input -> Output
  // Also check node compatibility
  const sourceNature = getNodeNature(sourceNode.type);
  const targetNature = getNodeNature(targetNode.type);

  // If source is output, target must be input
  if (isSourceOutput) {
    // Target handles should be left or top
    const possibleHandles = ['left-1', 'left-2', 'left-3', 'top-1', 'top-2', 'top-3'];
    
    // Check if types are compatible (e.g., Customer -> Order)
    if (sourceNode.type === 'customer' && targetNode.type === 'order') validTargets.push('left-2');
    if (sourceNode.type === 'order' && (targetNode.type === 'project' || targetNode.type === 'invoice')) validTargets.push('left-2');
    if (sourceNode.type === 'project' && (targetNode.type === 'kanban' || targetNode.type === 'checklist')) validTargets.push('left-2');
    if (sourceNode.type === 'kanban' && targetNode.type === 'indicator') validTargets.push('left-2');
    if (sourceNode.type === 'checklist' && targetNode.type === 'progress') validTargets.push('left-2');
    if (sourceNode.type === 'invoice' && targetNode.type === 'financial_module') validTargets.push('left-2');
    
    // Default if no specific rule but nature matches
    if (validTargets.length === 0) {
      validTargets.push('left-2', 'top-2');
    }
  } else {
    // Source is input, target must be output
    if (sourceNode.type === 'order' && targetNode.type === 'customer') validTargets.push('right-2');
    if (sourceNode.type === 'project' && targetNode.type === 'order') validTargets.push('right-2');
    
    if (validTargets.length === 0) {
      validTargets.push('right-2', 'bottom-2');
    }
  }

  return validTargets;
}

export const NODE_DESCRIPTIONS: Record<NodeType, string> = {
  customer: 'Representa um cliente, armazenando contatos, histórico e status comercial.',
  budget: 'Proposta comercial, cotação de valores, validade e itens orçados.',
  order: 'Registro de vendas, itens do pedido e valores fechados com o cliente.',
  invoice: 'Controle de faturamento, anexos de notas e impostos de saída.',
  project: 'Central de projetos, plantas, responsáveis técnicos e aprovações.',
  production_order: 'Ordem de Produção (PCP), número de OP, lote, prazo e roteiro de fabricação.',
  production_route: 'Roteiro de Produção com sequenciamento de etapas operacionais, postos de trabalho, datas e prazos.',
  product: 'Catálogo de produto industrial, preço unitário, SKU e controle de estoque.',
  part: 'Peças de reposição, materiais mecânicos, dimensões e fornecedor.',
  service: 'Serviços de usinagem, calibração, taxa horária e custo estimado.',
  employee: 'Ficha de funcionário, registro (RE), cargo, turno e status de serviço.',
  supervisor: 'Liderança de turno, supervisão de equipe e gestão operacional.',
  sector: 'Setor de fábrica, capacidade produtiva, máquinas e operadores.',
  kanban: 'Gerenciador de tarefas em colunas (A Fazer, Em Andamento, Concluído).',
  checklist: 'Lista de verificação interativa com caixas de seleção.',
  attachment: 'Central de armazenamento de URLs, arquivos e links organizados em lista com progresso e datas.',
  indicator: 'Painel visual de métricas (KPIs), valores, metas e gráficos de progresso.',
  progress: 'Quadro minimalista com barra de progresso personalizável e cores customizadas, compatível com todos os módulos.',
  deadline: 'Controle de datas, atrasos e contagem regressiva para entregas.',
  calendar: 'Calendário executivo com gestão de prazos e agenda imersiva de compromissos.',
  note: 'Post-it simples para observações, alertas e recados rápidos no painel.',
  text: 'Área transparente de texto livre para títulos e documentação descritiva.',
  document: 'Anexos, PDFs, planilhas e referências de arquivos externos.',
  group: 'Setor',
  custom: 'Quadro genérico configurável com atributos e propriedades livres.',
  finalized_order: 'Marcação de pedido concluído, consolidando valores e encerramento.',
  financial_module: 'Controle de custos, DRE, receitas brutas e consolidação financeira.'
};

export interface FeedPhraseInfo {
  actionPhrase: string;
  shortPhrase: string;
  directionText: string;
}

export function getFeedPhrase(
  fromNode: CanvasNode,
  toNode: CanvasNode,
  customLabel?: string
): FeedPhraseInfo {
  const fromName = fromNode.name || 'Quadro Origem';
  const toName = toNode.name || 'Quadro Destino';

  if (fromNode.type === 'customer' && toNode.type === 'order') {
    return {
      actionPhrase: `Alimentando '${toName}' com dados do Cliente '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Cliente) ➔ '${toName}' (Pedido)`,
    };
  }
  if (fromNode.type === 'order' && toNode.type === 'project') {
    return {
      actionPhrase: `Alimentando 'Projeto' com orçamento e escopo de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Pedido) ➔ '${toName}' (Projeto)`,
    };
  }
  if (fromNode.type === 'order' && toNode.type === 'invoice') {
    return {
      actionPhrase: `Alimentando 'Nota Fiscal' com faturamento de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Pedido) ➔ '${toName}' (NF-e)`,
    };
  }
  if (fromNode.type === 'customer' && toNode.type === 'invoice') {
    return {
      actionPhrase: `Alimentando 'Nota Fiscal' com dados fiscais de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Cliente) ➔ '${toName}' (NF-e)`,
    };
  }
  if (fromNode.type === 'project' && toNode.type === 'checklist') {
    return {
      actionPhrase: `Alimentando 'Checklist' com tarefas de fabricação de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Projeto) ➔ '${toName}' (Checklist)`,
    };
  }
  if (fromNode.type === 'deadline' && toNode.type === 'indicator') {
    return {
      actionPhrase: `Alimentando 'Indicador (KPI)' com monitoramento de prazo de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Prazo) ➔ '${toName}' (Indicador)`,
    };
  }
  if (fromNode.type === 'progress' && toNode.type === 'indicator') {
    return {
      actionPhrase: `Alimentando 'Indicador' com % de conclusão de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Progresso) ➔ '${toName}' (Indicador)`,
    };
  }
  if (fromNode.type === 'indicator' && toNode.type === 'progress') {
    return {
      actionPhrase: `Alimentando 'Barra de Progresso' com metas de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Indicador) ➔ '${toName}' (Progresso)`,
    };
  }
  if (fromNode.type === 'invoice' && toNode.type === 'financial_module') {
    return {
      actionPhrase: `Alimentando 'Módulo Financeiro' com receita tributada da '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (NF-e) ➔ '${toName}' (Financeiro)`,
    };
  }
  if (fromNode.type === 'order' && toNode.type === 'financial_module') {
    return {
      actionPhrase: `Alimentando 'Financeiro' com receita bruta de '${fromName}'`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' (Pedido) ➔ '${toName}' (Financeiro)`,
    };
  }

  if (customLabel && customLabel !== 'conecta com') {
    return {
      actionPhrase: `'${fromName}' alimentando '${toName}' (${customLabel})`,
      shortPhrase: `Alimentando '${toName}'`,
      directionText: `'${fromName}' ➔ '${toName}'`,
    };
  }

  return {
    actionPhrase: `Alimentando '${toName}' com informações de '${fromName}'`,
    shortPhrase: `Alimentando '${toName}'`,
    directionText: `'${fromName}' ➔ '${toName}'`,
  };
}
