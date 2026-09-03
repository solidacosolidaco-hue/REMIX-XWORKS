import React, { useState, useMemo } from 'react';
import { CanvasNode, NodeType, NodeStatus } from '../../types/canvas';
import {
  Search,
  X,
  Building2,
  ShoppingCart,
  FolderGit2,
  LayoutGrid,
  CheckSquare,
  Paperclip,
  Clock,
  Activity,
  StickyNote,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SearchFilterBarProps {
  nodes: CanvasNode[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAndFocusNode: (nodeId: string) => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  nodes,
  isOpen,
  onClose,
  onSelectAndFocusNode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      // Type match
      if (selectedType !== 'all' && n.type !== selectedType) return false;
      // Status match
      if (selectedStatus !== 'all' && n.status !== selectedStatus) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const nameMatch = n.name.toLowerCase().includes(term);
      const tagMatch = n.tags?.some((t) => t.toLowerCase().includes(term));
      const assigneeMatch = n.assignee?.toLowerCase().includes(term);
      const dataString = JSON.stringify(n.data).toLowerCase();
      const dataMatch = dataString.includes(term);

      return nameMatch || tagMatch || assigneeMatch || dataMatch;
    });
  }, [nodes, searchTerm, selectedType, selectedStatus]);

  if (!isOpen) return null;

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'customer':
        return <Building2 className="w-4 h-4 text-sky-400" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-cyan-400" />;
      case 'kanban':
        return <LayoutGrid className="w-4 h-4 text-indigo-400" />;
      case 'checklist':
        return <CheckSquare className="w-4 h-4 text-teal-400" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4 text-cyan-400" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'indicator':
        return <Activity className="w-4 h-4 text-purple-400" />;
      default:
        return <StickyNote className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      id="search-filter-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 text-slate-100 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-sky-400" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar objetos, clientes, pedidos, tags, responsáveis (ex: ABC, usinagem, atrasado)..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-slate-800 text-xs font-mono">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Tipo:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'customer', label: 'Clientes' },
            { id: 'order', label: 'Pedidos' },
            { id: 'project', label: 'Projetos' },
            { id: 'kanban', label: 'Kanban' },
            { id: 'checklist', label: 'Checklists' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-2 py-1 rounded-lg border transition-colors ${
                selectedType === type.id
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1.5 pr-1 max-h-[50vh]">
          {filteredNodes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Nenhum objeto encontrado correspondente aos filtros.
            </div>
          ) : (
            filteredNodes.map((node) => (
              <div
                key={node.id}
                id={`search-item-${node.id}`}
                onClick={() => {
                  onSelectAndFocusNode(node.id);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:border-slate-600">
                    {getNodeIcon(node.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">
                        {node.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {node.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>{node.assignee ? `Resp: ${node.assignee}` : 'Geral'}</span>
                      {node.tags && node.tags.length > 0 && (
                        <span>• #{node.tags.join(', #')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-sky-400 font-mono">
                  <span>Ir para objeto</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>{filteredNodes.length} de {nodes.length} objetos correspondentes</span>
          <span>Pressione [ESC] para fechar</span>
        </div>
      </div>
    </div>
  );
};
