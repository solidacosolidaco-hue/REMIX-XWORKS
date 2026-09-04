import React from 'react';
import { NodeType, CanvasTheme } from '../../types/canvas';
import {
  Type,
  StickyNote,
  CheckSquare,
  LayoutGrid,
  Building2,
  ShoppingCart,
  Calculator,
  FolderGit2,
  FileText,
  Paperclip,
  Layers,
  Link,
  Plus,
  Wrench,
  PackageCheck,
  PieChart,
  GitMerge,
  Sun,
  Moon,
  Square,
  Grid,
  Copy,
  ClipboardPaste,
  ZapOff,
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  canvasCoordinates: { x: number; y: number };
  currentTheme?: CanvasTheme;
  clipboardCount?: number;
  hasSelectedNodes?: boolean;
  onClose: () => void;
  onCreateNode: (type: NodeType, coords: { x: number; y: number }) => void;
  onEnterConnectMode: () => void;
  onOpenProductsCatalog?: () => void;
  onChangeTheme?: (theme: CanvasTheme) => void;
  onCopySelected?: () => void;
  onPaste?: (coords: { x: number; y: number }) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  canvasCoordinates,
  currentTheme = 'dark',
  clipboardCount = 0,
  hasSelectedNodes = false,
  onClose,
  onCreateNode,
  onEnterConnectMode,
  onOpenProductsCatalog,
  onChangeTheme,
  onCopySelected,
  onPaste,
}) => {
  const menuItems: {
    type: NodeType | 'connect' | 'catalog';
    label: string;
    icon: React.ReactNode;
    color: string;
    desc: string;
  }[] = [
    {
      type: 'customer',
      label: 'Cliente (CRM)',
      icon: <Building2 className="w-4 h-4 text-sky-400" />,
      color: 'hover:border-sky-500/40',
      desc: 'Empresa, CNPJ, Contato e Faturamento',
    },
    {
      type: 'budget',
      label: 'Quadro de Orçamento',
      icon: <Calculator className="w-4 h-4 text-amber-400" />,
      color: 'hover:border-amber-500/40',
      desc: 'Proposta Comercial, Cotação e Validade',
    },
    {
      type: 'order',
      label: 'Pedido de Venda (PV)',
      icon: <ShoppingCart className="w-4 h-4 text-blue-400" />,
      color: 'hover:border-blue-500/40',
      desc: 'Pedido Confirmado, Itens e Faturamento',
    },
    {
      type: 'project',
      label: 'Projeto',
      icon: <FolderGit2 className="w-4 h-4 text-cyan-400" />,
      color: 'hover:border-cyan-500/40',
      desc: 'Engenharia PX, Módulos, Prazos',
    },
    {
      type: 'production_order',
      label: 'Ordem de Produção (PCP)',
      icon: <PackageCheck className="w-4 h-4 text-amber-400" />,
      color: 'hover:border-amber-500/40',
      desc: 'Ordem de Fabricação, PCP e Lotes',
    },
    {
      type: 'production_route',
      label: 'Roteiro de Produção',
      icon: <GitMerge className="w-4 h-4 text-cyan-400" />,
      color: 'hover:border-cyan-500/40',
      desc: 'Sequenciamento, Máquinas, Datas e Prazos',
    },
    {
      type: 'interrupted_flow',
      label: 'Fluxo Interrompido',
      icon: <ZapOff className="w-4 h-4 text-rose-400" />,
      color: 'hover:border-rose-500/40',
      desc: 'Parada de Processo / Ocorrência que bloqueia o fluxo',
    },
    {
      type: 'checklist',
      label: 'Checklist',
      icon: <CheckSquare className="w-4 h-4 text-teal-400" />,
      color: 'hover:border-teal-500/40',
      desc: 'Itens de Fabricação e Montagem',
    },
    {
      type: 'attachment',
      label: 'Anexos & URLs',
      icon: <Paperclip className="w-4 h-4 text-cyan-400" />,
      color: 'hover:border-cyan-500/40',
      desc: 'Links, Arquivos e Endereços com Progresso',
    },
    {
      type: 'kanban',
      label: 'Quadro Kanban',
      icon: <LayoutGrid className="w-4 h-4 text-indigo-400" />,
      color: 'hover:border-indigo-500/40',
      desc: 'Colunas A Fazer, Em Andamento, Concluído',
    },
    {
      type: 'note',
      label: 'Nota / Post-it',
      icon: <StickyNote className="w-4 h-4 text-yellow-400" />,
      color: 'hover:border-yellow-500/40',
      desc: 'Avisos, Alertas e Notas Rápidas',
    },
    {
      type: 'text',
      label: 'Texto Livre',
      icon: <Type className="w-4 h-4 text-slate-300" />,
      color: 'hover:border-slate-500/40',
      desc: 'Títulos, Blocos e Anotações',
    },
    {
      type: 'document',
      label: 'Informação Técnica',
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      color: 'hover:border-blue-500/40',
      desc: 'Desenhos CAD, PDFs e Manuais',
    },
    {
      type: 'group',
      label: 'Setor',
      icon: <Layers className="w-4 h-4 text-pink-400" />,
      color: 'hover:border-pink-500/40',
      desc: 'Delimitar Setores e Módulos',
    },
    {
      type: 'custom',
      label: '⚙️ Objeto Personalizado',
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      color: 'hover:border-amber-500/40',
      desc: 'Ferramentas e Atributos Definidos por Você',
    },
    {
      type: 'finalized_order',
      label: 'Pedido Finalizado',
      icon: <PackageCheck className="w-4 h-4 text-emerald-400" />,
      color: 'hover:border-emerald-500/40',
      desc: 'Dados Completos de Cliente, Pedido e Entrega',
    },
    {
      type: 'financial_module',
      label: 'Módulo Financeiro',
      icon: <PieChart className="w-4 h-4 text-indigo-400" />,
      color: 'hover:border-indigo-500/40',
      desc: 'Receitas, Custos, Impostos e Lucro Líquido',
    },
    {
      type: 'catalog',
      label: '📦 Produtos Cadastrados',
      icon: <PackageCheck className="w-4 h-4 text-indigo-400" />,
      color: 'hover:border-indigo-500/40',
      desc: 'Catálogo geral para selecionar e vincular produtos',
    },
    {
      type: 'connect',
      label: 'Criar Conexão',
      icon: <Link className="w-4 h-4 text-sky-400" />,
      color: 'hover:border-sky-500/40',
      desc: 'Ligar Nós com Linhas e Relações',
    },
  ];

  return (
    <div
      id="canvas-context-menu"
      style={{ left: `${Math.min(x, window.innerWidth - 290)}px`, top: `${Math.min(y, window.innerHeight - 480)}px` }}
      className="fixed z-50 w-72 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-100"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="font-bold text-sky-400 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          MENU DE AÇÕES
        </span>
        <span className="text-[10px] text-slate-500">
          X: {Math.round(canvasCoordinates.x)} | Y: {Math.round(canvasCoordinates.y)}
        </span>
      </div>

      {/* Ações Rápidas de Copiar e Colar */}
      {(hasSelectedNodes || clipboardCount > 0) && (
        <div className="py-1 px-1 border-b border-slate-800/80 space-y-1">
          {hasSelectedNodes && onCopySelected && (
            <button
              id="ctx-btn-copy"
              onClick={() => {
                onCopySelected();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-200 transition-all text-xs font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Copiar Quadro Selecionado</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-[9px] font-mono text-slate-400">
                Ctrl+C
              </kbd>
            </button>
          )}

          {clipboardCount > 0 && onPaste && (
            <button
              id="ctx-btn-paste"
              onClick={() => {
                onPaste(canvasCoordinates);
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 transition-all text-xs font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Colar Quadro{clipboardCount > 1 ? `s (${clipboardCount})` : ''} Aqui</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-[9px] font-mono text-emerald-400 font-bold">
                Ctrl+V
              </kbd>
            </button>
          )}
        </div>
      )}

      <div className="max-h-[340px] overflow-y-auto py-1 space-y-0.5 animate-in fade-in duration-200">
        {menuItems.map((item) => (
          <button
            key={item.type}
            id={`ctx-item-${item.type}`}
            onClick={() => {
              if (item.type === 'connect') {
                onEnterConnectMode();
              } else if (item.type === 'catalog') {
                onOpenProductsCatalog?.();
              } else {
                onCreateNode(item.type as NodeType, canvasCoordinates);
              }
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 border border-transparent ${item.color} transition-all group`}
          >
            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 group-hover:border-slate-700">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                {item.label}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Theme Switcher Quick Bar */}
      {onChangeTheme && (
        <div className="mt-1 pt-2 border-t border-slate-800 px-1">
          <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
            <span>FUNDO DA LOUSA:</span>
            <span className="text-amber-400 font-bold uppercase">
              {currentTheme === 'white' || currentTheme === 'light' ? 'Branco' : currentTheme === 'gray' ? 'Cinza' : 'Preto'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                onChangeTheme('white');
                onClose();
              }}
              className={`p-1.5 rounded-lg text-center flex flex-col items-center gap-0.5 transition-all text-[9px] font-mono ${
                currentTheme === 'white' || currentTheme === 'light'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Fundo Branco"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Branco</span>
            </button>
            <button
              onClick={() => {
                onChangeTheme('black');
                onClose();
              }}
              className={`p-1.5 rounded-lg text-center flex flex-col items-center gap-0.5 transition-all text-[9px] font-mono ${
                currentTheme === 'black' || currentTheme === 'dark'
                  ? 'bg-slate-950 text-white border border-white/20 font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Fundo Preto"
            >
              <Moon className="w-3.5 h-3.5 text-slate-300" />
              <span>Preto</span>
            </button>
            <button
              onClick={() => {
                onChangeTheme('gray');
                onClose();
              }}
              className={`p-1.5 rounded-lg text-center flex flex-col items-center gap-0.5 transition-all text-[9px] font-mono ${
                currentTheme === 'gray'
                  ? 'bg-slate-700 text-white font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Fundo Cinza"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              <span>Cinza</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
