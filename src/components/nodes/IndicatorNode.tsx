import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { TrendingUp, TrendingDown, Activity, Link2 } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';
import { getUpstreamNodesForIndicator, calculateNodeProgress } from '../../utils/nodeProgress';

interface IndicatorNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  allNodes?: CanvasNode[];
  connections?: Array<{ fromId: string; toId: string }>;
}

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export const IndicatorNode: React.FC<IndicatorNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
  allNodes = [],
  connections = [],
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Indicador (KPI)');

  // Encontra os blocos conectados ou posicionados acima deste indicador
  const upstreamNodes = getUpstreamNodesForIndicator(node, allNodes, connections);
  const hasUpstream = upstreamNodes.length > 0;

  // Calcula valores dinamicamente caso existam módulos acima
  let displayKPIValue = '';
  let displayKPILabel = 'Indicador Manual';
  let displayTrend = node.data.kpiTrend || '+18.4%';
  let displayTrendType = node.data.kpiTrendType || 'up';
  let displayUnit = node.data.kpiUnit || 'vs mês ant.';

  if (hasUpstream) {
    // 1. Verificar se há valores financeiros de faturamento/orçamento/gastos nos blocos acima
    const totalFinancial = upstreamNodes.reduce((acc, u) => {
      const val = u.data?.orderValue || u.data?.invoiceValue || u.data?.budget || 0;
      return acc + val;
    }, 0);

    if (totalFinancial > 0) {
      displayKPIValue = formatCompactCurrency(totalFinancial);
      displayKPILabel = 'Financeiro Acumulado';
      
      const completedFinancial = upstreamNodes.reduce((acc, u) => {
        if (u.status === 'Concluído' || u.status === 'Aprovado') {
          return acc + (u.data?.orderValue || u.data?.invoiceValue || u.data?.budget || 0);
        }
        return acc;
      }, 0);
      const ratio = totalFinancial > 0 ? (completedFinancial / totalFinancial) * 100 : 0;
      displayTrend = `${ratio.toFixed(0)}% concluído`;
      displayTrendType = ratio > 50 ? 'up' : 'down';
      displayUnit = `${upstreamNodes.length} blocos`;
    } else {
      // 2. Caso contrário, calcula a média de progresso dos quadros
      const totalProgress = upstreamNodes.reduce((acc, u) => {
        return acc + calculateNodeProgress(u, allNodes, connections);
      }, 0);
      const avgProgress = Math.round(totalProgress / upstreamNodes.length);
      displayKPIValue = `${avgProgress}%`;
      displayKPILabel = 'Progresso Médio';

      const doneCount = upstreamNodes.filter(u => u.status === 'Concluído').length;
      displayTrend = `${doneCount} de ${upstreamNodes.length} concluídos`;
      displayTrendType = avgProgress > 60 ? 'up' : 'down';
      displayUnit = 'Progresso Geral';
    }
  } else {
    displayKPIValue = (node.data.kpiValue !== undefined && node.data.kpiValue !== null) ? node.data.kpiValue : 'R$ 4.8M';
    displayTrend = node.data.kpiTrend || '+18.4%';
    displayTrendType = node.data.kpiTrendType || 'up';
    displayUnit = node.data.kpiUnit || 'vs mês ant.';
  }

  const theme = getNodeColorTheme(node.color);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`indicator-node-${node.id}`}
      className={`p-4 rounded-xl bg-gradient-to-br ${theme.bgGradient} border ${theme.borderNormal} backdrop-blur-md shadow-xl flex flex-col justify-between w-full h-full text-slate-100`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1.5 ${theme.iconBg} rounded-lg ${theme.iconText} border ${theme.iconBorder} shrink-0`}>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[9px] font-bold ${theme.textAccent} uppercase tracking-wider block`}>
                {displayKPILabel}
              </span>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                  }}
                  className="bg-slate-950 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-xs text-white truncate cursor-pointer hover:underline hover:text-blue-300 transition-colors"
                  title="Clique para editar o nome do indicador"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <div className="font-mono font-bold text-2xl tracking-tight text-white">
            {displayKPIValue}
          </div>
          {hasUpstream && (
            <span className="text-[10px] bg-slate-950/60 text-slate-400 font-mono border border-white/5 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5 text-sky-400" />
              Conectado ({upstreamNodes.length})
            </span>
          )}
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} allNodes={allNodes} connections={connections} onUpdateData={onUpdateData} className="my-2" />

        {/* Monitored Upstream Modules List */}
        {hasUpstream && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block font-bold">
              MÓDULOS MONITORADOS:
            </span>
            <div className="max-h-[110px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              {upstreamNodes.map((u) => {
                const uProg = calculateNodeProgress(u, allNodes, connections);
                const uTheme = getNodeColorTheme(u.color);
                const hasVal = u.data?.orderValue !== undefined || u.data?.invoiceValue !== undefined || u.data?.budget !== undefined;
                const valFormatted = hasVal ? formatCompactCurrency(u.data?.orderValue || u.data?.invoiceValue || u.data?.budget || 0) : null;
                
                // Mapeia tipos legíveis
                let typeLabel: string = u.type;
                if (u.type === 'project') typeLabel = 'Projeto';
                else if (u.type === 'kanban') typeLabel = 'Kanban';
                else if (u.type === 'checklist') typeLabel = 'Checklist';
                else if (u.type === 'order') typeLabel = 'Proposta';
                else if (u.type === 'invoice') typeLabel = 'Faturamento';
                else if (u.type === 'financial_module') typeLabel = 'Financeiro';
                else if (u.type === 'customer') typeLabel = 'Cliente';

                return (
                  <div key={u.id} className="flex items-center justify-between text-[10px] bg-slate-950/40 border border-white/5 p-1 px-1.5 rounded hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: uTheme.textAccent || '#38bdf8' }} />
                      <span className="text-slate-300 truncate" title={`${typeLabel}: ${u.name}`}>
                        <span className="text-slate-500 font-medium mr-1">{typeLabel}:</span>
                        {u.name || 'Sem nome'}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono shrink-0 ml-1.5 font-semibold">
                      {valFormatted || `${uProg}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono mt-1">
        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
          {displayTrendType === 'up' ? (
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-400" />
          )}
          <span className={displayTrendType === 'up' ? 'text-emerald-400' : 'text-rose-400'}>{displayTrend}</span>
        </div>
        <span className="text-slate-500 text-[10px]">{displayUnit}</span>
      </div>
    </div>
  );
};
