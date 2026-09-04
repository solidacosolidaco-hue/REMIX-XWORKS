import { CanvasNode } from '../types/canvas';
import { isNodeInsideGroup } from './geometry';

/**
 * Encontra todos os módulos e quadros superiores (acima no canvas ou conectados via conexões)
 * dos quais o nó indicador deve ler dados.
 */
export function getUpstreamNodesForIndicator(
  indicatorNode: CanvasNode,
  allNodes?: CanvasNode[],
  connections?: Array<{ fromId: string; toId: string }>
): CanvasNode[] {
  if (!allNodes || allNodes.length === 0) return [];

  const upstreamIds = new Set<string>();

  // 1. Conexões diretas e indiretas de/para o nó indicador
  if (connections && connections.length > 0) {
    connections.forEach((c) => {
      if (c.toId === indicatorNode.id && c.fromId !== indicatorNode.id) upstreamIds.add(c.fromId);
      if (c.fromId === indicatorNode.id && c.toId !== indicatorNode.id) upstreamIds.add(c.toId);
    });

    const queue = Array.from(upstreamIds);
    while (queue.length > 0) {
      const curId = queue.shift()!;
      connections.forEach((c) => {
        if (c.toId === curId && !upstreamIds.has(c.fromId) && c.fromId !== indicatorNode.id) {
          upstreamIds.add(c.fromId);
          queue.push(c.fromId);
        }
      });
    }
  }

  const connectedNodes = allNodes.filter(
    (n) =>
      upstreamIds.has(n.id) &&
      n.id !== indicatorNode.id &&
      n.type !== 'text' &&
      n.type !== 'note' &&
      n.type !== 'group' &&
      n.type !== 'sector'
  );

  // 2. Módulos posicionados ESPACIALMENTE ACIMA do indicador no canvas
  const indY = indicatorNode.y;
  const indX = indicatorNode.x;
  const indW = indicatorNode.width || 250;

  const nodesAbove = allNodes.filter((n) => {
    if (
      n.id === indicatorNode.id ||
      n.type === 'text' ||
      n.type === 'note' ||
      n.type === 'group' ||
      n.type === 'sector' ||
      n.type === 'indicator'
    ) {
      return false;
    }
    if (upstreamIds.has(n.id)) return false; // Já incluído nas conexões

    // Condição 1: Posicionado acima ou alinhado acima na vertical
    const isAbove = n.y + (n.height || 150) / 2 < indY + 120;
    if (!isAbove) return false;

    // Condição 2: Mesmo grupo ou proximidade horizontal
    const sameGroup =
      (n.groupId && n.groupId === indicatorNode.groupId);

    const nX = n.x;
    const nW = n.width || 200;
    const xOverlap = Math.max(0, Math.min(indX + indW, nX + nW) - Math.max(indX, nX)) > 0;
    const xDistance = Math.abs(nX + nW / 2 - (indX + indW / 2));

    return sameGroup || xOverlap || xDistance < 450;
  });

  return [...connectedNodes, ...nodesAbove];
}

/**
 * Calcula o percentual de progresso base de um nó (sem aplicar restrições de dependências).
 */
