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
  Briefcase
} from 'lucide-react';
import { CanvasNode, Connection } from '../../types/canvas';
import { calculateNodeProgress, isNodeBottleneck } from '../../utils/nodeProgress';
import { getNodeDeadlineInfo, parseDateString, NodeDeadlineInfo } from '../../utils/nodeDeadline';
import { isNodeInsideGroup } from '../../utils/geometry';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SectorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorId: string | null;
  nodes: CanvasNode[];
  connections: Connection[];
}

type StatusFilterType = 'all' | 'delayed' | 'warning' | 'in_progress' | 'pending' | 'completed' | 'bottleneck';
type SortOptionType = 'deadline_asc' | 'deadline_desc' | 'status_urgency' | 'progress_desc' | 'progress_asc' | 'name_asc';
type ViewModeType = 'table' | 'cards';
type DetailLevelType = 'simplified' | 'detailed';

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '---';
  const d = parseDateString(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('pt-BR');
}

function getNodeSectorName(node: CanvasNode, sectorNodes: CanvasNode[]): string {
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

  return 'Geral';
}

export const SectorReportModal: React.FC<SectorReportModalProps> = ({
  isOpen,
  onClose,
  sectorId,
  nodes,
  connections,
}) => {
  // Sector switcher state inside modal
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(sectorId);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [sortBy, setSortBy] = useState<SortOptionType>('deadline_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewModeType>('table');
  const [detailLevel, setDetailLevel] = useState<DetailLevelType>('detailed');

  // Keep selected sector in sync when prop changes
  useEffect(() => {
    setSelectedSectorId(sectorId);
  }, [sectorId]);

  // List of all sector & group containers on canvas
  const availableSectors = useMemo(() => {
    return nodes.filter(n => n.type === 'sector' || n.type === 'group');
  }, [nodes]);

  const isGlobal = !selectedSectorId || selectedSectorId === 'all';
  const currentSectorNode = useMemo(() => {
    if (isGlobal) return null;
    return nodes.find(n => n.id === selectedSectorId) || null;
  }, [nodes, selectedSectorId, isGlobal]);

  // Find all nodes that logically and spatially belong to this sector
  const relatedNodes = useMemo(() => {
    const operationalNodes = nodes.filter(
      n => n.type !== 'text' && n.type !== 'note' && n.type !== 'group' && n.type !== 'sector'
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
        (currentSectorNode.name && (d.sector === currentSectorNode.name || d.setor === currentSectorNode.name)) ||
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

    // 4. Direct connections to/from this sector node
    connections.forEach(c => {
      if (c.fromId === selectedSectorId) {
        matchedIds.add(c.toId);
      }
      if (c.toId === selectedSectorId) {
        matchedIds.add(c.fromId);
      }
    });

    // 5. Downstream connections from already matched nodes
    const queue = Array.from(matchedIds);
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      connections.forEach(c => {
        if (c.fromId === currId) {
          const target = operationalNodes.find(n => n.id === c.toId);
          if (target && !matchedIds.has(target.id)) {
            if (!target.groupId || target.groupId === selectedSectorId) {
              matchedIds.add(target.id);
            }
          }
        }
      });
    }

    const filtered = operationalNodes.filter(n => matchedIds.has(n.id));

    // Fallback: If 0 boards are bound to this frame but workspace has nodes,
    // show operational nodes if there are no other sectors
    if (filtered.length === 0 && availableSectors.length <= 1) {
      return operationalNodes;
    }

    return filtered;
  }, [nodes, connections, selectedSectorId, currentSectorNode, isGlobal, availableSectors]);

  // Detailed records with deadlines and progress calculated
  const detailedNodes = useMemo(() => {
    return relatedNodes.map(node => {
      const progress = calculateNodeProgress(node, nodes, connections);
      const deadlineInfo = getNodeDeadlineInfo(node);
      const isBottleneck = isNodeBottleneck(node, nodes, connections);

      const rawStart =
        node.data?.startDate ||
        node.data?.prazoInicial ||
        node.data?.dataInicio ||
        node.data?.initialDate ||
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
        (node.type === 'deadline' ? (node.data as any).targetDate : undefined);

      const isCompleted =
        progress === 100 ||
        node.status === 'Concluído' ||
        (node.status as string) === 'Entregue' ||
        (node.data as any)?.status === 'Concluído' ||
        (node.data as any)?.status === 'Entregue' ||
        deadlineInfo.state === 'completed';

      const isDelayed = !isCompleted && (deadlineInfo.state === 'delayed' || node.status === 'Atrasado');
      const isWarning = !isCompleted && !isDelayed && (deadlineInfo.state === 'warning' || (deadlineInfo.daysRemaining !== null && deadlineInfo.daysRemaining >= 0 && deadlineInfo.daysRemaining <= 3));
      const isInProgress = !isCompleted && !isDelayed && (progress > 0 || node.status === 'Em Andamento');
      const isPending = !isCompleted && !isDelayed && !isWarning && !isInProgress;

      const sectorName = getNodeSectorName(node, availableSectors);

      return {
        node,
        progress,
        deadlineInfo,
        isBottleneck,
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
      };
    });
  }, [relatedNodes, nodes, connections, availableSectors]);

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
      ? nodes.filter(n => n.type === 'employee').length 
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
        const name = d.node.name?.toLowerCase() || '';
        const type = d.node.type?.toLowerCase() || '';
        const sector = d.sectorName?.toLowerCase() || '';
        const resp = (d.node.data?.responsible || d.node.data?.supervisorName || '').toLowerCase();
        const code = (d.node.data?.code || d.node.data?.sectorCode || d.node.data?.opNumber || '').toLowerCase();
        return name.includes(q) || type.includes(q) || sector.includes(q) || resp.includes(q) || code.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
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
        return a.node.name.localeCompare(b.node.name);
      }

      return 0;
    });

    return result;
  }, [detailedNodes, statusFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Nome do Quadro',
      'Tipo de Bloco',
      'Setor',
      'Status Operacional',
      'Prazo Inicial',
      'Prazo Final',
      'Dias Restantes',
      'Diagnóstico de Prazo',
      'Avanço (%)',
      'Responsável',
      'Prioridade',
      'Gargalo',
      'Quantidade',
      'Valor (R$)'
    ];

    const rows = filteredAndSortedNodes.map(item => [
      `"${(item.node.name || '').replace(/"/g, '""')}"`,
      `"${item.node.type}"`,
      `"${item.sectorName}"`,
      `"${item.isCompleted ? 'Concluído' : item.isDelayed ? 'Atrasado' : item.isWarning ? 'Em Alerta' : item.isInProgress ? 'Em Andamento' : 'Pendente'}"`,
      `"${item.startFormatted}"`,
      `"${item.endFormatted}"`,
      `"${item.deadlineInfo.daysRemaining ?? ''}"`,
      `"${(item.deadlineInfo.badgeText || item.deadlineInfo.reason || '').replace(/"/g, '""')}"`,
      `"${item.progress}%"`,
      `"${(item.node.data?.responsible || item.node.data?.supervisorName || 'Equipe').replace(/"/g, '""')}"`,
      `"${item.node.data?.priority || 'Normal'}"`,
      `"${item.isBottleneck ? 'Sim' : 'Não'}"`,
      `"${item.node.data?.quantity || ''}"`,
      `"${item.node.data?.totalOrderValue || item.node.data?.amount || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `relatorio_setor_${(currentSectorNode?.name || 'geral').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
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

      const sectorTitle = isGlobal ? 'Relatório Executivo Geral de Setores' : `Relatório do Setor: ${currentSectorNode?.name || 'Setor'}`;
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
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text(sectorTitle, 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`CÓDIGO: ${sectorCode}   |   EMISSÃO: ${emissionDate} às ${emissionTime}   |   CONFORMIDADE DE PRAZO: ${stats.onTimeRate}%`, 14, 20);

      // Right header badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.text(`${stats.total} Quadros Monitorados`, 283, 15, { align: 'right' });

      // KPI Summary cards
      const kpis = [
        { label: 'TOTAL QUADROS', value: `${stats.total}`, color: [15, 23, 42] },
        { label: 'CONCLUÍDOS', value: `${stats.completed} (${stats.total > 0 ? Math.round((stats.completed/stats.total)*100) : 0}%)`, color: [16, 185, 129] },
        { label: 'EM ANDAMENTO', value: `${stats.inProgress}`, color: [59, 130, 246] },
        { label: 'EM ALERTA (<=3d)', value: `${stats.warning}`, color: [245, 158, 11] },
        { label: 'ATRASADOS', value: `${stats.delayed}`, color: [225, 29, 72] },
        { label: 'PROGRESSO MÉDIO', value: `${stats.averageProgress}%`, color: [13, 148, 136] },
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

      // Table Data (Simplified vs Detailed)
      const isSimplifiedPDF = detailLevel === 'simplified';

      const tableHeaders = isSimplifiedPDF
        ? [['Quadro / Atividade', 'Setor', 'Status', 'Prazo Final', 'Avanço', 'Responsável']]
        : [['Quadro / Atividade', 'Tipo / Código', 'Setor', 'Status Operacional', 'Início', 'Prazo Final', 'Restante', 'Diagnóstico do Prazo', 'Avanço', 'Qtd / Prioridade', 'Responsável']];

      const tableRows = filteredAndSortedNodes.map(item => {
        const statusText = item.isCompleted 
          ? 'Concluído' 
          : item.isDelayed 
            ? 'Atrasado' 
            : item.isWarning 
              ? 'Em Alerta' 
              : item.isInProgress 
                ? 'Em Andamento' 
                : 'Pendente';

        const daysText = item.isCompleted 
          ? 'Finalizado' 
          : item.deadlineInfo.daysRemaining !== null 
            ? `${item.deadlineInfo.daysRemaining}d` 
            : '---';

        const extraInfo = [
          item.node.data?.quantity ? `${item.node.data.quantity} un` : '',
          item.node.data?.priority ? item.node.data.priority : ''
        ].filter(Boolean).join(' • ') || '---';

        const typeAndCode = [
          item.node.type || 'Quadro',
          item.node.data?.code ? `#${item.node.data.code}` : ''
        ].filter(Boolean).join(' ');

        if (isSimplifiedPDF) {
          return [
            item.node.name || 'Sem nome',
            item.sectorName || 'Geral',
            statusText,
            item.endFormatted || '---',
            `${item.progress}%`,
            item.node.data?.responsible || item.node.data?.supervisorName || 'Equipe'
          ];
        }

        return [
          item.node.name || 'Sem nome',
          typeAndCode,
          item.sectorName || 'Geral',
          statusText,
          item.startFormatted || '---',
          item.endFormatted || '---',
          daysText,
          item.deadlineInfo.badgeText || item.deadlineInfo.reason || (item.deadlineInfo.daysRemaining !== null ? `Restam ${item.deadlineInfo.daysRemaining}d` : 'Sem prazo'),
          `${item.progress}%`,
          extraInfo,
          item.node.data?.responsible || item.node.data?.supervisorName || 'Equipe'
        ];
      });

      const columnStylesConfig = isSimplifiedPDF
        ? {
            0: { cellWidth: 80, fontStyle: 'bold' as const },
            1: { cellWidth: 45 },
            2: { cellWidth: 38, fontStyle: 'bold' as const },
            3: { cellWidth: 32 },
            4: { cellWidth: 26, halign: 'center' as const, fontStyle: 'bold' as const },
            5: { cellWidth: 48 },
          }
        : {
            0: { cellWidth: 42, fontStyle: 'bold' as const },
            1: { cellWidth: 22 },
            2: { cellWidth: 24 },
            3: { cellWidth: 24, fontStyle: 'bold' as const },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 16, halign: 'center' as const },
            7: { cellWidth: 35 },
            8: { cellWidth: 16, halign: 'center' as const, fontStyle: 'bold' as const },
            9: { cellWidth: 26 },
            10: { cellWidth: 28 },
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
          fontSize: isSimplifiedPDF ? 8.5 : 7.5,
          halign: 'left',
          cellPadding: isSimplifiedPDF ? 3 : 2.2,
        },
        bodyStyles: {
          fontSize: isSimplifiedPDF ? 8 : 7,
          textColor: [30, 41, 59],
          cellPadding: isSimplifiedPDF ? 2.5 : 1.8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: columnStylesConfig,
        didParseCell: (data) => {
          if (data.section === 'body') {
            const statusColIdx = isSimplifiedPDF ? 2 : 3;
            const progressColIdx = isSimplifiedPDF ? 4 : 8;

            if (data.column.index === statusColIdx) {
              const val = String(data.cell.raw);
              if (val === 'Atrasado') {
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
              }
            }
            if (data.column.index === progressColIdx) {
              const pVal = parseInt(String(data.cell.raw)) || 0;
              if (pVal === 100) {
                data.cell.styles.textColor = [16, 185, 129];
              } else if (pVal > 0) {
                data.cell.styles.textColor = [37, 99, 235];
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
            `Página ${data.pageNumber} de ${pageCount}  •  Modo: ${isSimplifiedPDF ? 'Visão Simplificada (Essencial)' : 'Visão Detalhada (Completa)'}  •  Gestão de Prazos & Operações`,
            14,
            204
          );
          doc.text(
            `Exportado em ${emissionDate} ${emissionTime}`,
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
          <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isGlobal ? 'Relatório Executivo Geral de Setores' : `Relatório do Setor: ${currentSectorNode?.name}`}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {stats.total} Quadros
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs font-mono mt-0.5">
                  <span>CÓDIGO: {currentSectorNode?.data?.sectorCode || 'ST-GERAL'}</span>
                  <span>•</span>
                  <span>DATA: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{stats.onTimeRate}% no prazo</span>
                </div>
              </div>
            </div>

            {/* Sector Selector & Actions */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Sector Dropdown */}
              <div className="relative">
                <select
                  value={selectedSectorId || 'all'}
                  onChange={(e) => setSelectedSectorId(e.target.value === 'all' ? null : e.target.value)}
                  className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer pr-8"
                >
                  <option value="all">🌐 Todos os Setores (Consolidado)</option>
                  {availableSectors.map(s => (
                    <option key={s.id} value={s.id}>
                      📁 {s.name} ({s.data?.sectorCode || 'Setor'})
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
                      <option value="deadline_asc">Prazo: Mais Urgentes</option>
                      <option value="deadline_desc">Prazo: Mais Distantes</option>
                      <option value="status_urgency">Status: Mais Críticos</option>
                      <option value="progress_desc">Avanço: Maior %</option>
                      <option value="progress_asc">Avanço: Menor %</option>
                      <option value="name_asc">Nome: A-Z</option>
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

                  {/* Toggle Tabela / Cards */}
                  <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      title="Visualização em Tabela"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
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
                      Ver Todos os Quadros da Planta ({nodes.filter(n => n.type !== 'text' && n.type !== 'note' && n.type !== 'group' && n.type !== 'sector').length})
                    </button>
                  )}
                </div>
              ) : viewMode === 'table' ? (
                /* TABELA DE QUADROS (SIMPLIFICADA OU DETALHADA) */
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-white/10 z-10">
                      {detailLevel === 'simplified' ? (
                        <tr>
                          <th className="px-5 py-3">Quadro / Atividade</th>
                          <th className="px-4 py-3">Setor</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Prazo Final</th>
                          <th className="px-4 py-3">Avanço</th>
                          <th className="px-4 py-3">Responsável</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-5 py-3.5">Quadro / Atividade</th>
                          <th className="px-3 py-3.5">Setor</th>
                          <th className="px-3 py-3.5">Status Operacional</th>
                          <th className="px-3 py-3.5">Início</th>
                          <th className="px-3 py-3.5">Prazo Final</th>
                          <th className="px-3 py-3.5">Diagnóstico do Prazo</th>
                          <th className="px-3 py-3.5">Avanço Real</th>
                          <th className="px-3 py-3.5">Qtd / Prioridade</th>
                          <th className="px-3 py-3.5">Responsável</th>
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
                              className={`hover:bg-slate-800/40 transition-colors group ${
                                isDelayed ? 'bg-rose-500/[0.03]' : isWarning ? 'bg-amber-500/[0.02]' : ''
                              }`}
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                                    {node.name}
                                  </span>
                                  {isBottleneck && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono uppercase">
                                      Gargalo
                                    </span>
                                  )}
                                </div>
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

                              <td className="px-4 py-3 text-slate-300 text-[11px] truncate max-w-[140px]">
                                {node.data?.responsible || node.data?.supervisorName || node.data?.assignee || 'Equipe'}
                              </td>
                            </tr>
                          );
                        }

                        // Visão Detalhada da Linha
                        return (
                          <tr 
                            key={node.id} 
                            className={`hover:bg-slate-800/40 transition-colors group ${
                              isDelayed ? 'bg-rose-500/[0.03]' : isWarning ? 'bg-amber-500/[0.02]' : ''
                            }`}
                          >
                            {/* Nome e tipo do quadro */}
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                                  {node.name}
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
                              </div>
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
                            <td className="px-3 py-3.5 text-slate-300 text-[11px] font-medium truncate max-w-[120px]" title={node.data?.responsible || node.data?.supervisorName || 'Equipe'}>
                              {node.data?.responsible || node.data?.supervisorName || node.data?.assignee || 'Equipe'}
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
                            ? 'bg-rose-500/5 border-rose-500/30' 
                            : isWarning 
                              ? 'bg-amber-500/5 border-amber-500/30' 
                              : isCompleted 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
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
                                {node.name}
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

                          {/* Setor e Responsável */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2.5 pb-2 border-b border-white/5">
                            <span className="truncate">Setor: <b className="text-slate-200">{item.sectorName}</b></span>
                            <span className="truncate">Resp: <b className="text-slate-200">{node.data?.responsible || node.data?.supervisorName || 'Equipe'}</b></span>
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
