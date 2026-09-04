import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  TrendingUp, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  ArrowRight,
  Users,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  ChevronDown,
  Factory,
  Building2,
  Table as TableIcon,
  LayoutGrid,
  ShieldAlert,
  Flame,
  Tag,
  RefreshCw,
  FileType,
  Eye,
  SlidersHorizontal,
  DollarSign,
  Boxes,
  Briefcase,
  ChevronUp,
  ChevronRight,
  Workflow,
  User,
} from 'lucide-react';
import { CanvasNode, Connection, CanvasBoard } from '../../types/canvas';
import { calculateNodeProgress, isNodeBottleneck } from '../../utils/nodeProgress';
import { getNodeDeadlineInfo, parseDateString, NodeDeadlineInfo } from '../../utils/nodeDeadline';
import { isNodeInsideGroup, getInterruptedConnectionIds } from '../../utils/geometry';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface SectorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorId: string | null;
  nodes: CanvasNode[];
  connections: Connection[];
  boards?: CanvasBoard[];
  activeBoardId?: string;
  onSelectBoard?: (boardId: string) => void;
}

type StatusFilterType = 'all' | 'delayed' | 'warning' | 'in_progress' | 'pending' | 'completed' | 'bottleneck';
type SortOptionType = 'priority_deadline' | 'deadline_asc' | 'deadline_desc' | 'status_urgency' | 'flow_asc' | 'progress_desc' | 'progress_asc' | 'name_asc';
type ViewModeType = 'sectors' | 'table' | 'cards';
type DetailLevelType = 'simplified' | 'detailed';

function getNodeDisplayName(node: CanvasNode): string {
  if (node.type === 'interrupted_flow') {
    return node.data?.incidentTitle || node.data?.title || node.name || 'Interrupção de Fluxo';
  }
  if (node.type === 'order') {
    return node.data?.orderNumber
      ? `Pedido #${node.data.orderNumber} - ${node.data?.clientName || node.name}`
      : node.name;
  }
  return node.name || 'Quadro Sem Nome';
}

function getResponsibleForNode(
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Connection[],
  availableSectors: CanvasNode[]
): string {
  // 1. Check direct connection to a supervisor
  for (const c of connections) {
    if (c.fromId === node.id || c.toId === node.id) {
      const otherId = c.fromId === node.id ? c.toId : c.fromId;
      const otherNode = allNodes.find(n => n.id === otherId);
      if (otherNode && otherNode.type === 'supervisor') {
        return otherNode.name || 'Líder';
      }
    }
  }

  // 2. Check sector's supervisor
  const sectorNode = availableSectors.find(s => {
    if (node.groupId === s.id) return true;
    if (s.name && (node.data?.sector === s.name || node.data?.setor === s.name)) return true;
    if (node.x !== undefined && node.y !== undefined && s.x !== undefined && s.y !== undefined && s.width && s.height) {
      const cx = node.x + (node.width || 200) / 2;
      const cy = node.y + (node.height || 100) / 2;
      if (cx >= s.x && cx <= s.x + s.width && cy >= s.y && cy <= s.y + s.height) {
        return true;
      }
    }
    return false;
  });

  if (sectorNode) {
    for (const c of connections) {
      if (c.fromId === sectorNode.id || c.toId === sectorNode.id) {
        const otherId = c.fromId === sectorNode.id ? c.toId : c.fromId;
        const otherNode = allNodes.find(n => n.id === otherId);
        if (otherNode && otherNode.type === 'supervisor') {
          return otherNode.name || 'Líder';
        }
      }
    }
  }

  // 3. Fallback to node data
  if (node.data?.responsible) return String(node.data.responsible);
  if (node.data?.supervisorName) return String(node.data.supervisorName);
  if (node.data?.assignee) return String(node.data.assignee);
  
  return 'Equipe';
}

function getAssignedEmployeesForNode(
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Connection[],
  availableSectors: CanvasNode[]
): CanvasNode[] {
  const assigned = new Map<string, CanvasNode>();

  // If the node itself is an employee, maybe we just return it
  if (node.type === 'employee') {
    return [node];
  }

  // 1. Direct connections (both directions)
  connections.forEach(c => {
    if (c.fromId === node.id || c.toId === node.id) {
      const otherId = c.fromId === node.id ? c.toId : c.fromId;
      const otherNode = allNodes.find(n => n.id === otherId);
      if (otherNode && otherNode.type === 'employee') {
        assigned.set(otherNode.id, otherNode);
      }
    }
  });

  // 2. If no direct employees, check if there are employees inside the node's sector
  if (assigned.size === 0) {
    const sectorNode = availableSectors.find(s => {
      if (node.groupId === s.id) return true;
      if (s.name && (node.data?.sector === s.name || node.data?.setor === s.name)) return true;
      if (node.x !== undefined && node.y !== undefined && s.x !== undefined && s.y !== undefined && s.width && s.height) {
        const cx = node.x + (node.width || 200) / 2;
        const cy = node.y + (node.height || 100) / 2;
        if (cx >= s.x && cx <= s.x + s.width && cy >= s.y && cy <= s.y + s.height) {
          return true;
        }
      }
      return false;
    });

    if (sectorNode) {
      // Find employees spatially inside the sector or connected to it
      allNodes.forEach(n => {
        if (n.type === 'employee') {
          let isInside = false;
          if (n.groupId === sectorNode.id) isInside = true;
          else if (n.x !== undefined && n.y !== undefined && sectorNode.x !== undefined && sectorNode.y !== undefined && sectorNode.width && sectorNode.height) {
            const cx = n.x + (n.width || 200) / 2;
            const cy = n.y + (n.height || 100) / 2;
            if (cx >= sectorNode.x && cx <= sectorNode.x + sectorNode.width && cy >= sectorNode.y && cy <= sectorNode.y + sectorNode.height) {
              isInside = true;
            }
          }

          if (!isInside) {
            // check connections to sector
             connections.forEach(c => {
              if ((c.fromId === sectorNode.id && c.toId === n.id) || (c.toId === sectorNode.id && c.fromId === n.id)) {
                isInside = true;
              }
            });
          }

          if (isInside) {
             assigned.set(n.id, n);
          }
        }
      });
    }
  }

  return Array.from(assigned.values());
}

function getSalesOrderForNode(
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Connection[]
): string {
  if (node.type === 'order') {
    return node.data?.orderNumber ? `PED-${node.data.orderNumber}` : node.data?.clientName || node.name;
  }
  if (node.data?.salesOrder) return String(node.data.salesOrder);
  if (node.data?.pedidoVenda) return String(node.data.pedidoVenda);
  if (node.data?.orderNumber) return `PED-${node.data.orderNumber}`;

  // Check upstream connections to find associated sales order
  const visited = new Set<string>();
  const queue = [node.id];
  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const upstreamConns = connections.filter(c => c.toId === currId);
    for (const c of upstreamConns) {
      const parent = allNodes.find(n => n.id === c.fromId);
      if (parent) {
        if (parent.type === 'order') {
          return parent.data?.orderNumber ? `PED-${parent.data.orderNumber}` : parent.data?.clientName || parent.name;
        }
        if (parent.data?.salesOrder) return String(parent.data.salesOrder);
        if (parent.data?.pedidoVenda) return String(parent.data.pedidoVenda);
        if (parent.data?.orderNumber) return `PED-${parent.data.orderNumber}`;
        queue.push(parent.id);
      }
    }
  }

  return '---';
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '---';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '---';
  const d = parseDateString(trimmed);
  if (!d) return trimmed;
  
  if (trimmed.includes(':') || trimmed.includes('T')) {
    const timeParts = trimmed.split(/[\sT]+/)[1];
    if (timeParts) {
      const hhmm = timeParts.slice(0, 5);
      return `${d.toLocaleDateString('pt-BR')} ${hhmm}`;
    }
  }
  return d.toLocaleDateString('pt-BR');
}

function getNodeSectorName(
  node: CanvasNode, 
  sectorNodes: CanvasNode[], 
  allNodes?: CanvasNode[], 
  connections?: Connection[]
): string {
  // If incidentSector is explicitly recorded on interrupted node
  if (node.data?.incidentSector && String(node.data.incidentSector).trim()) {
    return String(node.data.incidentSector).trim();
  }

  if (node.groupId) {
    const s = sectorNodes.find(sn => sn.id === node.groupId);
    if (s) return s.name;
  }
  if (node.data?.sectorId) {
    const s = sectorNodes.find(sn => sn.id === node.data.sectorId);
    if (s) return s.name;
  }
  if (node.data?.sector) return node.data.sector;
  if (node.data?.setor) return node.data.setor;
  
  // Geometric containment
  const enclosing = sectorNodes.find(sn => isNodeInsideGroup(node, sn));
  if (enclosing) return enclosing.name;

  // If this is an interrupted_flow node linked to another node, inherit the linked node's sector
  if (node.type === 'interrupted_flow' && allNodes && connections) {
    for (const c of connections) {
      if (c.fromId === node.id || c.toId === node.id) {
        const otherId = c.fromId === node.id ? c.toId : c.fromId;
        const otherNode = allNodes.find(n => n.id === otherId);
        if (otherNode && otherNode.id !== node.id && otherNode.type !== 'interrupted_flow') {
          const inherited = getNodeSectorName(otherNode, sectorNodes);
          if (inherited && inherited !== 'Geral') return inherited;
        }
      }
      if (c.toConnectionId && c.fromId === node.id) {
        const targetConn = connections.find(tc => tc.id === c.toConnectionId);
        if (targetConn) {
          const fromN = allNodes.find(n => n.id === targetConn.fromId);
          const toN = allNodes.find(n => n.id === targetConn.toId);
          const s1 = fromN ? getNodeSectorName(fromN, sectorNodes) : '';
          const s2 = toN ? getNodeSectorName(toN, sectorNodes) : '';
          if (s1 && s1 !== 'Geral') return s1;
          if (s2 && s2 !== 'Geral') return s2;
        }
      }
    }
  }

  return 'Geral';
}

export interface NodeInterruptionDetail {
  isInterrupted: boolean;
  isResolved: boolean;
  isBottleneck: boolean;
  type: 'interrupted_flow_node' | 'linked_to_interrupted' | 'bottleneck' | 'explicit_blocked' | 'normal';
  badgeTitle: string;
  incidentDescription: string;
  incidentResponsible?: string;
  incidentDate?: string;
  incidentResolutionDate?: string;
  incidentSector?: string;
  sourceNodeName?: string;
  connectedNodeNames: string[];
  connectionSummary: string;
  text: string;
  details: string;
  fullText: string;
  pdfFormattedText: string;
}