function getBaseNodeProgress(
  node: CanvasNode,
  allNodes?: CanvasNode[],
  connections?: Array<{ fromId: string; toId: string }>,
  visited: Set<string> = new Set<string>()
): number {
  if (visited.has(node.id)) {
    return 0;
  }
  visited.add(node.id);

  const d = node.data || {};

  // Para setores e grupos, calcular dinamicamente com base nos blocos internos
  if (node.type === 'sector' || node.type === 'group') {
    if (allNodes && allNodes.length > 0) {
      const contained = allNodes.filter(
        (n) =>
          n.id !== node.id &&
          n.type !== 'group' &&
          n.type !== 'sector' &&
          n.type !== 'customer' &&
          n.type !== 'note' &&
          n.type !== 'text' &&
          (isNodeInsideGroup(n, node) || n.groupId === node.id)
      );
      if (contained.length > 0) {
        const sum = contained.reduce(
          (acc, curr) => acc + calculateNodeProgress(curr, allNodes, connections, visited),
          0
        );
        return Math.round(sum / contained.length);
      }
    }
    const statusMap: Record<string, number> = {
      'Operacional': 100,
      'Concluído': 100,
      'Em Manutenção': 45,
      'Parcial': 65,
    };
    return statusMap[node.status] ?? d.progressPercent ?? d.currentValue ?? 90;
  }

  switch (node.type) {
    case 'checklist': {
      const items = d.items || [];
      if (items.length > 0) {
        const done = items.filter((i: any) => i.checked).length;
        return Math.round((done / items.length) * 100);
      }
      if (typeof d.progressPercent === 'number') {
        return Math.min(100, Math.max(0, d.progressPercent));
      }
      return d.currentValue ?? 0;
    }

    case 'attachment':
    case 'document': {
      return 0;
    }

    case 'kanban': {
      const cards = d.cards || [];
      if (cards.length > 0) {
        let totalScore = 0;
        cards.forEach((c: any) => {
          const colId = String(c.columnId || '');
          const status = String(c.status || '');
          if (
            colId === 'col-done' ||
            colId === 'done' ||
            status === 'Concluído' ||
            c.checked === true
          ) {
            totalScore += 1.0;
          } else if (
            colId === 'col-in-progress' ||
            colId === 'col-progress' ||
            colId === 'in-progress' ||
            colId === 'doing' ||
            colId === 'dev' ||
            status === 'Em Andamento'
          ) {
            totalScore += 0.5;
          }
        });
        return Math.round((totalScore / cards.length) * 100);
      }
      if (typeof d.progressPercent === 'number') {
        return Math.min(100, Math.max(0, d.progressPercent));
      }
      if (node.status === 'Concluído') return 100;
      if (node.status === 'Em Andamento') return 50;
      return d.currentValue ?? 0;
    }

    case 'indicator': {
      if (allNodes && allNodes.length > 0) {
        const upstream = getUpstreamNodesForIndicator(node, allNodes, connections);
        if (upstream.length > 0) {
          const sum = upstream.reduce(
            (acc, src) => acc + calculateNodeProgress(src, allNodes, connections, visited),
            0
          );
          return Math.min(100, Math.max(0, Math.round(sum / upstream.length)));
        }
      }

      const kpiStr = String(d.kpiValue || '');
      // Extrair percentual da string kpiValue (ex: "85%", "91.4%", "91,4%")
      if (kpiStr.includes('%')) {
        const normalized = kpiStr.replace(',', '.').replace('%', '').trim();
        const pct = parseFloat(normalized);
        if (!isNaN(pct)) return Math.min(100, Math.max(0, Math.round(pct)));
      }

      // Prioridade 2: Valor numérico direto vs meta
      if (typeof d.currentValue === 'number' && typeof d.targetValue === 'number' && d.targetValue > 0) {
        return Math.min(100, Math.round((d.currentValue / d.targetValue) * 100));
      }

      if (typeof d.progressPercent === 'number') {
        return Math.min(100, Math.max(0, d.progressPercent));
      }

      // Prioridade 3: Proporção de valores monetários ou numéricos em string
      const valStr = kpiStr.replace(',', '.').replace(/[^0-9.]/g, '');
      const targetStr = String(d.kpiTarget || '100').replace(',', '.').replace(/[^0-9.]/g, '');
      const val = parseFloat(valStr);
      const target = parseFloat(targetStr);
      if (!isNaN(val) && !isNaN(target) && target > 0) {
        return Math.min(100, Math.round((val / target) * 100));
      }
      return d.currentValue ?? 80;
    }

    case 'project': {
      if (typeof d.projectProgress === 'number') return d.projectProgress;
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const milestones = d.milestones || [];
      if (milestones.length > 0) {
        const done = milestones.filter((m: any) => m.achieved || m.completed).length;
        return Math.round((done / milestones.length) * 100);
      }
      const statusMap: Record<string, number> = {
        'Concluído': 100,
        'Em Homologação': 85,
        'Em Execução': 65,
        'Em Andamento': 50,
        'Planejamento': 25,
        'A Fazer': 0,
      };
      return statusMap[node.status] ?? d.currentValue ?? 65;
    }

    case 'order': {
      if (typeof d.orderProgress === 'number') return d.orderProgress;
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const itemsList = d.itemsList || [];
      if (itemsList.length > 0 && typeof d.itemsDelivered === 'number') {
        return Math.round((d.itemsDelivered / itemsList.length) * 100);
      }
      const statusMap: Record<string, number> = {
        'Finalizado': 100,
        'Entregue': 100,
        'Concluído': 100,
        'Faturado': 90,
        'Em Produção': 75,
        'Aprovado': 40,
        'Orçamento': 20,
        'Em Andamento': 50,
        'A Fazer': 0,
      };
      return statusMap[node.status] ?? d.currentValue ?? 75;
    }

    case 'customer': {
      // Quadro base cadastral - não possui progresso operacional nem temporal
      return 0;
    }

    case 'invoice': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'Paga': 100,
        'Liquidada': 100,
        'Emitida': 75,
        'Gerada': 50,
        'Rascunho': 25,
        'Em Andamento': 50,
        'Concluído': 100,
      };
      return statusMap[node.status] ?? d.currentValue ?? 70;
    }

    case 'deadline': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'No Prazo': 80,
        'Entregue': 100,
        'Concluído': 100,
        'Atenção': 40,
        'Atrasado': 15,
      };
      return statusMap[node.status] ?? d.currentValue ?? 65;
    }

    case 'financial_module': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      if (node.status === 'Concluído') return 100;
      return d.currentValue ?? 85;
    }

    case 'product': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const stock = d.stockQty ?? 45;
      const min = d.minStockQty ?? 10;
      if (stock <= 0) return 0;
      if (stock <= min) return 30;
      const statusMap: Record<string, number> = {
        'Concluído': 100,
        'Em Estoque': 100,
        'Pronto': 100,
        'Em Produção': 60,
        'Orçamento': 25,
      };
      return statusMap[node.status] ?? d.currentValue ?? 85;
    }

    case 'part': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'Concluído': 100,
        'Aprovado': 100,
        'Em Estoque': 100,
        'Em Usinagem': 60,
        'A Fazer': 15,
      };
      return statusMap[node.status] ?? d.currentValue ?? 80;
    }

    case 'service': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'Concluído': 100,
        'Finalizado': 100,
        'Em Execução': 70,
        'Em Andamento': 50,
        'Agendado': 25,
        'A Fazer': 0,
      };
      return statusMap[node.status] ?? d.currentValue ?? 75;
    }

    case 'employee': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'Em Serviço': 100,
        'Disponível': 100,
        'Concluído': 100,
        'Em Treinamento': 50,
        'Ausente': 0,
      };
      return statusMap[node.status] ?? d.currentValue ?? 90;
    }

    case 'supervisor': {
      if (typeof d.progressPercent === 'number') return d.progressPercent;
      const statusMap: Record<string, number> = {
        'Ativo': 100,
        'Concluído': 100,
        'Em Turno': 90,
      };
      return statusMap[node.status] ?? d.currentValue ?? 95;
    }

    case 'finalized_order': {
      return 100;
    }

    case 'progress': {
      return Math.min(100, Math.max(0, d.progressPercent ?? d.currentValue ?? 65));
    }

    default: {
      if (typeof d.progressPercent === 'number') {
        return Math.min(100, Math.max(0, d.progressPercent));
      }
      if (typeof d.currentValue === 'number') return d.currentValue;
      if (node.status === 'Concluído') return 100;
      if (node.status === 'Em Andamento') return 50;
      return d.currentValue ?? 50;
    }
  }
}

