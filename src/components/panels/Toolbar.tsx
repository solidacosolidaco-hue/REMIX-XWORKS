import React, { useState, useRef, useEffect } from 'react';
import { CanvasMode, NodeType, CanvasTheme } from '../../types/canvas';
import {
  MousePointer,
  Hand,
  Link,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Sparkles,
  Puzzle,
  Zap,
  Play,
  Share2,
  FolderOpen,
  Plus,
  HelpCircle,
  CheckSquare,
  LayoutGrid,
  Building2,
  ShoppingCart,
  FolderGit2,
  StickyNote,
  Type,
  Layers,
  FileText,
  Settings,
  X,
  Receipt,
  Wrench,
  PackageCheck,
  PieChart,
  Package,
  Cog,
  User,
  UserPlus,
  ShieldCheck,
  Factory,
  GitMerge,
  Calendar,
  Calculator,
  Sun,
  Moon,
  Square,
  Grid,
  Sliders,
  Check,
  MoveUp,
  MoveDown,
} from 'lucide-react';

interface SidebarItemDef {
  id: string;
  label: string;
  description: string;
  nodeType?: NodeType;
  isSpecial?: 'employee_modal';
  icon: React.ReactNode;
  color: string;
}

const ALL_SIDEBAR_ITEMS: SidebarItemDef[] = [
  { id: 'employee_modal', label: 'Funcionário / RH', description: 'Central de RH e Cadastro de Funcionários', isSpecial: 'employee_modal', icon: <UserPlus className="w-5 h-5 text-blue-400" />, color: 'text-blue-400' },
  { id: 'customer', label: 'Cliente (CRM)', description: 'Representa um cliente e contatos', nodeType: 'customer', icon: <Building2 className="w-5 h-5 text-blue-400" />, color: 'text-blue-400' },
  { id: 'budget', label: 'Quadro de Orçamento', description: 'Proposta comercial, cotação e validade', nodeType: 'budget', icon: <Calculator className="w-5 h-5 text-amber-400" />, color: 'text-amber-400' },
  { id: 'order', label: 'Pedido de Venda (PV)', description: 'Pedido confirmado de venda e faturamento', nodeType: 'order', icon: <ShoppingCart className="w-5 h-5 text-blue-400" />, color: 'text-blue-400' },
  { id: 'text', label: 'Bloco de Texto', description: 'Área de texto livre', nodeType: 'text', icon: <Type className="w-5 h-5 text-slate-300" />, color: 'text-slate-300' },
  { id: 'kanban', label: 'Quadro Kanban', description: 'Tarefas em colunas (To Do, Doing, Done)', nodeType: 'kanban', icon: <LayoutGrid className="w-5 h-5 text-indigo-400" />, color: 'text-indigo-400' },
  { id: 'product', label: 'Produto Industrial', description: 'Catálogo de produto e SKU', nodeType: 'product', icon: <Package className="w-5 h-5 text-indigo-400" />, color: 'text-indigo-400' },
  { id: 'part', label: 'Peça / Componente', description: 'Peças mecânicas e materiais', nodeType: 'part', icon: <Cog className="w-5 h-5 text-cyan-400" />, color: 'text-cyan-400' },
  { id: 'service', label: 'Serviço Técnico', description: 'Usinagem, calibração e taxas', nodeType: 'service', icon: <Wrench className="w-5 h-5 text-purple-400" />, color: 'text-purple-400' },
  { id: 'supervisor', label: 'Líder / Encarregado', description: 'Liderança de turno', nodeType: 'supervisor', icon: <ShieldCheck className="w-5 h-5 text-amber-400" />, color: 'text-amber-400' },
  { id: 'sector', label: 'Setor / Departamento', description: 'Setores de fábrica e máquinas', nodeType: 'sector', icon: <Factory className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400' },
  { id: 'production_route', label: 'Roteiro de Produção', description: 'Sequenciamento PCP', nodeType: 'production_route', icon: <GitMerge className="w-5 h-5 text-cyan-400" />, color: 'text-cyan-400' },
  { id: 'production_order', label: 'Ordem de Produção', description: 'Ordens de fabricação', nodeType: 'production_order', icon: <Package className="w-5 h-5 text-amber-400" />, color: 'text-amber-400' },
  { id: 'invoice', label: 'Nota Fiscal (NF-e)', description: 'Faturamento e impostos', nodeType: 'invoice', icon: <Receipt className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400' },
  { id: 'project', label: 'Projeto de Engenharia', description: 'Central de plantas', nodeType: 'project', icon: <FolderGit2 className="w-5 h-5 text-cyan-400" />, color: 'text-cyan-400' },
  { id: 'checklist', label: 'Checklist Operacional', description: 'Verificações com checkbox', nodeType: 'checklist', icon: <CheckSquare className="w-5 h-5 text-teal-400" />, color: 'text-teal-400' },
  { id: 'note', label: 'Nota / Lembrete', description: 'Post-it rápido', nodeType: 'note', icon: <StickyNote className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
  { id: 'document', label: 'Documento Técnico', description: 'PDFs e arquivos', nodeType: 'document', icon: <FileText className="w-5 h-5 text-sky-400" />, color: 'text-sky-400' },
  { id: 'group', label: 'Setor (Container)', description: 'Agrupador visual', nodeType: 'group', icon: <Layers className="w-5 h-5 text-pink-400" />, color: 'text-pink-400' },
  { id: 'financial_module', label: 'Módulo Financeiro', description: 'DRE e custos', nodeType: 'financial_module', icon: <PieChart className="w-5 h-5 text-indigo-400" />, color: 'text-indigo-400' },
  { id: 'calendar', label: 'Calendário & Agenda', description: 'Calendário executivo com prazos e agenda imersiva', nodeType: 'calendar', icon: <Calendar className="w-5 h-5 text-blue-400" />, color: 'text-blue-400' },
];

const DEFAULT_ACTIVE_IDS = ['employee_modal', 'customer', 'order', 'text', 'kanban'];

interface ToolbarProps {
  mode: CanvasMode;
  canUndo: boolean;
  canRedo: boolean;
  zoomPercent: number;
  theme?: CanvasTheme;
  onChangeTheme?: (theme: CanvasTheme) => void;
  onSetMode: (mode: CanvasMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReorganize?: () => void;
  onQuickAddNode: (type: NodeType) => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onOpenSimplifiedView?: () => void;
  onStartPresentation: () => void;
  onOpenEmployeeModal?: () => void;
  onOpenGlobalReport?: () => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  canUndo,
  canRedo,
  zoomPercent,
  theme = 'dark',
  onChangeTheme,
  onSetMode,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onReorganize,
  onQuickAddNode,
  onOpenSearch,
  onOpenAI,
  onOpenTemplates,
  onOpenShortcuts,
  onOpenSimplifiedView,
  onStartPresentation,
  onOpenEmployeeModal,
  onOpenGlobalReport,
  isLightMode = false,
  onToggleLightMode,
}) => {
  const [activeItemIds, setActiveItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xcanvas_custom_sidebar_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVE_IDS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const saveActiveItems = (ids: string[]) => {
    setActiveItemIds(ids);
    try {
      localStorage.setItem('xcanvas_custom_sidebar_items', JSON.stringify(ids));
    } catch {}
  };

  const toggleItemActive = (id: string) => {
    if (activeItemIds.includes(id)) {
      if (activeItemIds.length <= 1) return; // Keep at least 1 item
      saveActiveItems(activeItemIds.filter((item) => item !== id));
    } else {
      saveActiveItems([...activeItemIds, id]);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIds = [...activeItemIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;
    saveActiveItems(newIds);
  };

  const activeItemsDefs = activeItemIds
    .map((id) => ALL_SIDEBAR_ITEMS.find((item) => item.id === id))
    .filter(Boolean) as SidebarItemDef[];

  return (
    <>
      {/* Sleek Interface Left Sidebar Rail */}
      <aside
        id="sleek-left-sidebar"
        className="w-14 border-r border-white/5 flex flex-col items-center py-4 gap-3 bg-[#0D1221]/70 backdrop-blur-md z-40 shrink-0 select-none"
      >
        {/* Move / Pointer Tool */}
        <button
          id="tool-btn-select"
          onClick={() => onSetMode('select')}
          className={`p-2.5 rounded-lg transition-all ${
            mode === 'select'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Mover / Selecionar (V)"
        >
          <MousePointer className="w-5 h-5" />
        </button>

        {/* Pan Hand Tool */}
        <button
          id="tool-btn-pan"
          onClick={() => onSetMode('pan')}
          className={`p-2.5 rounded-lg transition-all ${
            mode === 'pan'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Arrastar Lousa / Pan (H ou Espaço)"
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Connect Tool */}
        <button
          id="tool-btn-connect"
          onClick={() => onSetMode(mode === 'connect' ? 'select' : 'connect')}
          className={`p-2.5 rounded-lg transition-all ${
            mode === 'connect'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-blue-400 hover:bg-white/5'
          }`}
          title="Conectar Objetos (C)"
        >
          <Link className="w-5 h-5" />
        </button>

        {/* Investigation Mode */}
        <button
          id="tool-btn-investigation"
          onClick={() => onSetMode(mode === 'investigation' ? 'select' : 'investigation')}
          className={`p-2.5 rounded-lg transition-all ${
            mode === 'investigation'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'
          }`}
          title="Modo Investigação (Dependências)"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="w-6 h-px bg-white/5" />

        {/* Dynamic User Custom Items */}
        {activeItemsDefs.map((item) => (
          <button
            key={item.id}
            id={`tool-btn-custom-${item.id}`}
            onClick={() => {
              if (item.isSpecial === 'employee_modal') {
                if (onOpenEmployeeModal) onOpenEmployeeModal();
                else onQuickAddNode('employee');
              } else if (item.nodeType) {
                onQuickAddNode(item.nodeType);
              }
            }}
            className="p-2.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-all group"
            title={`${item.label} - ${item.description}`}
          >
            <span className="group-hover:scale-110 transition-transform block">
              {item.icon}
            </span>
          </button>
        ))}

        {/* Bottom Shortcuts / Settings Trigger */}
        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
          {onOpenSimplifiedView && (
            <button
              id="tool-btn-simplified-view"
              onClick={onOpenSimplifiedView}
              className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-all border border-blue-500/20 shadow-lg shadow-blue-500/5 mb-1"
              title="👁 VISÃO SIMPLIFICADA (Executivo)"
            >
              <PieChart className="w-5 h-5" />
            </button>
          )}

          {/* Customize Sidebar Button */}
          <button
            id="tool-btn-customize-sidebar"
            onClick={() => setIsCustomizeOpen(true)}
            className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/20"
            title="Personalizar Barra Lateral (Itens Mais Usados)"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            id="tool-btn-shortcuts"
            onClick={onOpenShortcuts}
            className="p-2.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-300 transition-all"
            title="Atalhos de Teclado (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Sidebar Customization Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D1221] border border-blue-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/15 rounded-xl text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Personalizar Barra Lateral</h3>
                  <p className="text-xs text-slate-400">Escolha e ordene os itens mais usados na sua barra de ferramentas</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2.5">
                  Itens Ativos na Barra Lateral ({activeItemIds.length})
                </h4>
                <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  {activeItemIds.map((id, index) => {
                    const itemDef = ALL_SIDEBAR_ITEMS.find((i) => i.id === id);
                    if (!itemDef) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1.5 bg-slate-800 rounded-md">{itemDef.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-white">{itemDef.label}</div>
                            <div className="text-xs text-slate-400">{itemDef.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
                            title="Mover para cima"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === activeItemIds.length - 1}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
                            title="Mover para baixo"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleItemActive(id)}
                            className="ml-2 px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium rounded-md transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Catálogo Completo de Objetos Disponíveis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_SIDEBAR_ITEMS.map((item) => {
                    const isActive = activeItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItemActive(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md'
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="shrink-0">{item.icon}</span>
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">{item.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          isActive ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-600'
                        }`}>
                          {isActive && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-slate-900/50">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
              >
                Concluir Personalização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Floating Bottom Center Pill (Zoom & Playback Controls) */}
      <div
        id="sleek-bottom-zoom-pill"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-md z-40 select-none text-slate-300"
      >
        <button
          id="btn-undo"
          disabled={!canUndo}
          onClick={onUndo}
          className={`p-1.5 hover:bg-white/5 rounded-full text-slate-400 transition-colors ${
            !canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'
          }`}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          id="btn-redo"
          disabled={!canRedo}
          onClick={onRedo}
          className={`p-1.5 hover:bg-white/5 rounded-full text-slate-400 transition-colors ${
            !canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'
          }`}
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-3.5 bg-white/10 mx-0.5" />

        <button
          id="btn-zoom-out"
          onClick={onZoomOut}
          className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          title="Diminuir Zoom (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="px-2 text-xs font-medium text-slate-300 min-w-[42px] text-center font-mono">
          {zoomPercent}%
        </span>

        <button
          id="btn-zoom-in"
          onClick={onZoomIn}
          className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-fit-view"
          onClick={onFitView}
          className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          title="Ajustar ao Canvas (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {onOpenGlobalReport && (
          <>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              id="btn-global-report"
              onClick={onOpenGlobalReport}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
              title="Relatório Executivo Geral (Tudo)"
            >
              <FileText className="w-4 h-4" />
            </button>
          </>
        )}

        {onChangeTheme && (
          <>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              id="btn-toggle-canvas-theme"
              onClick={() => {
                const nextTheme: CanvasTheme =
                  theme === 'black' || theme === 'dark'
                    ? 'white'
                    : theme === 'white' || theme === 'light' || theme === 'blueprint_light' || theme === 'warm_light'
                    ? 'gray'
                    : 'black';
                onChangeTheme(nextTheme);
              }}
              className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                theme === 'white' || theme === 'light' || theme === 'blueprint_light' || theme === 'warm_light'
                  ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-md shadow-white/20 font-bold'
                  : theme === 'gray'
                  ? 'bg-slate-600 text-white hover:bg-slate-500 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={
                theme === 'white' || theme === 'light' || theme === 'blueprint_light' || theme === 'warm_light'
                  ? 'Fundo Branco ativo - Clique para Cinza'
                  : theme === 'gray'
                  ? 'Fundo Cinza ativo - Clique para Preto'
                  : 'Fundo Preto ativo - Clique para Branco'
              }
            >
              {theme === 'white' || theme === 'light' || theme === 'blueprint_light' || theme === 'warm_light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : theme === 'gray' ? (
                <Square className="w-4 h-4 text-slate-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </>
        )}

        {onToggleLightMode && (
          <>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              id="btn-toggle-light-mode"
              onClick={onToggleLightMode}
              className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                isLightMode
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 font-bold animate-pulse'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-white/5'
              }`}
              title={
                isLightMode
                  ? 'Modo Leve Ativo (Alta Performance para muitos dados) - Clique para Desativar'
                  : 'Ativar Modo Leve (Otimizado para Grande Volume de Dados)'
              }
            >
              <Zap className={`w-4 h-4 ${isLightMode ? 'fill-current' : ''}`} />
            </button>
          </>
        )}

        {onReorganize && (
          <>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              id="btn-reorganize"
              onClick={onReorganize}
              className="p-1.5 hover:bg-amber-500/10 rounded-full text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center"
              title="Reorganizar Quadros (Organizar Grid Automático)"
            >
              <Puzzle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </>
  );
};

