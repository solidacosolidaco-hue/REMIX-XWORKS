import React, { useState } from 'react';
import { 
  GitMerge, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Cpu, 
  User, 
  Layers, 
  ArrowRight,
  PlayCircle,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { CanvasNode, ProductionRouteStep } from '../../types/canvas';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface ProductionRouteNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ProductionRouteNode: React.FC<ProductionRouteNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Roteiro de Produção');
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepData, setEditStepData] = useState<ProductionRouteStep | null>(null);

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(node.data.productTarget || 'Produto / Peça Industrial');

  // New step form state
  const [newStepName, setNewStepName] = useState('');
  const [newStepMachine, setNewStepMachine] = useState('');
  const [newStepOperator, setNewStepOperator] = useState('');
  const [newStepStartDate, setNewStepStartDate] = useState(
    node.data.startDate || new Date().toISOString().split('T')[0]
  );
  const [newStepDeadline, setNewStepDeadline] = useState(
    node.data.dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );

  const routeCode = node.data.routeCode || `ROT-${node.id.slice(-4).toUpperCase()}`;
  const productTarget = node.data.productTarget || 'Produto / Peça Industrial';

  // Default steps if none are set
  const steps: ProductionRouteStep[] = node.data.steps && node.data.steps.length > 0
    ? node.data.steps
    : [
        {
          id: 'step-1',
          sequence: 1,
          name: 'Corte e Preparação da Matéria Prima',
          machineOrWorkcenter: 'Serra Fita / Prensas',
          operator: 'Carlos (RE-104)',
          startDate: node.data.startDate || '2026-09-02',
          deadline: '2026-09-04',
          estimatedHours: 6,
          status: 'Concluído',
        },
        {
          id: 'step-2',
          sequence: 2,
          name: 'Usinagem CNC e Torneamento',
          machineOrWorkcenter: 'Torno CNC Romi GL-240',
          operator: 'Marcos (RE-112)',
          startDate: '2026-09-05',
          deadline: '2026-09-09',
          estimatedHours: 14,
          status: 'Em Andamento',
        },
        {
          id: 'step-3',
          sequence: 3,
          name: 'Tratamento Térmico e Têmpera',
          machineOrWorkcenter: 'Forno de Indução Industrial',
          operator: 'Roberto (RE-108)',
          startDate: '2026-09-10',
          deadline: '2026-09-13',
          estimatedHours: 12,
          status: 'Pendente',
        },
        {
          id: 'step-4',
          sequence: 4,
          name: 'Montagem Final e Calibração',
          machineOrWorkcenter: 'Bancada de Montagem 02',
          operator: 'Equipe de Montagem',
          startDate: '2026-09-14',
          deadline: '2026-09-17',
          estimatedHours: 8,
          status: 'Pendente',
        },
        {
          id: 'step-5',
          sequence: 5,
          name: 'Controle de Qualidade e CQ Final',
          machineOrWorkcenter: 'Laboratório Metrológico',
          operator: 'Inspetor de Qualidade',
          startDate: '2026-09-18',
          deadline: node.data.dueDate || '2026-09-20',
          estimatedHours: 4,
          status: 'Pendente',
        },
      ];

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const handleTargetSubmit = () => {
    setIsEditingTarget(false);
    if (onUpdateData) {
      onUpdateData(node.id, { productTarget: targetInput.trim() || 'Produto / Peça Industrial' });
    }
  };

  const handleUpdateSteps = (newSteps: ProductionRouteStep[]) => {
    if (!onUpdateData) return;
    const completedCount = newSteps.filter((s) => s.status === 'Concluído').length;
    const calculatedProgress = newSteps.length > 0 ? Math.round((completedCount / newSteps.length) * 100) : 0;
    
    onUpdateData(node.id, {
      steps: newSteps,
      overallRouteProgress: calculatedProgress,
    });
  };

  const startEditingStep = (step: ProductionRouteStep) => {
    setEditingStepId(step.id);
    setEditStepData({ ...step });
  };

  const saveEditingStep = () => {
    if (!editStepData) return;
    const updated = steps.map((s) => (s.id === editStepData.id ? editStepData : s));
    handleUpdateSteps(updated);
    setEditingStepId(null);
    setEditStepData(null);
  };

  const handleToggleStepStatus = (stepId: string) => {
    const statusCycle: ('Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado')[] = [
      'Pendente',
      'Em Andamento',
      'Concluído',
      'Atrasado',
    ];

    const updated = steps.map((st) => {
      if (st.id === stepId) {
        const nextIndex = (statusCycle.indexOf(st.status) + 1) % statusCycle.length;
        const nextStatus = statusCycle[nextIndex];
        return {
          ...st,
          status: nextStatus,
          completedDate: nextStatus === 'Concluído' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return st;
    });

    handleUpdateSteps(updated);
  };

  const handleDeleteStep = (stepId: string) => {
    const updated = steps.filter((s) => s.id !== stepId);
    handleUpdateSteps(updated);
  };

  const handleAddNewStep = () => {
    if (!newStepName.trim()) return;

    const nextSeq = steps.length + 1;

    const newStepItem: ProductionRouteStep = {
      id: `step-${Date.now()}`,
      sequence: nextSeq,
      name: newStepName.trim(),
      machineOrWorkcenter: newStepMachine.trim() || 'Centro de Trabalho Geral',
      operator: newStepOperator.trim() || 'Operador Responsável',
      startDate: newStepStartDate,
      deadline: newStepDeadline,
      status: 'Pendente',
    };

    handleUpdateSteps([...steps, newStepItem]);
    setNewStepName('');
    setNewStepMachine('');
    setNewStepOperator('');
    setIsAddingStep(false);
  };

  // Helper calculation for step deadline status
  const getStepDeadlineInfo = (step: ProductionRouteStep) => {
    if (step.status === 'Concluído') {
      return { label: 'Concluído', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    
    if (!step.deadline) {
      return { label: 'Sem prazo', color: 'text-slate-400 bg-slate-800/40 border-slate-700/40' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(step.deadline + 'T00:00:00');
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)}d atraso`, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30 font-bold animate-pulse' };
    } else if (diffDays === 0) {
      return { label: 'Vence hoje!', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold' };
    } else if (diffDays <= 2) {
      return { label: `${diffDays}d restantes`, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
    } else {
      return { label: `${diffDays}d restantes`, color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' };
    }
  };

  const completedCount = steps.filter((s) => s.status === 'Concluído').length;
  const inProgressCount = steps.filter((s) => s.status === 'Em Andamento').length;
  const lateCount = steps.filter((s) => {
    if (s.status === 'Concluído') return false;
    if (s.status === 'Atrasado') return true;
    if (!s.deadline) return false;
    return new Date(s.deadline + 'T00:00:00') < new Date();
  }).length;

  return (
    <div className="flex flex-col justify-between p-4 w-full h-full bg-[#0D1221]/95 rounded-xl border border-cyan-500/35 shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-start pb-2.5 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block leading-none">
                  ROTEIRO DE PRODUÇÃO
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[9px] font-bold rounded">
                  {routeCode}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">PCP / Sequenciamento Operacional</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px] rounded flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              {steps.length} {steps.length === 1 ? 'etapa' : 'etapas'}
            </span>
          </div>
        </div>

        {/* Title & Linked Target */}
        <div className="mb-2">
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
              className="bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full mb-1"
            />
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              title="Clique para editar o título do roteiro"
            >
              <span>{node.name}</span>
            </h3>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/80 font-mono mt-0.5">
            <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
            {isEditingTarget ? (
              <input
                type="text"
                autoFocus
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onBlur={handleTargetSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTargetSubmit();
                }}
                className="bg-slate-950 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTarget(true);
                }}
                className="truncate cursor-pointer hover:underline hover:text-white"
                title="Clique para editar a Peça / Produto"
              >
                Peça/Produto: <strong className="text-white">{productTarget}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Prazo Geral Inicial e Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2.5" />

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-center">
          <div className="bg-slate-950/60 border border-white/5 p-1 rounded">
            <span className="text-[9px] text-slate-400 block font-mono">CONCLUÍDAS</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {completedCount} / {steps.length}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-white/5 p-1 rounded">
            <span className="text-[9px] text-slate-400 block font-mono">EM PROCESSO</span>
            <span className="text-xs font-bold text-blue-400 font-mono">
              {inProgressCount}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-white/5 p-1 rounded">
            <span className="text-[9px] text-slate-400 block font-mono">ATRASOS</span>
            <span className={`text-xs font-bold font-mono ${lateCount > 0 ? 'text-rose-400 font-black' : 'text-slate-400'}`}>
              {lateCount}
            </span>
          </div>
        </div>

        {/* Operations & Steps Sequencing Header */}
        <div className="flex items-center justify-between pb-1 mb-2 border-b border-white/5 text-xs">
          <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Etapas & Operações ({steps.length})
          </span>
          <button
            onClick={() => setIsAddingStep(!isAddingStep)}
            className="flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 transition-all cursor-pointer"
            title="Adicionar nova operação com datas ao roteiro"
          >
            <Plus className="w-3 h-3" />
            <span>Nova Etapa</span>
          </button>
        </div>

        {/* Inline Add Step Form */}
        {isAddingStep && (
          <div className="mb-3 p-2.5 bg-slate-950/90 border border-cyan-500/40 rounded-lg space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[10px] font-bold text-cyan-300 uppercase flex items-center justify-between">
              <span>Nova Operação do Roteiro</span>
              <span className="text-cyan-300 font-mono text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded border border-white/10">{steps.length + 1}</span>
            </div>

            <input
              type="text"
              placeholder="Nome da Operação (ex: Fresamento CNC 5 Eixos)"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Máquina / Centro de Trabalho"
                value={newStepMachine}
                onChange={(e) => setNewStepMachine(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
              <input
                type="text"
                placeholder="Operador / Técnico"
                value={newStepOperator}
                onChange={(e) => setNewStepOperator(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-slate-400 block mb-0.5">Data Início</label>
                <input
                  type="date"
                  value={newStepStartDate}
                  onChange={(e) => setNewStepStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Prazo Final</label>
                <input
                  type="date"
                  value={newStepDeadline}
                  onChange={(e) => setNewStepDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingStep(false)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddNewStep}
                className="text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded shadow cursor-pointer"
              >
                Confirmar Etapa
              </button>
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const deadlineInfo = getStepDeadlineInfo(step);
            const isEditingThisStep = editingStepId === step.id && editStepData !== null;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  step.status === 'Concluído'
                    ? 'bg-slate-950/40 border-emerald-500/20'
                    : step.status === 'Em Andamento'
                    ? 'bg-blue-950/20 border-blue-500/35 shadow-sm shadow-blue-500/10'
                    : step.status === 'Atrasado'
                    ? 'bg-rose-950/20 border-rose-500/35 shadow-sm shadow-rose-500/10'
                    : 'bg-slate-950/50 border-white/5'
                }`}
              >
                {isEditingThisStep ? (
                  /* Form de Edição Completo do Item / Etapa */
                  <div
                    className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-cyan-500/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300">
                      <span>EDITAR ETAPA / OPERAÇÃO</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-400 block font-bold">Nome da Operação</label>
                      <input
                        type="text"
                        value={editStepData.name}
                        onChange={(e) => setEditStepData({ ...editStepData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                        placeholder="Nome da Operação"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] uppercase text-slate-400 block font-bold">Máquina / Centro</label>
                        <input
                          type="text"
                          value={editStepData.machineOrWorkcenter || ''}
                          onChange={(e) => setEditStepData({ ...editStepData, machineOrWorkcenter: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                          placeholder="Centro de Trabalho"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase text-slate-400 block font-bold">Operador / Resp.</label>
                        <input
                          type="text"
                          value={editStepData.operator || ''}
                          onChange={(e) => setEditStepData({ ...editStepData, operator: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                          placeholder="Operador"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-slate-400 block mb-0.5">Data Início</label>
                        <input
                          type="date"
                          value={editStepData.startDate || ''}
                          onChange={(e) => setEditStepData({ ...editStepData, startDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Prazo Final</label>
                        <input
                          type="date"
                          value={editStepData.deadline || ''}
                          onChange={(e) => setEditStepData({ ...editStepData, deadline: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-400 block font-bold">Status da Etapa</label>
                      <select
                        value={editStepData.status}
                        onChange={(e) => setEditStepData({ ...editStepData, status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Atrasado">Atrasado</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveEditingStep}
                        className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>SALVAR ETAPA</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingStepId(null);
                          setEditStepData(null);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>CANCELAR</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Visualização Normal do Item / Etapa */
                  <>
                    {/* Step Top Row: Sequence, Name, Edit Button & Status Button */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div
                        onClick={() => startEditingStep(step)}
                        className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group/stephead"
                        title="Clique para editar este item / operação"
                      >
                        <span className="font-mono text-[10px] font-bold min-w-[22px] text-center px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-white/10 shrink-0 group-hover/stephead:border-cyan-500">
                          {index + 1}
                        </span>
                        <span className={`text-xs font-semibold truncate ${
                          step.status === 'Concluído' ? 'line-through text-slate-400' : 'text-slate-200'
                        }`}>
                          {step.name}
                        </span>
                        <Edit2 className="w-3 h-3 text-cyan-400 opacity-0 group-hover/stephead:opacity-100 transition-opacity shrink-0 ml-1" />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditingStep(step)}
                          className="p-1 text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                          title="Editar todos os campos desta etapa"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStepStatus(step.id)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 transition-all flex items-center gap-1 ${
                            step.status === 'Concluído'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                              : step.status === 'Em Andamento'
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25'
                              : step.status === 'Atrasado'
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Clique para avançar o status desta etapa"
                        >
                          {step.status === 'Concluído' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {step.status === 'Em Andamento' && <PlayCircle className="w-2.5 h-2.5 animate-spin" />}
                          {step.status === 'Atrasado' && <AlertCircle className="w-2.5 h-2.5" />}
                          <span>{step.status}</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Middle Row: Machine, Operator, Estimated Time */}
                    <div
                      onClick={() => startEditingStep(step)}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono mb-2 cursor-pointer hover:text-slate-200 transition-colors"
                      title="Clique para editar máquinas, operador ou horas"
                    >
                      <div className="flex items-center gap-1 text-slate-300">
                        <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{step.machineOrWorkcenter || 'Centro de Trabalho'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[110px]">{step.operator || 'Operador'}</span>
                      </div>
                    </div>

                    {/* Step Bottom Row: Dates & Deadlines */}
                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono">
                      <div 
                        onClick={() => startEditingStep(step)}
                        className="flex items-center gap-2 cursor-pointer hover:text-cyan-300 transition-colors group/dates"
                        title="Clique para alterar as datas desta operação"
                      >
                        <div className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-white" />
                          <span>{step.startDate ? new Date(step.startDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                          <span className="font-bold text-white">{step.deadline ? new Date(step.deadline + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-mono ${deadlineInfo.color}`}>
                          {deadlineInfo.label}
                        </span>

                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Remover esta operação do roteiro"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-2.5 border-t border-white/5 flex items-center justify-end text-[10px] font-mono text-slate-400 shrink-0">
        <span className="text-cyan-400 font-semibold">{completedCount} de {steps.length} concluídas</span>
      </div>
    </div>
  );
};