function getNodeInterruptionInfo(
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Connection[],
  isBottleneck: boolean,
  sectorNodes: CanvasNode[] = [],
  interrupterMap: Map<string, string[]> = new Map()
): NodeInterruptionDetail {
  // 1. Direct interrupted_flow node
  if (node.type === 'interrupted_flow') {
    const isResolved = Boolean(node.data?.isResolved);
    const incidentDescription =
      node.data?.incidentDescription ||
      node.data?.motivo ||
      node.data?.reason ||
      'Parada não planejada do processo por falha operacional';
    const incidentResponsible = node.data?.incidentResponsible || node.data?.responsible || '';
    const incidentDate = formatDisplayDate(node.data?.incidentDate || node.createdAt);
    const incidentResolutionDate = formatDisplayDate(node.data?.incidentResolutionDate);
    const incidentSector = node.data?.incidentSector || getNodeSectorName(node, sectorNodes, allNodes, connections);

    // Find all nodes linked through connections or wires
    const connectedNodeMap = new Map<string, string>();
    for (const c of connections) {
      if (c.fromId === node.id || c.toId === node.id) {
        const otherId = c.fromId === node.id ? c.toId : c.fromId;
        const otherNode = allNodes.find(n => n.id === otherId);
        if (otherNode && otherNode.id !== node.id && otherNode.type !== 'interrupted_flow') {
          const sName = getNodeSectorName(otherNode, sectorNodes);
          const dName = getNodeDisplayName(otherNode);
          connectedNodeMap.set(otherNode.id, `${dName} (${sName})`);
        }
      }
      if (c.toConnectionId && c.fromId === node.id) {
        const targetConn = connections.find(tc => tc.id === c.toConnectionId);
        if (targetConn) {
          const fromN = allNodes.find(n => n.id === targetConn.fromId);
          const toN = allNodes.find(n => n.id === targetConn.toId);
          if (fromN && fromN.type !== 'interrupted_flow') {
            connectedNodeMap.set(fromN.id, `${getNodeDisplayName(fromN)} (${getNodeSectorName(fromN, sectorNodes)})`);
          }
          if (toN && toN.type !== 'interrupted_flow') {
            connectedNodeMap.set(toN.id, `${getNodeDisplayName(toN)} (${getNodeSectorName(toN, sectorNodes)})`);
          }
        }
      }
    }

    const connectedNodeNames = Array.from(connectedNodeMap.values());
    const connectionSummary = connectedNodeNames.length > 0
      ? `Ligação com: ${connectedNodeNames.join(' -> ')}`
      : 'Conexão de linha interrompida';

    if (isResolved) {
      const resDateClean = incidentResolutionDate ? incidentResolutionDate.replace(/^previs[aã]o:\s*/i, '').trim() : '';
      const resMeta = resDateClean && resDateClean !== '---' ? ` (${resDateClean})` : '';
      return {
        isInterrupted: false,
        isResolved: true,
        isBottleneck: false,
        type: 'interrupted_flow_node',
        badgeTitle: '🟢 FLUXO NORMALIZADO',
        incidentDescription,
        incidentResponsible,
        incidentDate,
        incidentResolutionDate,
        incidentSector,
        connectedNodeNames,
        connectionSummary,
        text: 'Normalizado',
        details: `${incidentDescription}${resMeta}`,
        fullText: `Normalizado: ${incidentDescription}${resMeta}`,
        pdfFormattedText: `[FLUXO NORMALIZADO]\n• Solução: ${incidentDescription}\n• Conexão Reestabelecida${resDateClean && resDateClean !== '---' ? ` | Resolvido em: ${resDateClean}` : ''}`,
      };
    }

    const cleanResDate = incidentResolutionDate ? incidentResolutionDate.replace(/^previs[aã]o:\s*/i, '').trim() : '';
    const metaParts = [
      incidentResponsible ? `Resp: ${incidentResponsible}` : '',
      incidentDate && incidentDate !== '---' ? `Ocorrido: ${incidentDate}` : '',
      cleanResDate && cleanResDate !== '---' ? `Previsão: ${cleanResDate}` : '',
    ].filter(Boolean);

    const pdfFormattedText = [
      `[LIGAÇÃO BLOQUEADA]`,
      connectedNodeNames.length > 0 ? `• Conexão: ${connectedNodeNames.join(' -> ')}` : `• Conexão: Linha de Fluxo Interrompida`,
      `• Motivo: ${incidentDescription}`,
      metaParts.length > 0 ? `• ${metaParts.join(' | ')}` : '',
    ].filter(Boolean).join('\n');

    return {
      isInterrupted: true,
      isResolved: false,
      isBottleneck: false,
      type: 'interrupted_flow_node',
      badgeTitle: '🔴 LIGAÇÃO BLOQUEADA',
      incidentDescription,
      incidentResponsible,
      incidentDate,
      incidentResolutionDate,
      incidentSector,
      connectedNodeNames,
      connectionSummary,
      text: 'Fluxo Interrompido',
      details: incidentDescription,
      fullText: `Interrompido: ${incidentDescription}`,
      pdfFormattedText,
    };
  }

  // 2. Direct blocked or interrupted status / flags
  const explicitReason =
    node.data?.blockReason ||
    node.data?.blockedReason ||
    node.data?.motivoBloqueio ||
    node.data?.incidentDescription ||
    node.data?.motivo ||
    node.data?.reason ||
    node.data?.impediment;

  // 3. Search for any unresolved interrupted_flow nodes impacting this node's line or connection
  const allInterruptedNodes = allNodes.filter((n) => n.type === 'interrupted_flow');
  for (const interNode of allInterruptedNodes) {
    const isInterResolved = Boolean(interNode.data?.isResolved);

    // Direct wire connection
    const isDirectlyConnected = connections.some(
      (c) =>
        (c.fromId === interNode.id && c.toId === node.id) ||
        (c.toId === interNode.id && c.fromId === node.id)
    );

    // Wire attached to connection of this node
    const isWiredToNodeConn = connections.some(
      (c) =>
        c.toConnectionId &&
        c.fromId === interNode.id &&
        connections.some(
          (tc) => tc.id === c.toConnectionId && (tc.fromId === node.id || tc.toId === node.id)
        )
    );

    // Spatial line intersection connection (using interrupterMap)
    const isSpatiallyConnected = connections.some(
      (c) => 
        (c.fromId === node.id || c.toId === node.id) &&
        interrupterMap.get(c.id)?.includes(interNode.id)
    );

    if (isDirectlyConnected || isWiredToNodeConn || isSpatiallyConnected) {
      const desc =
        interNode.data?.incidentDescription ||
        interNode.name ||
        'Parada não planejada do processo por falha operacional';
      const resp = interNode.data?.incidentResponsible || interNode.data?.responsible || '';
      const date = formatDisplayDate(interNode.data?.incidentDate || interNode.createdAt);
      const resDate = formatDisplayDate(interNode.data?.incidentResolutionDate);
      const interSector = interNode.data?.incidentSector || getNodeSectorName(interNode, sectorNodes, allNodes, connections);
      const sourceName = interNode.name || 'Fluxo Interrompido';

      if (isInterResolved) {
        return {
          isInterrupted: false,
          isResolved: true,
          isBottleneck: false,
          type: 'linked_to_interrupted',
          badgeTitle: '🟢 FLUXO NORMALIZADO',
          incidentDescription: desc,
          incidentResponsible: resp,
          incidentDate: date,
          incidentResolutionDate: resDate,
          incidentSector: interSector,
          sourceNodeName: sourceName,
          connectedNodeNames: [getNodeDisplayName(node)],
          connectionSummary: `Ligação com: ${sourceName} (${interSector})`,
          text: 'Normalizado',
          details: `Ocorrência resolvida (${desc})`,
          fullText: `Normalizado: Ocorrência resolvida em ${sourceName}`,
          pdfFormattedText: `[FLUXO NORMALIZADO]\n• Histórico: Ocorrência resolvida (${desc})\n• Conexão Operacional Ativa`,
        };
      }

      const cleanResDate = resDate ? resDate.replace(/^previs[aã]o:\s*/i, '').trim() : '';
      const metaParts = [
        resp ? `Resp: ${resp}` : '',
        date && date !== '---' ? `Ocorrido: ${date}` : '',
        cleanResDate && cleanResDate !== '---' ? `Previsão: ${cleanResDate}` : '',
      ].filter(Boolean);

      const pdfFormattedText = [
        `[FLUXO INTERROMPIDO] -> Trava de Linha por: ${sourceName} (${interSector})`,
        `• Motivo: ${desc}`,
        metaParts.length > 0 ? `• ${metaParts.join(' | ')}` : '',
      ].filter(Boolean).join('\n');

      return {
        isInterrupted: true,
        isResolved: false,
        isBottleneck: false,
        type: 'linked_to_interrupted',
        badgeTitle: '⚠️ FLUXO INTERROMPIDO',
        incidentDescription: desc,
        incidentResponsible: resp,
        incidentDate: date,
        incidentResolutionDate: resDate,
        incidentSector: interSector,
        sourceNodeName: sourceName,
        connectedNodeNames: [getNodeDisplayName(node)],
        connectionSummary: `Ligação bloqueada por: ${sourceName} (${interSector})`,
        text: 'Fluxo Interrompido',
        details: desc,
        fullText: `Interrompido: ${desc}`,
        pdfFormattedText,
      };
    }
  }

  // 4. Direct node status
  if (
    (node.status as string) === 'Interrompido' ||
    (node.status as string) === 'Bloqueado' ||
    node.data?.isInterrupted ||
    node.data?.isBlocked ||
    node.data?.blocked
  ) {
    const desc = explicitReason || 'Bloqueio operacional registrado no quadro';
    return {
      isInterrupted: true,
      isResolved: false,
      isBottleneck: false,
      type: 'explicit_blocked',
      badgeTitle: '⛔ BLOQUEIO OPERACIONAL',
      incidentDescription: desc,
      connectedNodeNames: [],
      connectionSummary: 'Bloqueio no próprio quadro',
      text: 'Fluxo Interrompido',
      details: desc,
      fullText: `Interrompido: ${desc}`,
      pdfFormattedText: `[BLOQUEIO OPERACIONAL]\n• Motivo: ${desc}\n• Aguardando liberação`,
    };
  }

  // 5. Bottleneck
  if (isBottleneck) {
    return {
      isInterrupted: true,
      isResolved: false,
      isBottleneck: true,
      type: 'bottleneck',
      badgeTitle: '🟣 GARGALO NO FLUXO',
      incidentDescription: 'Retenção operacional aguardando liberação do posto',
      connectedNodeNames: [],
      connectionSummary: 'Gargalo operacional de capacidade',
      text: 'Gargalo no Fluxo',
      details: 'Retenção operacional aguardando liberação do posto',
      fullText: 'Gargalo: Retenção operacional aguardando liberação',
      pdfFormattedText: `[GARGALO OPERACIONAL]\n• Retenção: Aguardando liberação do posto\n• Fluxo em espera`,
    };
  }

  // 6. Explicit reason
  if (explicitReason && String(explicitReason).trim()) {
    return {
      isInterrupted: true,
      isResolved: false,
      isBottleneck: false,
      type: 'explicit_blocked',
      badgeTitle: '⚠️ OCORRÊNCIA',
      incidentDescription: String(explicitReason).trim(),
      connectedNodeNames: [],
      connectionSummary: 'Ocorrência operacional',
      text: 'Ocorrência',
      details: String(explicitReason).trim(),
      fullText: `Motivo: ${String(explicitReason).trim()}`,
      pdfFormattedText: `[OCORRÊNCIA]\n• Motivo: ${String(explicitReason).trim()}`,
    };
  }

  // 7. Normal flow
  return {
    isInterrupted: false,
    isResolved: false,
    isBottleneck: false,
    type: 'normal',
    badgeTitle: 'Fluxo Normal',
    incidentDescription: '',
    connectedNodeNames: [],
    connectionSummary: 'Fluxo contínuo',
    text: 'Normal',
    details: '',
    fullText: 'Fluxo Normal',
    pdfFormattedText: 'Fluxo Normal (Conexão Operacional Ativa)',
  };
}