/**
 * Calcula o percentual de progresso (0 a 100%) de qualquer quadro com base no seu conteúdo atual.
 * Se o usuário tiver ajustado manualmente 'progressPercent' ou 'currentValue', o valor manual tem precedência,
 * PORÉM se houver dependências de conexões (rede neural) que não estejam 100% completas, o progresso
 * final deste nó será limitado a no máximo 99%.
 */
export function calculateNodeProgress(
  node: CanvasNode,
  allNodes?: CanvasNode[],
  connections?: Array<{ fromId: string; toId: string }>,
  visited: Set<string> = new Set<string>()
): number {
  if (visited.has(node.id)) {
    return 0;
  }

  // Obter o progresso base determinado pelo conteúdo do próprio nó
  let progress = getBaseNodeProgress(node, allNodes, connections, new Set(visited));

  return progress;
}

/**
 * Verifica se o nó é um "gargalo" (bottleneck) no fluxo.
 * Um gargalo é um nó não concluído que está entre dois nós concluídos (pulsantes verde).
 */
export function isNodeBottleneck(
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Array<{ fromId: string; toId: string; animated?: boolean }>
): boolean {
  if (['text', 'note', 'group', 'sector', 'document', 'attachment', 'customer'].includes(node.type)) return false;

  // 1. O nó atual não deve estar concluído
  const progress = calculateNodeProgress(node, allNodes, connections);
  const isCompleted = progress === 100 || node.status === 'Concluído' || node.type === 'order';
  if (isCompleted) return false;

  // 2. Verificar se tem pelo menos um nó upstream (quem envia para ele) que está concluído (pulsando verde)
  const upstreamConnections = connections.filter(c => c.toId === node.id);
  const hasGreenUpstream = upstreamConnections.some(c => {
    const upstreamNode = allNodes.find(n => n.id === c.fromId);
    if (!upstreamNode || upstreamNode.id === node.id) return false;
    const upProgress = calculateNodeProgress(upstreamNode, allNodes, connections);
    return upProgress === 100 || upstreamNode.status === 'Concluído' || upstreamNode.type === 'order';
  });

  if (!hasGreenUpstream) return false;

  // 3. Verificar se tem pelo menos um nó downstream (quem recebe dele) que está concluído (pulsando verde)
  const downstreamConnections = connections.filter(c => c.fromId === node.id);
  const hasGreenDownstream = downstreamConnections.some(c => {
    const downstreamNode = allNodes.find(n => n.id === c.toId);
    if (!downstreamNode || downstreamNode.id === node.id) return false;
    const downProgress = calculateNodeProgress(downstreamNode, allNodes, connections);
    return downProgress === 100 || downstreamNode.status === 'Concluído' || downstreamNode.type === 'order';
  });

  return hasGreenDownstream;
}

export function getNodeProgressColor(percent: number): {
  barGradient: string;
  textColor: string;
  badgeBg: string;
} {
  if (percent >= 100) {
    return {
      barGradient: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    };
  }
  if (percent >= 70) {
    return {
      barGradient: 'from-blue-500 to-cyan-400',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    };
  }
  if (percent >= 40) {
    return {
      barGradient: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    };
  }
  return {
    barGradient: 'from-rose-500 to-pink-400',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  };
}
