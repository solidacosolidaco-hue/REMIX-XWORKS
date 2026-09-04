import { CanvasNode } from '../types/canvas';

export type NodeDeadlineState = 'delayed' | 'warning' | 'completed' | 'on_track' | 'none';

export interface NodeDeadlineInfo {
  state: NodeDeadlineState;
  label: string;
  badgeText: string;
  daysRemaining: number | null;
  totalDays: number | null;
  timeElapsedPercent: number;
  reason: string;
}

/**
 * Parses dates in YYYY-MM-DD or DD/MM/YYYY format safely.
 */
export function parseDateString(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2].slice(0, 2), 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculates deadline and delay state for any CanvasNode.
 * 
 * Returns:
 * - 'delayed': Overdue, past deadline, late step/task, or explicitly marked 'Atrasado'.
 * - 'warning': 0 to 3 days remaining, pace warning (time nearly over but progress low), or marked 'Em Risco'.
 * - 'completed': 100% progress or status 'Concluído' / 'Entregue'.
 * - 'on_track': Within schedule with healthy progress.
 * - 'none': Node has no date or operational deadline tracking.
 */
export function getNodeDeadlineInfo(
  node: CanvasNode,
  simulatedDate: string = '2026-09-02'
): NodeDeadlineInfo {
  // Quadro Base ou Informativo (ex: Cliente, Anexo, Documento, Nota, Texto) não possui cronograma nem alerta de prazo
  if (['customer', 'attachment', 'document', 'note', 'text'].includes(node.type)) {
    return {
      state: 'none',
      label: 'Quadro Base',
      badgeText: '',
      daysRemaining: null,
      totalDays: null,
      timeElapsedPercent: 0,
      reason: 'Quadro base/informativo sem cronograma operacional',
    };
  }

  const currentObj = parseDateString(simulatedDate) || new Date();
  currentObj.setHours(0, 0, 0, 0);

  // 1. Check if node is completed
  const progressVal =
    node.data.progressPercent ??
    node.data.projectProgress ??
    node.data.orderProgress ??
    node.data.overallRouteProgress ??
    0;

  const isExplicitlyCompleted =
    node.status === 'Concluído' ||
    (node.status as string) === 'Entregue' ||
    (node.data as any).status === 'Concluído' ||
    (node.data as any).status === 'Entregue' ||
    progressVal >= 100;

  if (isExplicitlyCompleted) {
    return {
      state: 'completed',
      label: 'Concluído',
      badgeText: '✓ CONCLUÍDO',
      daysRemaining: 0,
      totalDays: null,
      timeElapsedPercent: 100,
      reason: 'Atividade finalizada com sucesso',
    };
  }

  // 2. Check for explicit late / risk status in node properties
  const isExplicitlyLate =
    node.status === 'Atrasado' ||
    (node.data as any).status === 'Atrasado' ||
    (node.data as any).delayAlert === true;

  if (isExplicitlyLate) {
    return {
      state: 'delayed',
      label: 'Atrasado',
      badgeText: '🚨 ATRASADO',
      daysRemaining: -1,
      totalDays: null,
      timeElapsedPercent: 100,
      reason: 'Status marcado expressamente como Atrasado',
    };
  }

  // 3. Inspect internal steps (for production_route)
  if (node.type === 'production_route' && node.data.steps && node.data.steps.length > 0) {
    const steps = node.data.steps;
    
    // Check if any step is explicitly marked late
    const hasLateStep = steps.some((st) => {
      if (st.status === 'Concluído') return false;
      if (st.status === 'Atrasado') return true;
      if (st.deadline) {
        const stepDueDate = parseDateString(st.deadline);
        if (stepDueDate && stepDueDate.getTime() < currentObj.getTime()) {
          return true;
        }
      }
      return false;
    });

    if (hasLateStep) {
      return {
        state: 'delayed',
        label: 'Atrasado na Etapa',
        badgeText: '🚨 OPERAÇÃO ATRASADA',
        daysRemaining: -1,
        totalDays: null,
        timeElapsedPercent: 100,
        reason: 'Uma ou mais etapas do roteiro ultrapassaram o prazo',
      };
    }

    // Check if any step is warning (0 to 2 days)
    const hasWarningStep = steps.some((st) => {
      if (st.status === 'Concluído') return false;
      if (st.deadline) {
        const stepDueDate = parseDateString(st.deadline);
        if (stepDueDate) {
          const diff = Math.ceil((stepDueDate.getTime() - currentObj.getTime()) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 2;
        }
      }
      return false;
    });

    if (hasWarningStep) {
      return {
        state: 'warning',
        label: 'Prazo Próximo na Etapa',
        badgeText: '⚠️ ETAPA EM ALERTA',
        daysRemaining: 1,
        totalDays: null,
        timeElapsedPercent: 75,
        reason: 'Etapa de fabricação próxima da data limite',
      };
    }
  }

  // 4. Resolve Node Start Date & End Date / Deadline
  const rawStartDate =
    node.data.startDate ||
    node.data.prazoInicial ||
    node.data.dataInicio ||
    node.data.initialDate ||
    node.data.incidentDate ||
    (node.createdAt && node.createdAt.includes('-') ? node.createdAt.slice(0, 10) : undefined);

  const rawDeadline =
    node.data.deliveryDeadline ||
    node.data.dueDate ||
    node.data.deadline ||
    node.data.endDate ||
    node.data.prazoFinal ||
    node.data.deadlineDate ||
    node.data.dataFinal ||
    node.data.dataLimite ||
    node.data.dataEntrega ||
    node.data.prazo ||
    node.data.incidentResolutionDate ||
    (node.type === 'deadline' ? (node.data as any).targetDate : undefined);

  const startObj = parseDateString(rawStartDate);
  const endObj = parseDateString(rawDeadline);

  if (!endObj) {
    // If no deadline is set, check if status is 'Em Risco' or 'Alerta'
    const isWarnStatus =
      (node.status as string) === 'Em Risco' ||
      (node.status as string) === 'Alerta' ||
      (node.data as any).status === 'Em Risco' ||
      (node.data as any).status === 'Alerta';

    if (isWarnStatus) {
      return {
        state: 'warning',
        label: 'Risco de Atraso',
        badgeText: '⚠️ EM RISCO',
        daysRemaining: null,
        totalDays: null,
        timeElapsedPercent: 0,
        reason: 'Sinalizado com risco de atraso operacional',
      };
    }

    return {
      state: 'none',
      label: 'Sem Prazo',
      badgeText: '',
      daysRemaining: null,
      totalDays: null,
      timeElapsedPercent: 0,
      reason: 'Sem data de prazo configurada',
    };
  }

  // End date is set - compute exact timeline
  endObj.setHours(0, 0, 0, 0);

  const effectiveStart = startObj ? startObj : new Date(endObj.getTime() - 20 * 86400000);
  effectiveStart.setHours(0, 0, 0, 0);

  const totalDurationMs = Math.max(86400000, endObj.getTime() - effectiveStart.getTime());
  const elapsedMs = currentObj.getTime() - effectiveStart.getTime();
  const totalDays = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));
  
  const remainingTimeMs = endObj.getTime() - currentObj.getTime();
  const daysRemaining = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));
  const timeElapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  // Case A: OVERDUE (ATRASADO) - daysRemaining < 0
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      state: 'delayed',
      label: `${overdueDays}d Atrasado`,
      badgeText: `🚨 ATRASADO (-${overdueDays}d)`,
      daysRemaining,
      totalDays,
      timeElapsedPercent: 100,
      reason: `Prazo final venceu há ${overdueDays} dia(s)`,
    };
  }

  // Case B: WARNING / COMEÇANDO A ATRASAR
  // Conditions:
  // - daysRemaining is 0 (due today) or <= 3 days
  // - OR pacing risk: elapsed > 65% of time, but progress < 25%
  // - OR pacing risk: elapsed > 85% of time, but progress < 50%
  // - OR explicitly 'Em Risco' or 'Alerta'
  const isImminent = daysRemaining <= 3;
  const isPacingLag = (timeElapsedPercent >= 65 && progressVal < 25) || (timeElapsedPercent >= 85 && progressVal < 50);
  const isExplicitRisk =
    (node.status as string) === 'Em Risco' ||
    (node.status as string) === 'Alerta' ||
    (node.data as any).status === 'Em Risco' ||
    (node.data as any).status === 'Alerta';

  if (isImminent || isPacingLag || isExplicitRisk) {
    let warningLabel = `${daysRemaining}d restantes`;
    let badge = `⚠️ PRAZO PRÓXIMO (${daysRemaining}d)`;
    let reason = `Prazo crítico: restam ${daysRemaining} dia(s)`;

    if (daysRemaining === 0) {
      warningLabel = 'Vence Hoje!';
      badge = '⚠️ VENCE HOJE!';
      reason = 'Data limite de entrega é hoje';
    } else if (isPacingLag && daysRemaining > 3) {
      warningLabel = 'Risco de Atraso';
      badge = `⚠️ RITMO LENTO (${progressVal}%)`;
      reason = `${timeElapsedPercent}% do tempo decorrido com apenas ${progressVal}% concluído`;
    }

    return {
      state: 'warning',
      label: warningLabel,
      badgeText: badge,
      daysRemaining,
      totalDays,
      timeElapsedPercent,
      reason,
    };
  }

  // Case C: ON TRACK (EM DIA)
  return {
    state: 'on_track',
    label: `${daysRemaining}d restantes`,
    badgeText: `⏱️ ${daysRemaining}d no prazo`,
    daysRemaining,
    totalDays,
    timeElapsedPercent,
    reason: 'Dentro do cronograma previsto',
  };
}