export const SectorReportModal: React.FC<SectorReportModalProps> = ({
  isOpen,
  onClose,
  sectorId,
  nodes,
  connections,
  boards,
  activeBoardId,
  onSelectBoard,
}) => {
  // Lousa selector state inside modal
  const [selectedBoardId, setSelectedBoardId] = useState<string>(activeBoardId || 'active');
  const [collapsedSectorIds, setCollapsedSectorIds] = useState<Set<string>>(new Set());

  // Sector switcher state inside modal
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(sectorId);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [sortBy, setSortBy] = useState<SortOptionType>('priority_deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewModeType>('sectors');
  const [detailLevel, setDetailLevel] = useState<DetailLevelType>('detailed');

  // Keep selected sector in sync when prop changes
  useEffect(() => {
    setSelectedSectorId(sectorId);
  }, [sectorId]);

  // Keep selected board in sync when activeBoardId changes
  useEffect(() => {
    if (activeBoardId) {
      setSelectedBoardId(activeBoardId);
    }
  }, [activeBoardId]);

  // Effective nodes and connections based on selected board
  const { effectiveNodes, effectiveConnections, effectiveBoardName } = useMemo(() => {
    if (selectedBoardId === 'all' && boards && boards.length > 0) {
      const allN: CanvasNode[] = [];
      const allC: Connection[] = [];
      boards.forEach((b) => {
        const bNodes = (b.id === activeBoardId ? nodes : b.nodes) || [];
        const bConns = (b.id === activeBoardId ? connections : b.connections) || [];
        bNodes.forEach((n) => {
          allN.push({
            ...n,
            data: {
              ...n.data,
              _boardId: b.id,
              _boardName: b.name,
            },
          });
        });
        allC.push(...bConns);
      });
      return {
        effectiveNodes: allN,
        effectiveConnections: allC,
        effectiveBoardName: 'Todas as Lousas (Consolidado)',
      };
    }

    if (boards && boards.length > 0) {
      const b = boards.find((bd) => bd.id === selectedBoardId);
      if (b) {
        const bNodes = b.id === activeBoardId ? nodes : b.nodes;
        const bConns = b.id === activeBoardId ? connections : b.connections;
        return {
          effectiveNodes: (bNodes || []).map((n) => ({
            ...n,
            data: {
              ...n.data,
              _boardId: b.id,
              _boardName: b.name,
            },
          })),
          effectiveConnections: bConns || [],
          effectiveBoardName: b.name,
        };
      }
    }

    return {
      effectiveNodes: nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          _boardId: activeBoardId || 'active',
          _boardName: 'Lousa Atual',
        },
      })),
      effectiveConnections: connections,
      effectiveBoardName: 'Lousa Atual',
    };
  }, [boards, selectedBoardId, activeBoardId, nodes, connections]);

  // List of all sector & group containers on effective canvas, ordered strictly by industrial flow (X coordinate from left to right)
  const availableSectors = useMemo(() => {
    return effectiveNodes
      .filter(n => n.type === 'sector' || n.type === 'group')
      .sort((a, b) => {
        const xa = a.x ?? 0;
        const xb = b.x ?? 0;
        if (Math.abs(xa - xb) > 40) {
          return xa - xb;
        }
        return (a.y ?? 0) - (b.y ?? 0);
      });
  }, [effectiveNodes]);

  const isGlobal = !selectedSectorId || selectedSectorId === 'all';
  const currentSectorNode = useMemo(() => {
    if (isGlobal) return null;
    return effectiveNodes.find(n => n.id === selectedSectorId) || null;
  }, [effectiveNodes, selectedSectorId, isGlobal]);

  // Compute spatial / logical interrupted flow connections once
  const { interruptedConns, interrupterMap } = useMemo(() => {
    return getInterruptedConnectionIds(effectiveNodes, effectiveConnections);
  }, [effectiveNodes, effectiveConnections]);

  // Find all nodes that logically and spatially belong to this sector
  const relatedNodes = useMemo(() => {
    const operationalNodes = effectiveNodes.filter(
      n => 
        n.type !== 'text' && 
        n.type !== 'note' && 
        n.type !== 'group' && 
        n.type !== 'sector' &&
        n.type !== 'employee' &&
        n.type !== 'supervisor' &&
        n.type !== 'customer' &&
        n.type !== 'interrupted_flow' &&
        n.type !== 'attachment' &&
        n.type !== 'document' &&
        n.type !== 'financial_module' &&
        n.type !== 'calendar' &&
        n.type !== 'indicator'
    );

    if (isGlobal) {
      return operationalNodes;
    }

    if (!selectedSectorId || !currentSectorNode) {
      return operationalNodes;
    }

    const matchedIds = new Set<string>();

    // 1. Direct group / parent assignment
    operationalNodes.forEach(n => {
      if (n.groupId === selectedSectorId) {
        matchedIds.add(n.id);
      }
    });

    // 2. Data property reference
    operationalNodes.forEach(n => {
      const d = n.data || {};
      if (
        d.sectorId === selectedSectorId ||
        (currentSectorNode.name && (d.sector === currentSectorNode.name || d.setor === currentSectorNode.name || d.incidentSector === currentSectorNode.name)) ||
        (currentSectorNode.data?.sectorCode && d.sectorCode === currentSectorNode.data.sectorCode)
      ) {
        matchedIds.add(n.id);
      }
    });

    // 3. Spatial bounding box containment / overlap
    const sX = currentSectorNode.x;
    const sY = currentSectorNode.y;
    const sW = currentSectorNode.width || 600;
    const sH = currentSectorNode.height || 400;

    operationalNodes.forEach(n => {
      const nW = n.width || 250;
      const nH = n.height || 160;
      const nCenterX = n.x + nW / 2;
      const nCenterY = n.y + nH / 2;

      // Center inside bounding box
      const centerInside = (
        nCenterX >= sX &&
        nCenterX <= sX + sW &&
        nCenterY >= sY &&
        nCenterY <= sY + sH
      );

      // Or significant area overlap
      const xOverlap = Math.max(0, Math.min(sX + sW, n.x + nW) - Math.max(sX, n.x));
      const yOverlap = Math.max(0, Math.min(sY + sH, n.y + nH) - Math.max(sY, n.y));
      const overlapArea = xOverlap * yOverlap;
      const nodeArea = nW * nH;
      const hasSpatialOverlap = centerInside || (nodeArea > 0 && overlapArea / nodeArea > 0.25) || isNodeInsideGroup(n, currentSectorNode);

      if (hasSpatialOverlap) {
        matchedIds.add(n.id);
      }
    });

    // 4. If this is an interrupted_flow node linked directly into this sector's nodes or lines
    operationalNodes.forEach(n => {
      if (n.type === 'interrupted_flow' && !matchedIds.has(n.id)) {
        if (n.data?.incidentSector === currentSectorNode.name) {
          matchedIds.add(n.id);
        } else {
          // Check if it interrupts any connection where the from or to node is in the sector
          let intersectsSectorConn = false;
          effectiveConnections.forEach(c => {
            if (matchedIds.has(c.fromId) || matchedIds.has(c.toId)) {
              if (interrupterMap.get(c.id)?.includes(n.id)) {
                intersectsSectorConn = true;
              }
            }
          });

          if (intersectsSectorConn) {
            matchedIds.add(n.id);
          } else {
            const isDirectlyConnected = effectiveConnections.some(c => 
              (c.fromId === n.id && matchedIds.has(c.toId)) || (c.toId === n.id && matchedIds.has(c.fromId))
            );
            const isConnectedToSectorWire = effectiveConnections.some(c => {
              if (c.fromId === n.id && c.toConnectionId) {
                const targetConn = effectiveConnections.find(tc => tc.id === c.toConnectionId);
                return targetConn && (matchedIds.has(targetConn.fromId) || matchedIds.has(targetConn.toId));
              }
              return false;
            });
            if (isDirectlyConnected || isConnectedToSectorWire) {
              matchedIds.add(n.id);
            }
          }
        }
      }
    });

    const filtered = operationalNodes.filter(n => matchedIds.has(n.id));

    // Fallback: If 0 boards are bound to this frame but workspace has nodes,
    // show operational nodes if there are no other sectors
    if (filtered.length === 0 && availableSectors.length <= 1) {
      return operationalNodes;
    }

    return filtered;
  }, [effectiveNodes, effectiveConnections, selectedSectorId, currentSectorNode, isGlobal, availableSectors, interrupterMap]);

  // Detailed records with deadlines and progress calculated
  const detailedNodes = useMemo(() => {
    return relatedNodes.map(node => {
      const progress = calculateNodeProgress(node, effectiveNodes, effectiveConnections);
      const deadlineInfo = getNodeDeadlineInfo(node);
      const isBottleneck = isNodeBottleneck(node, effectiveNodes, effectiveConnections);

      const rawStart =
        node.data?.startDate ||
        node.data?.prazoInicial ||
        node.data?.dataInicio ||
        node.data?.initialDate ||
        node.data?.incidentDate ||
        (node.type === 'order' ? node.data?.orderDate : undefined) ||
        (node.createdAt && node.createdAt.includes('-') ? node.createdAt.slice(0, 10) : undefined);

      const rawDeadline =
        node.data?.deliveryDeadline ||
        node.data?.dueDate ||
        node.data?.deadline ||
        node.data?.endDate ||
        node.data?.prazoFinal ||
        node.data?.deadlineDate ||
        node.data?.dataFinal ||
        node.data?.dataLimite ||
        node.data?.dataEntrega ||
        node.data?.prazo ||
        node.data?.incidentResolutionDate ||
        (node.type === 'deadline' ? (node.data as any).targetDate : undefined);

      const interruptionInfo = getNodeInterruptionInfo(node, effectiveNodes, effectiveConnections, isBottleneck, availableSectors, interrupterMap);

      const isCompleted =
        progress === 100 ||
        node.status === 'Concluído' ||
        (node.status as string) === 'Entregue' ||
        (node.data as any)?.status === 'Concluído' ||
        (node.data as any)?.status === 'Entregue' ||
        (node.type === 'interrupted_flow' && Boolean(node.data?.isResolved)) ||
        deadlineInfo.state === 'completed';

      const isDelayed =
        !isCompleted &&
        (deadlineInfo.state === 'delayed' ||
          node.status === 'Atrasado' ||
          (node.type === 'interrupted_flow' && !node.data?.isResolved) ||
          (interruptionInfo.isInterrupted && !interruptionInfo.isResolved));

      const isWarning =
        !isCompleted &&
        !isDelayed &&
        (deadlineInfo.state === 'warning' ||
          (deadlineInfo.daysRemaining !== null && deadlineInfo.daysRemaining >= 0 && deadlineInfo.daysRemaining <= 3));

      const isInProgress = !isCompleted && !isDelayed && (progress > 0 || node.status === 'Em Andamento');
      const isPending = !isCompleted && !isDelayed && !isWarning && !isInProgress;

      const sectorName = getNodeSectorName(node, availableSectors, effectiveNodes, effectiveConnections);
      const salesOrder = getSalesOrderForNode(node, effectiveNodes, effectiveConnections);
      const assignedEmployees = getAssignedEmployeesForNode(node, effectiveNodes, effectiveConnections, availableSectors);
      const responsible = getResponsibleForNode(node, effectiveNodes, effectiveConnections, availableSectors);
      const boardName = (node.data?._boardName as string) || effectiveBoardName;
      const quadroName = getNodeDisplayName(node);

      return {
        node,
        quadroName,
        progress,
        deadlineInfo,
        isBottleneck,
        interruptionInfo,
        isCompleted,
        isDelayed,
        isWarning,
        isInProgress,
        isPending,
        rawStart,
        rawDeadline,
        startFormatted: formatDisplayDate(rawStart),
        endFormatted: formatDisplayDate(rawDeadline),
        sectorName,
        salesOrder,
        assignedEmployees,
        responsible,
        boardName,
      };
    });
  }, [relatedNodes, effectiveNodes, effectiveConnections, availableSectors, effectiveBoardName]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = detailedNodes.length;
    const completed = detailedNodes.filter(d => d.isCompleted).length;
    const delayed = detailedNodes.filter(d => d.isDelayed).length;
    const warning = detailedNodes.filter(d => d.isWarning).length;
    const inProgress = detailedNodes.filter(d => d.isInProgress).length;
    const pending = detailedNodes.filter(d => d.isPending).length;
    const bottlenecks = detailedNodes.filter(d => d.isBottleneck).length;
    const onTrack = detailedNodes.filter(d => !d.isCompleted && !d.isDelayed && !d.isWarning && d.deadlineInfo.daysRemaining !== null && d.deadlineInfo.daysRemaining > 3).length;
    const withoutDeadline = detailedNodes.filter(d => !d.isCompleted && d.deadlineInfo.state === 'none').length;

    const totalProgress = detailedNodes.reduce((acc, curr) => acc + curr.progress, 0);
    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

    let totalQuantity = 0;
    let totalAmount = 0;
    const materialSummary: Record<string, number> = {};

    detailedNodes.forEach(({ node }) => {
      if (node.data?.quantity) totalQuantity += Number(node.data.quantity);
      if (node.data?.totalOrderValue) totalAmount += Number(node.data.totalOrderValue);
      else if (node.data?.amount) totalAmount += Number(node.data.amount);
      if (node.data?.material) {
        materialSummary[node.data.material] = (materialSummary[node.data.material] || 0) + 1;
      }
    });

    // Timeline analysis
    const startDates = detailedNodes
      .map(d => parseDateString(d.rawStart))
      .filter((d): d is Date => d !== null);

    const endDates = detailedNodes
      .map(d => parseDateString(d.rawDeadline))
      .filter((d): d is Date => d !== null);

    const earliestStart = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : null;
    const latestEnd = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : null;

    // Resource calculations
    const activeWorkers = isGlobal 
      ? effectiveNodes.filter(n => n.type === 'employee').length 
      : (Number(currentSectorNode?.data?.activeWorkers) || relatedNodes.filter(n => n.type === 'employee').length || 0);

    const activeMachines = isGlobal
      ? nodes.filter(n => n.type === 'part' || n.type === 'sector').length
      : (Number(currentSectorNode?.data?.activeMachineCount) || relatedNodes.filter(n => n.type === 'part' || n.type === 'service').length || 0);

    const capacityDisplay = isGlobal 
      ? 'Visão Global' 
      : (currentSectorNode?.data?.sectorCapacity ? `${currentSectorNode.data.sectorCapacity}` : '85%');

    const statusDistribution = [
      { name: 'Concluído', value: completed, color: '#10b981' },
      { name: 'Em Andamento', value: inProgress, color: '#3b82f6' },
      { name: 'Em Alerta', value: warning, color: '#f59e0b' },
      { name: 'Atrasado', value: delayed, color: '#f43f5e' },
      { name: 'Pendente', value: pending, color: '#64748b' },
    ].filter(d => d.value > 0);

    const onTimeRate = total > 0 ? Math.round(((completed + onTrack) / total) * 100) : 100;

    return {
      total,
      completed,
      delayed,
      warning,
      inProgress,
      pending,
      bottlenecks,
      onTrack,
      withoutDeadline,
      averageProgress,
      totalQuantity,
      totalAmount,
      materialSummary,
      earliestStart,
      latestEnd,
      activeWorkers,
      activeMachines,
      capacityDisplay,
      statusDistribution,
      onTimeRate,
    };
  }, [detailedNodes, isGlobal, nodes, currentSectorNode, relatedNodes]);

  // Filter and sort the detailed nodes
  const filteredAndSortedNodes = useMemo(() => {
    let result = [...detailedNodes];

    // Status filter
    if (statusFilter === 'delayed') {
      result = result.filter(d => d.isDelayed);
    } else if (statusFilter === 'warning') {
      result = result.filter(d => d.isWarning);
    } else if (statusFilter === 'in_progress') {
      result = result.filter(d => d.isInProgress);
    } else if (statusFilter === 'pending') {
      result = result.filter(d => d.isPending);
    } else if (statusFilter === 'completed') {
      result = result.filter(d => d.isCompleted);
    } else if (statusFilter === 'bottleneck') {
      result = result.filter(d => d.isBottleneck);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => {
        const name = (d.quadroName || d.node.name || '').toLowerCase();
        const type = d.node.type?.toLowerCase() || '';
        const sector = d.sectorName?.toLowerCase() || '';
        const resp = (d.node.data?.responsible || d.node.data?.supervisorName || '').toLowerCase();
        const code = (d.node.data?.code || d.node.data?.sectorCode || d.node.data?.opNumber || '').toLowerCase();
        const salesOrder = (d.salesOrder || '').toLowerCase();
        return name.includes(q) || type.includes(q) || sector.includes(q) || resp.includes(q) || code.includes(q) || salesOrder.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'priority_deadline') {
        const getPriorityWeight = (item: typeof a) => {
          const p = String(item.node.data?.priority || item.node.data?.orderPriority || '').toLowerCase().trim();
          if (p === 'urgente' || p === 'crítica' || p === 'critica' || p === 'urgent' || p === 'critical') return 1;
          if (p === 'alta' || p === 'high') return 2;
          if (p === 'média' || p === 'media' || p === 'medium' || p === 'normal') return 3;
          if (p === 'baixa' || p === 'low') return 4;
          if (item.isBottleneck || item.interruptionInfo.isInterrupted) return 1;
          return 3;
        };

        const getDeadlineWeight = (item: typeof a) => {
          if (item.isCompleted) return 100000;
          if (item.isDelayed && item.deadlineInfo.daysRemaining !== null) {
            return item.deadlineInfo.daysRemaining; // e.g. -15 comes before -2
          }
          if (item.isDelayed) return -1;
          if (item.deadlineInfo.daysRemaining !== null) {
            return item.deadlineInfo.daysRemaining; // e.g. 0 (today) < 1 < 3 < 10
          }
          if (item.rawDeadline) {
            const d = parseDateString(item.rawDeadline);
            if (d) return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
          }
          return 50000;
        };

        const pA = getPriorityWeight(a);
        const pB = getPriorityWeight(b);
        if (pA !== pB) return pA - pB;

        const dA = getDeadlineWeight(a);
        const dB = getDeadlineWeight(b);
        if (dA !== dB) return dA - dB;

        return (a.quadroName || a.node.name).localeCompare(b.quadroName || b.node.name);
      }

      if (sortBy === 'flow_asc') {
        const getSectorRank = (item: typeof a) => {
          if (item.node.groupId) {
            const idx = availableSectors.findIndex(s => s.id === item.node.groupId);
            if (idx !== -1) return idx;
          }
          const sName = (item.sectorName || '').toLowerCase().trim();
          const idx = availableSectors.findIndex(s => s.name.toLowerCase().trim() === sName);
          if (idx !== -1) return idx;
          return 999;
        };
        const rankA = getSectorRank(a);
        const rankB = getSectorRank(b);
        if (rankA !== rankB) return rankA - rankB;
        // Inside same sector, sort by vertical position Y then X (process sequence)
        const ya = a.node.y ?? 0;
        const yb = b.node.y ?? 0;
        if (Math.abs(ya - yb) > 40) return ya - yb;
        return (a.node.x ?? 0) - (b.node.x ?? 0);
      }

      if (sortBy === 'deadline_asc') {
        // Overdue first (most negative first)
        if (a.isDelayed && !b.isDelayed) return -1;
        if (!a.isDelayed && b.isDelayed) return 1;
        if (a.isDelayed && b.isDelayed) {
          return (a.deadlineInfo.daysRemaining ?? 0) - (b.deadlineInfo.daysRemaining ?? 0);
        }
        // Then warnings
        if (a.isWarning && !b.isWarning) return -1;
        if (!a.isWarning && b.isWarning) return 1;
        // Then on_track with deadline
        const aDays = a.deadlineInfo.daysRemaining ?? 9999;
        const bDays = b.deadlineInfo.daysRemaining ?? 9999;
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return aDays - bDays;
      }

      if (sortBy === 'deadline_desc') {
        const aDays = a.deadlineInfo.daysRemaining ?? -9999;
        const bDays = b.deadlineInfo.daysRemaining ?? -9999;
        return bDays - aDays;
      }

      if (sortBy === 'status_urgency') {
        const getRank = (item: typeof a) => {
          if (item.isDelayed) return 1;
          if (item.isBottleneck) return 2;
          if (item.isWarning) return 3;
          if (item.isInProgress) return 4;
          if (item.isPending) return 5;
          return 6; // completed
        };
        return getRank(a) - getRank(b);
      }

      if (sortBy === 'progress_desc') {
        return b.progress - a.progress;
      }

      if (sortBy === 'progress_asc') {
        return a.progress - b.progress;
      }

      if (sortBy === 'name_asc') {
        return (a.quadroName || a.node.name).localeCompare(b.quadroName || b.node.name);
      }

      return 0;
    });

    return result;
  }, [detailedNodes, statusFilter, searchQuery, sortBy, availableSectors]);

  // Groups of nodes organized by Sector / Area
  const sectorGroups = useMemo(() => {
    const groupsMap = new Map<string, {
      sectorId: string;
      sectorName: string;
      sectorCode: string;
      sectorColor?: string;
      sectorNode: CanvasNode | null;
      stepIndex: number;
      items: typeof filteredAndSortedNodes;
    }>();

    availableSectors.forEach((s, idx) => {
      groupsMap.set(s.id, {
        sectorId: s.id,
        sectorName: s.name,
        sectorCode: s.data?.sectorCode || 'ST-' + s.name.slice(0, 3).toUpperCase(),
        sectorColor: s.color,
        sectorNode: s,
        stepIndex: idx + 1,
        items: [],
      });
    });

    const generalGroup = {
      sectorId: 'unassigned',
      sectorName: 'Área Geral / Sem Setor Delimitado',
      sectorCode: 'ST-GERAL',
      sectorColor: 'slate',
      sectorNode: null,
      stepIndex: availableSectors.length + 1,
      items: [] as typeof filteredAndSortedNodes,
    };

    filteredAndSortedNodes.forEach(item => {
      // 1. Direct match if filtered by single sector
      if (!isGlobal && currentSectorNode) {
        if (groupsMap.has(currentSectorNode.id)) {
          groupsMap.get(currentSectorNode.id)!.items.push(item);
          return;
        }
      }

      // 2. Direct parent groupId
      if (item.node.groupId && groupsMap.has(item.node.groupId)) {
        groupsMap.get(item.node.groupId)!.items.push(item);
        return;
      }

      // 3. Sector ID in data
      if (item.node.data?.sectorId && groupsMap.has(item.node.data.sectorId)) {
        groupsMap.get(item.node.data.sectorId)!.items.push(item);
        return;
      }

      // 4. Match by name or geometric containment
      const match = availableSectors.find(s =>
        s.name === item.sectorName ||
        (s.data?.sectorCode && item.node.data?.sectorCode === s.data?.sectorCode) ||
        isNodeInsideGroup(item.node, s)
      );

      if (match && groupsMap.has(match.id)) {
        groupsMap.get(match.id)!.items.push(item);
      } else {
        generalGroup.items.push(item);
      }
    });

    const list = !isGlobal && currentSectorNode
      ? [
          groupsMap.get(currentSectorNode.id) || {
            sectorId: currentSectorNode.id,
            sectorName: currentSectorNode.name,
            sectorCode: currentSectorNode.data?.sectorCode || 'ST-' + currentSectorNode.name.slice(0, 3).toUpperCase(),
            sectorColor: currentSectorNode.color,
            sectorNode: currentSectorNode,
            stepIndex: 1,
            items: [],
          },
        ]
      : Array.from(groupsMap.values());

    if (isGlobal && generalGroup.items.length > 0) {
      list.push(generalGroup);
    }

    // When global, filter out empty groups if user is searching or applying status filters
    const displayList = isGlobal && (searchQuery || statusFilter !== 'all')
      ? list.filter(g => g.items.length > 0)
      : list;

    return displayList.map(g => {
      // Sort items within sector according to flow sequence (top-to-bottom, left-to-right)
      const sortedItems = [...g.items].sort((a, b) => {
        const ya = a.node.y ?? 0;
        const yb = b.node.y ?? 0;
        if (Math.abs(ya - yb) > 40) return ya - yb;
        return (a.node.x ?? 0) - (b.node.x ?? 0);
      });

      const gTotal = sortedItems.length;
      const gCompleted = sortedItems.filter(i => i.isCompleted).length;
      const gDelayed = sortedItems.filter(i => i.isDelayed).length;
      const gWarning = sortedItems.filter(i => i.isWarning).length;
      const gInProgress = sortedItems.filter(i => i.isInProgress).length;
      const gPending = sortedItems.filter(i => i.isPending).length;
      const gAvgProg = gTotal > 0 ? Math.round(sortedItems.reduce((acc, i) => acc + i.progress, 0) / gTotal) : 0;
      const gOnTime = gTotal > 0 ? Math.round(((gTotal - gDelayed) / gTotal) * 100) : 100;

      return {
        ...g,
        items: sortedItems,
        stats: {
          total: gTotal,
          completed: gCompleted,
          delayed: gDelayed,
          warning: gWarning,
          inProgress: gInProgress,
          pending: gPending,
          averageProgress: gAvgProg,
          onTimeRate: gOnTime,
        }
      };
    });
  }, [availableSectors, filteredAndSortedNodes, isGlobal, currentSectorNode, searchQuery, statusFilter]);

  const toggleSectorCollapse = (secId: string) => {
    setCollapsedSectorIds(prev => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);
      return next;
    });
  };

  const expandAllSectors = () => setCollapsedSectorIds(new Set());
  const collapseAllSectors = () => {
    const allSecIds = sectorGroups.map(g => g.sectorId);
    setCollapsedSectorIds(new Set(allSecIds));
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Lousa',
      'Nome',
      'Tipo de Bloco',
      'Pedido de Venda',
      'Setor',
      'Status Operacional',
      'Fluxo Interrompido / Motivos',
      'Prazo Inicial',
      'Prazo Final',
      'Dias Restantes',
      'Diagnóstico de Prazo',
      'Avanço (%)',
      'Responsável',
      'Colaborador(es)',
      'Função / Cargo',
      'Prioridade',
      'Gargalo',
      'Quantidade',
      'Valor (R$)'
    ];

    const rows = filteredAndSortedNodes.map(item => {
      const assignedNames = item.assignedEmployees.map(e => e.name).join(', ') || 'Nenhum';
      const assignedRoles = item.assignedEmployees.map(e => e.data?.role || 'S/ Função').join(', ') || '---';

      return [
        `"${(item.boardName || effectiveBoardName).replace(/"/g, '""')}"`,
        `"${(item.quadroName || item.node.name || '').replace(/"/g, '""')}"`,
        `"${item.node.type}"`,
        `"${(item.salesOrder || '---').replace(/"/g, '""')}"`,
        `"${item.sectorName}"`,
        `"${item.isCompleted ? 'Concluído' : item.isDelayed ? 'Atrasado' : item.isWarning ? 'Em Alerta' : item.isInProgress ? 'Em Andamento' : 'Pendente'}"`,
        `"${(item.interruptionInfo.isInterrupted ? item.interruptionInfo.fullText : 'Fluxo Normal').replace(/"/g, '""')}"`,
        `"${item.startFormatted}"`,
        `"${item.endFormatted}"`,
        `"${item.deadlineInfo.daysRemaining ?? ''}"`,
        `"${(item.deadlineInfo.badgeText || item.deadlineInfo.reason || '').replace(/"/g, '""')}"`,
        `"${item.progress}%"`,
        `"${item.responsible.replace(/"/g, '""')}"`,
        `"${assignedNames.replace(/"/g, '""')}"`,
        `"${assignedRoles.replace(/"/g, '""')}"`,
        `"${item.node.data?.priority || 'Normal'}"`,
        `"${item.isBottleneck ? 'Sim' : 'Não'}"`,
        `"${item.node.data?.quantity || ''}"`,
        `"${item.node.data?.totalOrderValue || item.node.data?.amount || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `relatorio_${effectiveBoardName.toLowerCase().replace(/\s+/g, '_')}_${(currentSectorNode?.name || 'geral').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF Document
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const sectorTitle = selectedBoardId === 'all'
        ? 'Relatório Executivo Consolidado de Todas as Lousas'
        : `Relatório Executivo por Lousa: ${effectiveBoardName}`;
      const sectorCode = currentSectorNode?.data?.sectorCode || (isGlobal ? 'ST-GERAL' : 'ST-ALPHA');
      const emissionDate = new Date().toLocaleDateString('pt-BR');
      const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Header background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 26, 'F');

      // Emerald accent line
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(0, 26, 297, 2, 'F');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(sectorTitle, 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`LOUSA: ${effectiveBoardName.toUpperCase()}   |   SETOR: ${isGlobal ? 'TODOS OS SETORES' : (currentSectorNode?.name || 'SETOR').toUpperCase()}   |   EMISSÃO: ${emissionDate} às ${emissionTime}   |   CONFORMIDADE: ${stats.onTimeRate}%`, 14, 20);

      // Right header badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(`${stats.total} Quadros Monitorados`, 283, 15, { align: 'right' });

      // KPI Summary cards
      const commercialNodes = filteredAndSortedNodes.filter(d => 
        (d.sectorName && (d.sectorName.toLowerCase().includes('comercial') || d.sectorName.toLowerCase().includes('venda'))) ||
        d.node.type === 'order' ||
        d.node.type === 'budget' ||
        (d.salesOrder && d.salesOrder !== '---')
      );

      const kpis = [
        { label: 'TOTAL QUADROS', value: `${stats.total}`, color: [15, 23, 42] },
        isGlobal
          ? { label: 'SETOR COMERCIAL / PEDIDOS', value: `${commercialNodes.length}`, color: [13, 148, 136] }
          : { label: 'CONFORMIDADE DO SETOR', value: `${stats.onTimeRate}%`, color: [13, 148, 136] },
        { label: 'CONCLUÍDOS', value: `${stats.completed} (${stats.total > 0 ? Math.round((stats.completed/stats.total)*100) : 0}%)`, color: [16, 185, 129] },
        { label: 'EM ANDAMENTO', value: `${stats.inProgress}`, color: [59, 130, 246] },
        { label: 'EM ALERTA (<=3d)', value: `${stats.warning}`, color: [245, 158, 11] },
        { label: 'ATRASADOS', value: `${stats.delayed}`, color: [225, 29, 72] },
      ];

      const boxW = 43;
      const boxH = 15;
      const startX = 14;
      const startY = 32;

      kpis.forEach((kpi, idx) => {
        const bx = startX + idx * (boxW + 2.2);
        // Background card
        doc.setFillColor(241, 245, 249); // slate-100
        doc.roundedRect(bx, startY, boxW, boxH, 2, 2, 'F');

        // Top colored stripe
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.roundedRect(bx, startY, boxW, 2.5, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(kpi.label, bx + 3, startY + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(kpi.value, bx + 3, startY + 12);
      });

      // Table Data: Setor, Nome, Início, Prazo Final, Faltam (Dias), Status e Fluxo Interrompido / Motivos
      const tableHeaders = [['Setor', 'Nome', 'Colaboradores/Resp', 'Início', 'Prazo Final', 'Faltam (Dias)', 'Status', 'Fluxo Interrompido / Motivos']];

      const tableRows = filteredAndSortedNodes.map(item => {
        const statusText = item.isCompleted 
          ? 'Concluído' 
          : item.isDelayed 
            ? item.interruptionInfo.isInterrupted 
              ? 'Interrompido' 
              : 'Atrasado' 
            : item.isWarning 
              ? 'Em Alerta' 
              : item.isInProgress 
                ? 'Em Andamento' 
                : 'Pendente';

        const interruptionText = item.interruptionInfo.pdfFormattedText;

        const daysRemainingText = item.isCompleted
          ? 'Finalizado'
          : item.deadlineInfo.daysRemaining !== null && item.deadlineInfo.daysRemaining !== undefined
            ? item.deadlineInfo.daysRemaining < 0
              ? `Atrasado (${Math.abs(item.deadlineInfo.daysRemaining)}d)`
              : item.deadlineInfo.daysRemaining === 0
                ? 'Vence Hoje!'
                : item.deadlineInfo.daysRemaining === 1
                  ? 'Falta 1 dia'
                  : `Faltam ${item.deadlineInfo.daysRemaining} dias`
            : item.interruptionInfo.isInterrupted
              ? 'Bloqueado'
              : 'Sem prazo';

        let colabText = item.responsible;
        if (item.assignedEmployees.length > 0) {
          const namesAndRoles = item.assignedEmployees.map(e => `${e.name} (${e.data?.role || 'S/ Função'})`);
          colabText += `\n${namesAndRoles.join('\n')}`;
        }

        return [
          item.sectorName || 'Geral',
          item.quadroName || item.node.name || 'Sem nome',
          colabText,
          item.startFormatted || '---',
          item.endFormatted || '---',
          daysRemainingText,
          statusText,
          interruptionText,
        ];
      });

      const columnStylesConfig = {
        0: { cellWidth: 24, fontStyle: 'bold' as const, overflow: 'linebreak' as const },
        1: { cellWidth: 40, fontStyle: 'bold' as const, overflow: 'linebreak' as const },
        2: { cellWidth: 36, overflow: 'linebreak' as const, fontSize: 7 },
        3: { cellWidth: 20, halign: 'center' as const },
        4: { cellWidth: 21, halign: 'center' as const, fontStyle: 'bold' as const },
        5: { cellWidth: 24, halign: 'center' as const, fontStyle: 'bold' as const },
        6: { cellWidth: 24, halign: 'center' as const, fontStyle: 'bold' as const },
        7: { cellWidth: 80, fontSize: 6.8, overflow: 'linebreak' as const, cellPadding: 2 },
      };

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 51,
        margin: { left: 14, right: 14, bottom: 16 },
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          cellPadding: 2.8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 2.2,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: columnStylesConfig,
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const item = filteredAndSortedNodes[rowIndex];
            if (item) {
              // Cor do fundo da linha com base no Status
              if (item.isDelayed) {
                data.cell.styles.fillColor = [254, 226, 226]; // Rose-100 / Vermelho suave
              } else if (item.isWarning) {
                data.cell.styles.fillColor = [254, 243, 199]; // Amber-100 / Amarelo suave
              } else if (item.isCompleted) {
                data.cell.styles.fillColor = [236, 253, 245]; // Emerald-50 / Verde suave
              } else if (item.isInProgress) {
                data.cell.styles.fillColor = [239, 246, 255]; // Blue-50 / Azul suave
              } else if (item.interruptionInfo.isInterrupted || item.isBottleneck) {
                data.cell.styles.fillColor = [250, 232, 255]; // Purple-50 / Roxo suave
              } else {
                data.cell.styles.fillColor = rowIndex % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
              }

              const isCommercial = (
                (item.sectorName && (item.sectorName.toLowerCase().includes('comercial') || item.sectorName.toLowerCase().includes('venda'))) ||
                item.node.type === 'order' ||
                item.node.type === 'budget' ||
                (item.salesOrder && item.salesOrder !== '---')
              );

              // Destaque do Setor Comercial
              if (isCommercial && data.column.index === 0) {
                data.cell.styles.textColor = [13, 148, 136]; // Teal-600
                data.cell.styles.fontStyle = 'bold';
              }

              // Destaque de Prazo Final
              if (data.column.index === 3) {
                data.cell.styles.fontStyle = 'bold';
                if (isCommercial) {
                  data.cell.styles.textColor = [15, 23, 42]; // Preto Slate forte
                }
              }

              // Destaque de Quantos Dias Faltam (Coluna 4)
              if (data.column.index === 4) {
                const val = String(data.cell.raw);
                data.cell.styles.fontStyle = 'bold';
                if (val.startsWith('Atrasado')) {
                  data.cell.styles.textColor = [225, 29, 72]; // Rose-600
                } else if (val.includes('Hoje') || val.includes('1 dia') || (item.deadlineInfo.daysRemaining !== null && item.deadlineInfo.daysRemaining <= 3 && !item.isCompleted)) {
                  data.cell.styles.textColor = [217, 119, 6]; // Amber-600
                } else if (val === 'Finalizado') {
                  data.cell.styles.textColor = [16, 185, 129]; // Emerald-600
                } else if (isCommercial) {
                  data.cell.styles.textColor = [13, 148, 136]; // Teal-600 destacado para Comercial
                } else {
                  data.cell.styles.textColor = [71, 85, 105]; // Slate-600
                }
              }

              // Status Operacional (Coluna 5)
              if (data.column.index === 5) {
                const val = String(data.cell.raw);
                if (val === 'Atrasado' || val === 'Interrompido') {
                  data.cell.styles.textColor = [225, 29, 72];
                  data.cell.styles.fontStyle = 'bold';
                } else if (val === 'Em Alerta') {
                  data.cell.styles.textColor = [217, 119, 6];
                  data.cell.styles.fontStyle = 'bold';
                } else if (val === 'Concluído') {
                  data.cell.styles.textColor = [16, 185, 129];
                  data.cell.styles.fontStyle = 'bold';
                } else if (val === 'Em Andamento') {
                  data.cell.styles.textColor = [37, 99, 235];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.textColor = [100, 116, 139];
                }
              }

              // Fluxo Interrompido / Motivos (Coluna 6)
              if (data.column.index === 6) {
                const val = String(data.cell.raw);
                data.cell.styles.overflow = 'linebreak';
                data.cell.styles.fontSize = 6.8;
                data.cell.styles.cellPadding = 2;
                if (
                  val.includes('[LIGAÇÃO BLOQUEADA]') ||
                  val.includes('[FLUXO INTERROMPIDO]') ||
                  val.includes('[BLOQUEIO') ||
                  val.includes('Interrompido') ||
                  val.includes('Bloqueado')
                ) {
                  data.cell.styles.textColor = [190, 18, 60]; // Rose-700 escuro para legibilidade perfeita
                } else if (val.includes('[FLUXO NORMALIZADO]') || val.includes('Normalizado')) {
                  data.cell.styles.textColor = [4, 120, 87]; // Emerald-700
                } else if (val.includes('[GARGALO')) {
                  data.cell.styles.textColor = [126, 34, 206]; // Purple-700
                } else {
                  data.cell.styles.textColor = [100, 116, 139];
                }
              }
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}  •  Relatório Operacional  •  Gestão de Prazos & Operações`,
            14,
            204
          );
          doc.text(
            `Exportado em ${emissionDate} às ${emissionTime}`,
            283,
            204,
            { align: 'right' }
          );
        }
      });

      const safeName = (currentSectorNode?.name || 'geral')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      const fileName = `relatorio_setor_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback
      window.print();
    }
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md pointer-events-auto"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {selectedBoardId === 'all'
                      ? 'Relatório Consolidado de Todas as Lousas'
                      : isGlobal
                        ? `Relatório por Lousa: ${effectiveBoardName}`
                        : `Relatório: ${currentSectorNode?.name} (${effectiveBoardName})`}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {stats.total} Quadros
                  </span>
                  {availableSectors.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {availableSectors.length} Áreas/Setores
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-slate-400 text-xs font-mono mt-0.5 flex-wrap">
                  <span className="text-cyan-400 font-bold">LOUSA: {effectiveBoardName.toUpperCase()}</span>
                  <span>•</span>
                  <span>CÓDIGO: {currentSectorNode?.data?.sectorCode || (isGlobal ? 'ST-GERAL' : 'ST-ALPHA')}</span>
                  <span>•</span>
                  <span>DATA: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{stats.onTimeRate}% no prazo</span>
                </div>
              </div>
            </div>

            {/* Board Selector, Sector Selector & Actions */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Lousa Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-lg p-1 border border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1.5 hidden md:inline">
                  Lousa:
                </span>
                <div className="relative">
                  <select
                    value={selectedBoardId}
                    onChange={(e) => {
                      setSelectedBoardId(e.target.value);
                      setSelectedSectorId(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-950 text-cyan-300 text-xs font-bold rounded-md px-2.5 py-1.5 border border-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer pr-7 shadow-inner"
                    title="Selecione a lousa para gerar o relatório"
                  >
                    <option value="all">🌐 Todas as Lousas</option>
                    {boards && boards.length > 0 ? (
                      boards.map(b => (
                        <option key={b.id} value={b.id}>
                          📋 {b.name} {b.id === activeBoardId ? '(Ativa)' : ''}
                        </option>
                      ))
                    ) : (
                      <option value="active">📋 Lousa Atual</option>
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Quick Activate Board on Canvas Button */}
                {onSelectBoard && selectedBoardId !== 'all' && selectedBoardId !== activeBoardId && (
                  <button
                    type="button"
                    onClick={() => onSelectBoard(selectedBoardId)}
                    className="p-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Mudar para esta lousa no Canvas"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden xl:inline">Ir ao Canvas</span>
                  </button>
                )}
              </div>

              {/* Sector Dropdown */}
              <div className="relative">
                <select
                  value={selectedSectorId || 'all'}
                  onChange={(e) => setSelectedSectorId(e.target.value === 'all' ? null : e.target.value)}
                  className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer pr-8"
                  title="Filtrar por Área ou Setor"
                >
                  <option value="all">📁 Todos os Setores (Consolidado)</option>
                  {availableSectors.map(s => (
                    <option key={s.id} value={s.id}>
                      🏢 {s.name} ({s.data?.sectorCode || 'Setor'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* PDF Converter Button */}
              <button 
                onClick={handleExportPDF}
                className="p-2 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-all border border-red-500/50 flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-red-950/40 cursor-pointer active:scale-95" 
                title="Converter e baixar relatório em PDF"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>Exportar PDF</span>
              </button>

              <button 
                onClick={handleExportCSV}
                className="p-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all border border-emerald-500/40 flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer active:scale-95" 
                title="Exportar dados dos quadros em CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-all border border-white/5 ml-1 cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04),transparent)]">
            
            {/* KPI Cards: Prazos e Status em Destaque */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Total de Quadros */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total de Quadros</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-white">{stats.total}</span>
                  <span className="text-[10px] text-slate-400">ativos</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-2 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  {isGlobal ? 'Em toda a planta' : 'Neste setor'}
                </div>
              </div>

              {/* Concluídos */}
              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Concluídos
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-emerald-400">{stats.completed}</span>
                  <span className="text-[10px] text-slate-400">({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="text-[10px] text-emerald-300/80 font-mono mt-2">
                  Etapas finalizadas
                </div>
              </div>

              {/* Em Andamento */}
              <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 flex flex-col justify-between">
                <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  Em Andamento
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-blue-400">{stats.inProgress}</span>
                  <span className="text-[10px] text-slate-400">em curso</span>
                </div>
                <div className="text-[10px] text-blue-300/80 font-mono mt-2">
                  Progresso médio: {stats.averageProgress}%
                </div>
              </div>

              {/* Em Alerta / Prazo Curto */}
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 flex flex-col justify-between">
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Em Alerta
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-amber-400">{stats.warning}</span>
                  <span className="text-[10px] text-amber-300/70">≤ 3 dias</span>
                </div>
                <div className="text-[10px] text-amber-400/80 font-mono mt-2">
                  Risco de atraso
                </div>
              </div>

              {/* Atrasados */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                stats.delayed > 0 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-slate-950/60 border-white/5'
              }`}>
                <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  Atrasados
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className={`text-2xl font-black ${stats.delayed > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                    {stats.delayed}
                  </span>
                  <span className="text-[10px] text-slate-400">fora do prazo</span>
                </div>
                <div className="text-[10px] text-rose-400/80 font-mono mt-2">
                  {stats.delayed > 0 ? 'Ação imediata necessária' : 'Sem atrasos críticos'}
                </div>
              </div>

              {/* Gargalos / Bloqueios */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-purple-400" />
                  Gargalos
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-purple-300">{stats.bottlenecks}</span>
                  <span className="text-[10px] text-slate-400">críticos</span>
                </div>
                <div className="text-[10px] text-purple-300/80 font-mono mt-2">
                  Pontos de retenção
                </div>
              </div>
            </div>

            {/* Informações de Cronograma e Janela de Prazos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Janela de Prazos */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Janela Temporal do Setor
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Cronograma
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Data Mais Cedo</span>
                    <span className="font-bold text-white font-mono mt-0.5 block">
                      {stats.earliestStart ? stats.earliestStart.toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                  </div>
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Entrega Mais Tardia</span>
                    <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                      {stats.latestEnd ? stats.latestEnd.toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador de Saúde do Fluxo */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-sky-400" />
                    Distribuição dos Status
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {stats.total} quadros
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={22}
                          outerRadius={36}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-slate-300">Concluído: <b className="text-white">{stats.completed}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-slate-300">Em curso: <b className="text-white">{stats.inProgress}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-slate-300">Em Alerta: <b className="text-white">{stats.warning}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-300">Atrasado: <b className="text-rose-400">{stats.delayed}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eficiência e Recursos do Setor */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Avanço Ponderado & Recursos
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {stats.averageProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500"
                    style={{ width: `${stats.averageProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-400" />
                    {stats.activeWorkers} Operadores
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-sky-400" />
                    {stats.activeMachines} Máquinas/Serviços
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO PRINCIPAL: LISTAGEM DE QUADROS POR PRAZO E STATUS */}
            <div className="bg-slate-950/70 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              
              {/* Barra de Filtros Rápidos, Busca e Ordenação */}
              <div className="p-4 border-b border-white/10 bg-slate-900/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                
                {/* Abas de Filtro de Status */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'all'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>Todos</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300">
                      {detailedNodes.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('delayed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'delayed'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Atrasados</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-rose-300 font-bold">
                      {stats.delayed}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('warning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'warning'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Em Alerta</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-amber-300">
                      {stats.warning}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'in_progress'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Em Andamento</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-blue-300">
                      {stats.inProgress}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'pending'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>A Fazer / Fila</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-slate-400">
                      {stats.pending}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      statusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluídos</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-emerald-300">
                      {stats.completed}
                    </span>
                  </button>

                  {stats.bottlenecks > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('bottleneck')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        statusFilter === 'bottleneck'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Gargalos ({stats.bottlenecks})</span>
                    </button>
                  )}
                </div>

                {/* Controles de Busca, Ordenação, Nível de Detalhe e Modo de Visualização */}
                <div className="flex items-center flex-wrap gap-2.5">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar quadro, responsável..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-40 sm:w-52 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Ordenação */}
                  <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOptionType)}
                      className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="priority_deadline" className="bg-slate-900 text-slate-100">Prioridade & Prazo de Entrega</option>
                      <option value="deadline_asc" className="bg-slate-900 text-slate-100">Prazo: Mais Urgentes</option>
                      <option value="status_urgency" className="bg-slate-900 text-slate-100">Status: Mais Críticos</option>
                      <option value="flow_asc" className="bg-slate-900 text-slate-100">Sequência do Fluxo</option>
                      <option value="deadline_desc" className="bg-slate-900 text-slate-100">Prazo: Mais Distantes</option>
                      <option value="progress_desc" className="bg-slate-900 text-slate-100">Avanço: Maior %</option>
                      <option value="progress_asc" className="bg-slate-900 text-slate-100">Avanço: Menor %</option>
                      <option value="name_asc" className="bg-slate-900 text-slate-100">Nome: A-Z</option>
                    </select>
                  </div>

                  {/* Filtro de Densidade / Nível de Detalhes (Simplificado vs Detalhado) */}
                  <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-lg p-0.5" title="Densidade de Dados">
                    <button
                      type="button"
                      onClick={() => setDetailLevel('simplified')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        detailLevel === 'simplified'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Exibir apenas os dados essenciais (mais limpo e direto)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Simplificado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailLevel('detailed')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        detailLevel === 'detailed'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Exibir todos os campos técnicos, métricas, datas e diagnósticos"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Detalhado</span>
                    </button>
                  </div>

                  {/* Modos de Visualização: Áreas & Setores / Tabela Geral / Cards */}
                  <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('sectors')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === 'sectors'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Listar Áreas e Setores e o que está dentro delas com seus status"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Áreas & Setores</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === 'table'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Visualização em Tabela Geral"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tabela Geral</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      title="Visualização em Cards"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conteúdo da Listagem */}
              {filteredAndSortedNodes.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">
                    Nenhum quadro encontrado
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Nenhum quadro atende aos filtros de busca e status selecionados.'
                      : `Não foram detectados quadros dentro dos limites do setor "${currentSectorNode?.name || 'selecionado'}". Você pode selecionar outro setor no menu acima ou visualizar o relatório geral.`}
                  </p>
                  {(searchQuery || statusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                  {(!searchQuery && statusFilter === 'all' && !isGlobal) && (
                    <button
                      type="button"
                      onClick={() => setSelectedSectorId(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      Ver Todos os Quadros da Planta ({effectiveNodes.filter(n => n.type !== 'text' && n.type !== 'note' && n.type !== 'group' && n.type !== 'sector').length})
                    </button>
                  )}
                </div>
              ) : viewMode === 'sectors' ? (
                /* HIERARQUIA: ÁREAS / SETORES E O QUE ESTÁ DENTRO DELAS COM SEUS STATUS */
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Top bar with summary & expand/collapse controls */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400 border-b border-white/5 pb-2.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-200">
                        {sectorGroups.length} {sectorGroups.length === 1 ? 'Área / Setor' : 'Áreas e Setores'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {filteredAndSortedNodes.length} itens encontrados em {effectiveBoardName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={expandAllSectors}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Expandir Todos
                      </button>
                      <button
                        type="button"
                        onClick={collapseAllSectors}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Recolher Todos
                      </button>
                    </div>
                  </div>

                  {/* Sectors Accordion / Cards List */}
                  <div className="space-y-4">
                    {sectorGroups.map((group) => {
                      const isCollapsed = collapsedSectorIds.has(group.sectorId);
                      return (
                        <div
                          key={group.sectorId}
                          className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden transition-all shadow-md"
                        >
                          {/* Sector Header Banner */}
                          <div
                            onClick={() => toggleSectorCollapse(group.sectorId)}
                            className="p-3.5 sm:p-4 bg-slate-900/80 hover:bg-slate-900 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white">
                                    {group.sectorName}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-white/10">
                                    {group.sectorCode}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    {group.stats.total} {group.stats.total === 1 ? 'quadro' : 'quadros'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                                  <span>Progresso: <b className="text-slate-200">{group.stats.averageProgress}%</b></span>
                                  <span>•</span>
                                  <span>No Prazo: <b className={group.stats.onTimeRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{group.stats.onTimeRate}%</b></span>
                                </div>
                              </div>
                            </div>

                            {/* Sector status summary pills */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {group.stats.completed > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {group.stats.completed} Concluído{group.stats.completed > 1 ? 's' : ''}
                                </span>
                              )}
                              {group.stats.inProgress > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {group.stats.inProgress} Em Andamento
                                </span>
                              )}
                              {group.stats.warning > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {group.stats.warning} Alerta
                                </span>
                              )}
                              {group.stats.delayed > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                                  <AlertCircle className="w-3 h-3" />
                                  {group.stats.delayed} Atrasado{group.stats.delayed > 1 ? 's' : ''}
                                </span>
                              )}
                              {group.stats.pending > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                                  {group.stats.pending} Fila
                                </span>
                              )}

                              <div className="p-1 rounded text-slate-400 hover:text-white transition-colors ml-1">
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sector Progress Bar */}
                          <div className="w-full bg-slate-900 h-1">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${group.stats.averageProgress}%` }}
                            />
                          </div>

                          {/* Items inside this Sector */}
                          {!isCollapsed && (
                            <div className="divide-y divide-white/5">
                              {group.items.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">
                                  Nenhum quadro operacional alocado nesta área no momento.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-white/5">
                                      <tr>
                                        <th className="px-4 py-2.5">Nome</th>
                                        <th className="px-3 py-2.5">Ped. Venda</th>
                                        <th className="px-3 py-2.5">Status Operacional</th>
                                        <th className="px-3 py-2.5">Início</th>
                                        <th className="px-3 py-2.5">Prazo Final</th>
                                        <th className="px-3 py-2.5">Diagnóstico</th>
                                        <th className="px-3 py-2.5">Avanço</th>
                                        <th className="px-3 py-2.5">Responsável</th>
                                        <th className="px-3 py-2.5">Colaboradores & Funções</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                      {group.items.map((item) => {
                                        const { node, progress, deadlineInfo, isBottleneck, isCompleted, isDelayed, isWarning, isInProgress } = item;
                                        return (
                                          <tr
                                            key={node.id}
                                            className={`transition-colors group border-b border-white/5 ${
                                              isDelayed
                                                ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500'
                                                : isWarning
                                                  ? 'bg-amber-950/35 hover:bg-amber-900/45 border-l-4 border-l-amber-500'
                                                  : isCompleted
                                                    ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-l-4 border-l-emerald-500'
                                                    : isInProgress
                                                      ? 'bg-blue-950/30 hover:bg-blue-900/40 border-l-4 border-l-blue-500'
                                                      : item.interruptionInfo.isInterrupted || isBottleneck
                                                        ? 'bg-purple-950/35 hover:bg-purple-900/45 border-l-4 border-l-purple-500'
                                                        : 'bg-slate-900/30 hover:bg-slate-800/50 border-l-4 border-l-transparent'
                                            }`}
                                          >
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className="min-w-0">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                                                      {item.quadroName || node.name}
                                                    </span>
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400 border border-white/5">
                                                      {node.type}
                                                    </span>
                                                    {selectedBoardId === 'all' && (
                                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40">
                                                        {item.boardName}
                                                      </span>
                                                    )}
                                                    {isBottleneck && (
                                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        Gargalo
                                                      </span>
                                                    )}
                                                  </div>
                                                  {node.data?.description && (
                                                    <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                                      {node.data.description}
                                                    </p>
                                                  )}

                                                  {/* Layout Detalhado sobre a Ligação / Interrupção */}
                                                  {item.interruptionInfo.isInterrupted && (
                                                    <div className="mt-2 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[11px] space-y-1.5 shadow-sm max-w-md">
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase text-[9px] tracking-wide">
                                                          {item.node.type === 'interrupted_flow' ? '🔴 Ligação Bloqueada' : '⚠️ Trava de Linha'}
                                                        </span>
                                                        {item.interruptionInfo.connectionSummary && (
                                                          <span className="text-rose-200 font-medium text-[10px] flex items-center gap-1">
                                                            <Workflow className="w-3 h-3 text-rose-400 shrink-0" />
                                                            {item.interruptionInfo.connectionSummary}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {item.interruptionInfo.incidentDescription && (
                                                        <div className="text-slate-200 bg-black/30 p-1.5 rounded border border-white/5 font-mono text-[10px] leading-relaxed">
                                                          <span className="text-rose-400 font-bold">Motivo: </span>
                                                          {item.interruptionInfo.incidentDescription}
                                                        </div>
                                                      )}
                                                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-300 font-mono">
                                                        {item.interruptionInfo.incidentResponsible && (
                                                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 flex items-center gap-1">
                                                            <User className="w-2.5 h-2.5 text-blue-400" />
                                                            Resp: <strong className="text-white">{item.interruptionInfo.incidentResponsible}</strong>
                                                          </span>
                                                        )}
                                                        {item.interruptionInfo.incidentDate && item.interruptionInfo.incidentDate !== '---' && (
                                                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-amber-300 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                                                            Ocorrido: <strong>{item.interruptionInfo.incidentDate}</strong>
                                                          </span>
                                                        )}
                                                        {item.interruptionInfo.incidentResolutionDate && item.interruptionInfo.incidentResolutionDate !== '---' && (
                                                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-emerald-300 flex items-center gap-1">
                                                            <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                                                            Previsão: <strong>{item.interruptionInfo.incidentResolutionDate}</strong>
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>

                                            <td className="px-3 py-3">
                                              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                                {item.salesOrder}
                                              </span>
                                            </td>

                                            <td className="px-3 py-3">
                                              {isCompleted ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                  Concluído
                                                </span>
                                              ) : isDelayed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                                  Atrasado
                                                </span>
                                              ) : isWarning ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                                  Em Alerta
                                                </span>
                                              ) : isInProgress ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                                  Em Andamento
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                                                  <Clock className="w-3 h-3 text-slate-400" />
                                                  {node.status || 'Pendente'}
                                                </span>
                                              )}
                                            </td>

                                            <td className="px-3 py-3 font-mono text-[11px] text-slate-300">
                                              {item.startFormatted}
                                            </td>

                                            <td className="px-3 py-3 font-mono text-[11px]">
                                              <span className={isDelayed ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                                {item.endFormatted}
                                              </span>
                                            </td>

                                            <td className="px-3 py-3">
                                              {isCompleted ? (
                                                <span className="text-emerald-400 font-semibold text-[11px]">No prazo</span>
                                              ) : isDelayed ? (
                                                <span className="text-rose-400 font-bold text-[11px]">
                                                  {deadlineInfo.daysRemaining !== null ? `${Math.abs(deadlineInfo.daysRemaining)}d de atraso` : 'Atrasado'}
                                                </span>
                                              ) : isWarning ? (
                                                <span className="text-amber-400 font-semibold text-[11px]">
                                                  {deadlineInfo.daysRemaining === 0 ? 'Vence hoje' : `Restam ${deadlineInfo.daysRemaining}d`}
                                                </span>
                                              ) : deadlineInfo.daysRemaining !== null ? (
                                                <span className="text-sky-400 text-[11px]">
                                                  Restam {deadlineInfo.daysRemaining}d
                                                </span>
                                              ) : (
                                                <span className="text-slate-500 text-[11px]">Sem prazo</span>
                                              )}
                                            </td>

                                            <td className="px-3 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                  <div
                                                    className={`h-full ${
                                                      isCompleted
                                                        ? 'bg-emerald-400'
                                                        : isDelayed
                                                          ? 'bg-rose-500'
                                                          : isWarning
                                                            ? 'bg-amber-400'
                                                            : 'bg-blue-400'
                                                    }`}
                                                    style={{ width: `${progress}%` }}
                                                  />
                                                </div>
                                                <span className="font-mono text-[11px] font-bold text-slate-200">
                                                  {progress}%
                                                </span>
                                              </div>
                                            </td>

                                            <td className="px-3 py-3 text-[11px] text-slate-100 font-bold truncate max-w-[120px]" title={item.responsible}>
                                              {item.responsible}
                                            </td>

                                            <td className="px-3 py-3">
                                              {item.assignedEmployees.length > 0 ? (
                                                <div className="flex flex-col gap-1.5">
                                                  {item.assignedEmployees.map(emp => (
                                                    <div key={emp.id} className="flex flex-col border-l-2 border-blue-500/30 pl-2">
                                                      <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1 truncate max-w-[150px]">
                                                        <User className="w-3 h-3" />
                                                        {emp.name}
                                                      </span>
                                                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]" title={emp.data?.role || 'S/ Função'}>
                                                        {emp.data?.role || 'S/ Função'}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-slate-500 text-[11px] italic">Sem atribuição</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : viewMode === 'table' ? (
                /* TABELA DE QUADROS (SIMPLIFICADA OU DETALHADA) */
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-white/10 z-10">
                      {detailLevel === 'simplified' ? (
                        <tr>
                          <th className="px-5 py-3">Nome</th>
                          <th className="px-3 py-3">Pedido de Venda</th>
                          <th className="px-4 py-3">Setor</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Prazo Final</th>
                          <th className="px-4 py-3">Avanço</th>
                          <th className="px-4 py-3">Responsável</th>
                          <th className="px-4 py-3">Colaboradores & Funções</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-5 py-3.5">Nome</th>
                          <th className="px-3 py-3.5">Pedido de Venda</th>
                          <th className="px-3 py-3.5">Setor</th>
                          <th className="px-3 py-3.5">Status Operacional</th>
                          <th className="px-3 py-3.5">Início</th>
                          <th className="px-3 py-3.5">Prazo Final</th>
                          <th className="px-3 py-3.5">Diagnóstico do Prazo</th>
                          <th className="px-3 py-3.5">Avanço Real</th>
                          <th className="px-3 py-3.5">Qtd / Prioridade</th>
                          <th className="px-3 py-3.5">Responsável</th>
                          <th className="px-3 py-3.5">Colaboradores & Funções</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredAndSortedNodes.map((item) => {
                        const { node, progress, deadlineInfo, isBottleneck, isCompleted, isDelayed, isWarning } = item;
                        
                        // Visão Simplificada da Linha
                        if (detailLevel === 'simplified') {
                          return (
                            <tr 
                              key={node.id} 
                              className={`transition-colors group border-b border-white/5 ${
                                isDelayed
                                  ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500'
                                  : isWarning
                                    ? 'bg-amber-950/35 hover:bg-amber-900/45 border-l-4 border-l-amber-500'
                                    : isCompleted
                                      ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-l-4 border-l-emerald-500'
                                      : item.isInProgress
                                        ? 'bg-blue-950/30 hover:bg-blue-900/40 border-l-4 border-l-blue-500'
                                        : item.interruptionInfo.isInterrupted || isBottleneck
                                          ? 'bg-purple-950/35 hover:bg-purple-900/45 border-l-4 border-l-purple-500'
                                          : 'bg-slate-900/30 hover:bg-slate-800/50 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                                    {item.quadroName || node.name}
                                  </span>
                                  {isBottleneck && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono uppercase">
                                      Gargalo
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-3 py-3 font-mono text-[11px]">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold whitespace-nowrap">
                                  {item.salesOrder}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <span className="text-[11px] font-mono text-slate-300">
                                  {item.sectorName}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                                  </span>
                                ) : isDelayed ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                                    <AlertCircle className="w-3.5 h-3.5" /> Atrasado
                                  </span>
                                ) : isWarning ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Em Alerta
                                  </span>
                                ) : item.isInProgress ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Em Curso
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">A Fazer</span>
                                )}
                              </td>

                              <td className="px-4 py-3 font-mono text-[11px]">
                                <span className={isDelayed ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                  {item.endFormatted}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                    <div 
                                      className={`h-full ${
                                        isCompleted ? 'bg-emerald-400' : isDelayed ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-blue-400'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-[11px] text-slate-200">{progress}%</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-slate-100 font-bold text-[11px] truncate max-w-[140px]">
                                {item.responsible}
                              </td>

                              <td className="px-4 py-3">
                                {item.assignedEmployees.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {item.assignedEmployees.map(emp => (
                                      <span key={emp.id} className="text-[10px] text-blue-300 font-medium truncate max-w-[140px]" title={`${emp.name} - ${emp.data?.role || 'S/ Função'}`}>
                                        <User className="w-2.5 h-2.5 inline mr-1" />
                                        {emp.name} <span className="text-slate-500">({emp.data?.role || 'S/ Função'})</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">Nenhum</span>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        // Visão Detalhada da Linha
                        return (
                          <tr 
                            key={node.id} 
                            className={`transition-colors group border-b border-white/5 ${
                              isDelayed
                                ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500'
                                : isWarning
                                  ? 'bg-amber-950/35 hover:bg-amber-900/45 border-l-4 border-l-amber-500'
                                  : isCompleted
                                    ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-l-4 border-l-emerald-500'
                                    : item.isInProgress
                                      ? 'bg-blue-950/30 hover:bg-blue-900/40 border-l-4 border-l-blue-500'
                                      : item.interruptionInfo.isInterrupted || isBottleneck
                                        ? 'bg-purple-950/35 hover:bg-purple-900/45 border-l-4 border-l-purple-500'
                                        : 'bg-slate-900/30 hover:bg-slate-800/50 border-l-4 border-l-transparent'
                            }`}
                          >
                            {/* Nome e tipo do quadro */}
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                                  {item.quadroName || node.name}
                                  {isBottleneck && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono uppercase">
                                      Gargalo
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                                    {node.type}
                                  </span>
                                  {node.data?.code && (
                                    <span>#{node.data.code}</span>
                                  )}
                                  {node.data?.opNumber && (
                                    <span>OP:{node.data.opNumber}</span>
                                  )}
                                </div>

                                {/* Layout Detalhado sobre a Ligação / Interrupção */}
                                {item.interruptionInfo.isInterrupted && (
                                  <div className="mt-2 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[11px] space-y-1.5 shadow-sm max-w-md">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase text-[9px] tracking-wide">
                                        {item.node.type === 'interrupted_flow' ? '🔴 Ligação Bloqueada' : '⚠️ Trava de Linha'}
                                      </span>
                                      {item.interruptionInfo.connectionSummary && (
                                        <span className="text-rose-200 font-medium text-[10px] flex items-center gap-1">
                                          <Workflow className="w-3 h-3 text-rose-400 shrink-0" />
                                          {item.interruptionInfo.connectionSummary}
                                        </span>
                                      )}
                                    </div>
                                    {item.interruptionInfo.incidentDescription && (
                                      <div className="text-slate-200 bg-black/30 p-1.5 rounded border border-white/5 font-mono text-[10px] leading-relaxed">
                                        <span className="text-rose-400 font-bold">Motivo: </span>
                                        {item.interruptionInfo.incidentDescription}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-300 font-mono">
                                      {item.interruptionInfo.incidentResponsible && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 flex items-center gap-1">
                                          <User className="w-2.5 h-2.5 text-blue-400" />
                                          Resp: <strong className="text-white">{item.interruptionInfo.incidentResponsible}</strong>
                                        </span>
                                      )}
                                      {item.interruptionInfo.incidentDate && item.interruptionInfo.incidentDate !== '---' && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-amber-300 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5 text-amber-400" />
                                          Ocorrido: <strong>{item.interruptionInfo.incidentDate}</strong>
                                        </span>
                                      )}
                                      {item.interruptionInfo.incidentResolutionDate && item.interruptionInfo.incidentResolutionDate !== '---' && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-emerald-300 flex items-center gap-1">
                                          <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                                          Previsão: <strong>{item.interruptionInfo.incidentResolutionDate}</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Pedido de Venda */}
                            <td className="px-3 py-3.5 font-mono text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold whitespace-nowrap">
                                {item.salesOrder}
                              </span>
                            </td>

                            {/* Setor */}
                            <td className="px-3 py-3.5">
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5 truncate max-w-[120px] block" title={item.sectorName}>
                                {item.sectorName}
                              </span>
                            </td>

                            {/* Status Operacional */}
                            <td className="px-3 py-3.5">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Concluído
                                </span>
                              ) : isDelayed ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wide animate-pulse">
                                  <AlertCircle className="w-3 h-3" />
                                  Atrasado
                                </span>
                              ) : isWarning ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                                  <AlertTriangle className="w-3 h-3" />
                                  Em Alerta
                                </span>
                              ) : item.isInProgress ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                  Em Curso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5 uppercase tracking-wide">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                  A Fazer
                                </span>
                              )}
                            </td>

                            {/* Prazo Inicial */}
                            <td className="px-3 py-3.5 font-mono text-[11px] text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {item.startFormatted}
                              </div>
                            </td>

                            {/* Prazo Final */}
                            <td className="px-3 py-3.5 font-mono text-[11px]">
                              <div className={`flex items-center gap-1.5 font-bold ${
                                isDelayed ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'
                              }`}>
                                <Clock className="w-3 h-3 text-slate-500" />
                                {item.endFormatted}
                              </div>
                            </td>

                            {/* Diagnóstico do Prazo */}
                            <td className="px-3 py-3.5">
                              <div className="flex flex-col">
                                {isCompleted ? (
                                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Finalizado
                                  </span>
                                ) : isDelayed ? (
                                  <div className="flex flex-col">
                                    <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 shrink-0" />
                                      {deadlineInfo.daysRemaining !== null 
                                        ? `Atrasado há ${Math.abs(deadlineInfo.daysRemaining)} dia(s)`
                                        : 'Vencido'}
                                    </span>
                                    <span className="text-[9px] text-rose-400/70 font-mono">
                                      Venceu em {item.endFormatted}
                                    </span>
                                  </div>
                                ) : isWarning ? (
                                  <div className="flex flex-col">
                                    <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      {deadlineInfo.daysRemaining === 0 
                                        ? 'Vence hoje!' 
                                        : `Vence em ${deadlineInfo.daysRemaining} dia(s)`}
                                    </span>
                                    <span className="text-[9px] text-amber-400/70 font-mono">
                                      Atenção ao cronograma
                                    </span>
                                  </div>
                                ) : deadlineInfo.daysRemaining !== null ? (
                                  <span className="text-sky-400 font-medium text-[11px] flex items-center gap-1">
                                    <Clock className="w-3 h-3 shrink-0 text-slate-500" />
                                    Restam {deadlineInfo.daysRemaining} dias
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">
                                    Sem prazo estipulado
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Avanço */}
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={`h-full ${
                                      isCompleted 
                                        ? 'bg-emerald-400' 
                                        : isDelayed 
                                          ? 'bg-rose-500' 
                                          : isWarning 
                                            ? 'bg-amber-400' 
                                            : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className={`font-mono font-bold text-[11px] ${
                                  isCompleted ? 'text-emerald-400' : isDelayed ? 'text-rose-400' : 'text-slate-200'
                                }`}>
                                  {progress}%
                                </span>
                              </div>
                            </td>

                            {/* Quantidade & Prioridade */}
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                {node.data?.quantity !== undefined ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/20">
                                    {node.data.quantity} un
                                  </span>
                                ) : (
                                  <span className="text-slate-600">---</span>
                                )}
                                {node.data?.priority && (
                                  <span className={`font-semibold uppercase px-1.5 py-0.5 rounded ${
                                    node.data.priority === 'Urgente' || node.data.priority === 'Alta'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {node.data.priority}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Responsável */}
                            <td className="px-3 py-3.5 text-slate-100 font-bold text-[11px] truncate max-w-[120px]" title={item.responsible}>
                              {item.responsible}
                            </td>

                            {/* Colaboradores & Funções */}
                            <td className="px-3 py-3.5">
                              {item.assignedEmployees.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {item.assignedEmployees.map(emp => (
                                    <div key={emp.id} className="flex flex-col border-l-2 border-blue-500/30 pl-2">
                                      <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1 truncate max-w-[150px]">
                                        <User className="w-3 h-3" />
                                        {emp.name}
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]" title={emp.data?.role || 'S/ Função'}>
                                        {emp.data?.role || 'S/ Função'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px] italic">Sem atribuição</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* MODO CARDS DE QUADROS */
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto">
                  {filteredAndSortedNodes.map((item) => {
                    const { node, progress, deadlineInfo, isBottleneck, isCompleted, isDelayed, isWarning } = item;

                    return (
                      <div 
                        key={node.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isDelayed 
                            ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-900/50' 
                            : isWarning 
                              ? 'bg-amber-950/35 border-amber-500/40 hover:bg-amber-900/45' 
                              : isCompleted 
                                ? 'bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-900/40' 
                                : item.isInProgress
                                  ? 'bg-blue-950/30 border-blue-500/30 hover:bg-blue-900/40'
                                  : item.interruptionInfo.isInterrupted || isBottleneck
                                    ? 'bg-purple-950/35 border-purple-500/40 hover:bg-purple-900/45'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Cabeçalho do Card */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                                  {node.type}
                                </span>
                                {detailLevel === 'detailed' && node.data?.code && (
                                  <span className="text-[9px] font-mono text-slate-500">#{node.data.code}</span>
                                )}
                              </div>
                              <h5 className="font-bold text-sm text-slate-100 mt-1 leading-snug">
                                {item.quadroName || node.name}
                              </h5>
                            </div>

                            {/* Status badge */}
                            {isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase shrink-0">
                                Concluído
                              </span>
                            ) : isDelayed ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase shrink-0 animate-pulse">
                                Atrasado
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase shrink-0">
                                Em Alerta
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 uppercase shrink-0">
                                {node.status || 'Em Aberto'}
                              </span>
                            )}
                          </div>

                          {/* Pedido, Setor e Responsável */}
                          <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-mono mb-2.5 pb-2 border-b border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="truncate">Ped. Venda: <b className="text-emerald-300 font-bold">{item.salesOrder}</b></span>
                              <span className="truncate">Setor: <b className="text-slate-200">{item.sectorName}</b></span>
                            </div>
                            <span className="truncate">Resp: <b className="text-slate-100 font-bold">{item.responsible}</b></span>
                          </div>

                          {/* Bloco de Prazos */}
                          {detailLevel === 'detailed' ? (
                            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[10px] font-mono mb-2.5">
                              <div>
                                <span className="text-slate-500 block uppercase text-[8px]">Início</span>
                                <span className="text-slate-200 font-semibold">{item.startFormatted}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase text-[8px]">Prazo Final</span>
                                <span className={`font-bold ${isDelayed ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'}`}>
                                  {item.endFormatted}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono mb-2.5">
                              <span className="text-slate-400 text-[9px]">Prazo Final</span>
                              <span className={`font-bold ${isDelayed ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'}`}>
                                {item.endFormatted}
                              </span>
                            </div>
                          )}

                          {/* Diagnóstico do Prazo */}
                          <div className="mb-2.5 text-[11px]">
                            {isCompleted ? (
                              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Entregue com sucesso
                              </div>
                            ) : isDelayed ? (
                              <div className="text-rose-400 font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {deadlineInfo.daysRemaining !== null 
                                  ? `Atrasado há ${Math.abs(deadlineInfo.daysRemaining)} dia(s)` 
                                  : 'Prazo estourado'}
                              </div>
                            ) : isWarning ? (
                              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {deadlineInfo.daysRemaining === 0 
                                  ? 'Vence hoje!' 
                                  : `Vence em ${deadlineInfo.daysRemaining} dia(s)`}
                              </div>
                            ) : deadlineInfo.daysRemaining !== null ? (
                              <div className="text-sky-400 font-medium flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                Restam {deadlineInfo.daysRemaining} dias no prazo
                              </div>
                            ) : (
                              <div className="text-slate-500 italic">Sem prazo estipulado</div>
                            )}
                          </div>

                          {/* Informações Extras no Modo Detalhado */}
                          {detailLevel === 'detailed' && (node.data?.quantity !== undefined || node.data?.priority) && (
                            <div className="flex items-center gap-2 mb-2.5 text-[10px] font-mono">
                              {node.data?.quantity !== undefined && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-400 font-semibold border border-white/5">
                                  Qtd: {node.data.quantity} un
                                </span>
                              )}
                              {node.data?.priority && (
                                <span className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                                  node.data.priority === 'Urgente' || node.data.priority === 'Alta'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {node.data.priority}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Layout Detalhado sobre a Ligação / Interrupção no Card */}
                          {item.interruptionInfo.isInterrupted && (
                            <div className="mb-2.5 p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[11px] space-y-1.5 shadow-sm">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase text-[9px] tracking-wide">
                                  {item.node.type === 'interrupted_flow' ? '🔴 Ligação Bloqueada' : '⚠️ Trava de Linha'}
                                </span>
                                {item.interruptionInfo.connectionSummary && (
                                  <span className="text-rose-200 font-medium text-[10px] flex items-center gap-1">
                                    <Workflow className="w-3 h-3 text-rose-400 shrink-0" />
                                    {item.interruptionInfo.connectionSummary}
                                  </span>
                                )}
                              </div>
                              {item.interruptionInfo.incidentDescription && (
                                <div className="text-slate-200 bg-black/30 p-1.5 rounded border border-white/5 font-mono text-[10px] leading-relaxed">
                                  <span className="text-rose-400 font-bold">Motivo: </span>
                                  {item.interruptionInfo.incidentDescription}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-300 font-mono">
                                {item.interruptionInfo.incidentResponsible && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 text-blue-400" />
                                    Resp: <strong className="text-white">{item.interruptionInfo.incidentResponsible}</strong>
                                  </span>
                                )}
                                {item.interruptionInfo.incidentDate && item.interruptionInfo.incidentDate !== '---' && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-amber-300 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                                    Ocorrido: <strong>{item.interruptionInfo.incidentDate}</strong>
                                  </span>
                                )}
                                {item.interruptionInfo.incidentResolutionDate && item.interruptionInfo.incidentResolutionDate !== '---' && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-emerald-300 flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                                    Previsão: <strong>{item.interruptionInfo.incidentResolutionDate}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Barra de Progresso */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="text-slate-400">Progresso</span>
                            <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                isCompleted 
                                  ? 'bg-emerald-400' 
                                  : isDelayed 
                                    ? 'bg-rose-500' 
                                    : isWarning 
                                      ? 'bg-amber-400' 
                                      : 'bg-blue-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rodapé da Tabela com Resumo */}
              <div className="p-3 bg-slate-900/90 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Exibindo <b>{filteredAndSortedNodes.length}</b> de <b>{detailedNodes.length}</b> quadros do setor
                </span>
                <div className="flex items-center gap-4 font-mono text-[10px]">
                  <span className="text-emerald-400">✓ {stats.completed} Concluídos</span>
                  <span className="text-blue-400">🔄 {stats.inProgress} Em Curso</span>
                  <span className="text-amber-400">⚠️ {stats.warning} Alertas</span>
                  <span className="text-rose-400">🚨 {stats.delayed} Atrasados</span>
                </div>
              </div>
            </div>

            {/* Diagnóstico Executivo & Recomendações Automáticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Diagnóstico Executivo do Setor
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O setor <span className="text-white font-bold">{currentSectorNode?.name || 'Geral'}</span> possui{' '}
                  <span className="text-emerald-400 font-bold">{stats.total} quadros operacionais</span> com taxa de entrega no prazo de{' '}
                  <span className="text-emerald-400 font-bold">{stats.onTimeRate}%</span>. 
                  {stats.delayed > 0 ? (
                    ` Foram detectados ${stats.delayed} quadros com prazo vencido que necessitam de intervenção imediata para readequação do lead time.`
                  ) : stats.warning > 0 ? (
                    ` Há ${stats.warning} quadros com vencimento iminente (próximos 3 dias) ou ritmo lento em relação ao prazo final.`
                  ) : (
                    ' Todas as entregas programadas estão dentro da janela de conformidade e ritmo adequado.'
                  )}
                  {stats.bottlenecks > 0 && ` Existem ${stats.bottlenecks} gargalos bloqueando fluxos sequenciais no setor.`}
                </p>
              </div>

              <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Plano de Ação Recomendado
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {stats.delayed > 0 && (
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Repriorizar os <b>{stats.delayed} quadros em atraso</b> realocando capacidade de outros postos.</span>
                    </li>
                  )}
                  {stats.warning > 0 && (
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Monitorar os <b>{stats.warning} quadros em alerta</b> que vencem nas próximas 72 horas.</span>
                    </li>
                  )}
                  {stats.bottlenecks > 0 && (
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>Desobstruir os <b>{stats.bottlenecks} gargalos</b> para normalizar a vazão entre processos.</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Concluir as tarefas com avanço superior a 80% para liberação de postos de trabalho.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
          
          {/* Footer */}
          <div className="p-3 bg-slate-950/70 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>MONITORAMENTO EM TEMPO REAL • BASEADO EM PRAZOS E STATUS</span>
            <span>AI STUDIO BUILD • INDÚSTRIA 4.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
