import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CanvasNode, KanbanCard, KanbanColumn } from '../../types/canvas';
import { 
  LayoutGrid, Plus, MoreVertical, Trash2, Calendar, User, Tag, ArrowRight,
  Link2, Clock, DollarSign, CheckSquare, FileText, X, AlertTriangle, Check
} from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface KanbanNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const KanbanNode: React.FC<KanbanNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Quadro Kanban');

  // Drag and Drop State
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Search & Filters State (Trello Premium feel)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Detailed Card Editor States
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editPriority, setEditPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinks, setEditLinks] = useState<{ id: string; title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editCoverColor, setEditCoverColor] = useState<string>(''); // e.g., 'blue', 'emerald', 'amber', 'rose', 'purple', or ''
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState<number | ''>('');
  const [editBudgetCost, setEditBudgetCost] = useState<number | ''>('');
  const [editChecklist, setEditChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Native Drag and Drop Helpers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        return { ...c, columnId: targetColumnId };
      }
      return c;
    });

    const newPct = calcCardsProgress(updatedCards);
    onUpdateData(node.id, { cards: updatedCards, progressPercent: newPct, currentValue: newPct });
  };

  const openCardEditor = (card: KanbanCard) => {
    setEditingCard(card);
    setEditTitle(card.title || '');
    setEditDesc(card.description || '');
    setEditAssignee(card.assignee || '');
    setEditPriority(card.priority || 'media');
    setEditStartDate(card.startDate || '');
    setEditDueDate(card.dueDate || '');
    setEditLinkUrl(card.linkUrl || '');
    setEditLinkTitle(card.linkTitle || '');
    setEditEstimatedHours(card.estimatedHours ?? '');
    setEditBudgetCost(card.budgetCost ?? '');
    setEditChecklist(card.checklist || []);
    setNewChecklistItem('');
    setEditCoverColor(card.coverColor || '');
    setEditTags(card.tags || []);
    setNewTagText('');

    const initialLinks = card.links ? [...card.links] : [];
    if (card.linkUrl && !initialLinks.some(l => l.url === card.linkUrl)) {
      initialLinks.push({ id: `lnk-legacy-${Date.now()}`, title: card.linkTitle || 'Link Principal', url: card.linkUrl });
    }
    setEditLinks(initialLinks);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const saveCardChanges = () => {
    if (!editingCard) return;
    const updatedCards = cards.map((c) => {
      if (c.id === editingCard.id) {
        return {
          ...c,
          title: editTitle.trim() || c.title,
          description: editDesc.trim() || undefined,
          assignee: editAssignee.trim() || undefined,
          priority: editPriority,
          startDate: editStartDate || undefined,
          dueDate: editDueDate || undefined,
          linkUrl: editLinks[0]?.url || undefined,
          linkTitle: editLinks[0]?.title || undefined,
          links: editLinks,
          coverColor: editCoverColor || undefined,
          tags: editTags,
          estimatedHours: editEstimatedHours !== '' ? Number(editEstimatedHours) : undefined,
          budgetCost: editBudgetCost !== '' ? Number(editBudgetCost) : undefined,
          checklist: editChecklist,
        };
      }
      return c;
    });

    const newPct = calcCardsProgress(updatedCards);
    onUpdateData(node.id, { cards: updatedCards, progressPercent: newPct, currentValue: newPct });
    setEditingCard(null);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const columns: KanbanColumn[] = node.data.columns || [
    { id: 'col-todo', title: 'A FAZER', color: '#64748b' },
    { id: 'col-in-progress', title: 'EM ANDAMENTO', color: '#3b82f6' },
    { id: 'col-done', title: 'CONCLUÍDO', color: '#10b981' },
  ];

  const cards: KanbanCard[] = node.data.cards || [];

  const calcCardsProgress = (updatedCards: KanbanCard[]) => {
    if (updatedCards.length === 0) return 0;
    let score = 0;
    updatedCards.forEach((c) => {
      // Encontrar a coluna à qual o card pertence
      const colIdx = columns.findIndex((col, idx) => {
        if (c.columnId === col.id) return true;
        if (col.id === 'col-todo' && (c.columnId === 'todo' || c.columnId === 'backlog')) return true;
        if (
          col.id === 'col-in-progress' &&
          (c.columnId === 'doing' || c.columnId === 'dev' || c.columnId === 'col-progress' || c.columnId === 'in-progress')
        ) return true;
        if (col.id === 'col-done' && (c.columnId === 'done')) return true;
        if (idx === 0 && (!c.columnId || c.columnId === 'col-todo')) return true;
        return false;
      });

      if (colIdx === -1) {
        score += 0;
      } else if (colIdx === columns.length - 1) {
        score += 1.0; // Última coluna é considerada "Concluído"
      } else if (colIdx > 0) {
        score += 0.5; // Colunas intermediárias são consideradas "Em andamento"
      }
    });
    return Math.round((score / updatedCards.length) * 100);
  };

  const moveCard = (cardId: string, targetColId: string) => {
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, columnId: targetColId } : c
    );
    const newPct = calcCardsProgress(updated);
    onUpdateData(node.id, { cards: updated, progressPercent: newPct, currentValue: newPct });
  };

  const addCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCard = {
      id: `kcard-${Date.now()}`,
      title: newCardTitle.trim(),
      columnId,
      priority: 'media',
      tags: ['geral'],
    };
    const updated = [...cards, newCard];
    const newPct = calcCardsProgress(updated);
    onUpdateData(node.id, { cards: updated, progressPercent: newPct, currentValue: newPct });
    setNewCardTitle('');
    setActiveColumnId(null);
  };

  const deleteCard = (cardId: string) => {
    const updated = cards.filter((c) => c.id !== cardId);
    const newPct = calcCardsProgress(updated);
    onUpdateData(node.id, { cards: updated, progressPercent: newPct, currentValue: newPct });
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'alta':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'baixa':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  const getCoverBg = (color?: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600';
      case 'emerald': return 'bg-emerald-600';
      case 'amber': return 'bg-amber-500';
      case 'rose': return 'bg-rose-600';
      case 'purple': return 'bg-purple-600';
      default: return null;
    }
  };

  return (
    <div
      id={`kanban-node-${node.id}`}
      className="p-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl text-slate-100 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
                QUADRO KANBAN
              </span>
              {isEditingTitle ? (
                <input onMouseDown={(e) => e.stopPropagation()}
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                  }}
                  className="bg-slate-950 border border-sky-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-sm text-slate-100 leading-tight truncate cursor-pointer hover:underline hover:text-sky-300 transition-colors"
                  title="Clique para editar o nome do Kanban"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400 shrink-0 ml-2">
            {cards.length} tarefas
          </span>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} compact={false} />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} compact={false} />
      </div>

      {/* Trello Premium Search & Filters Area */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-3 text-[10px]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex-1 min-w-[120px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cards..."
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-2 pr-6 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
        >
          <option value="all">Prioridades (Todas)</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta font-bold text-amber-400">Alta</option>
          <option value="urgente font-bold text-rose-400">Urgente</option>
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium max-w-[120px] cursor-pointer"
        >
          <option value="all">Responsáveis (Todos)</option>
          {Array.from(new Set(cards.map(c => c.assignee).filter(Boolean))).map((assignee) => (
            <option key={assignee} value={assignee!}>{assignee}</option>
          ))}
        </select>

        {(searchQuery || filterPriority !== 'all' || filterAssignee !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterPriority('all');
              setFilterAssignee('all');
            }}
            className="px-2 py-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-md border border-rose-500/20 transition-all font-bold cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Kanban Columns Grid */}
      <div 
        className="grid gap-3 flex-1 overflow-x-auto min-h-[250px]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(180px, 1fr))` }}
      >
        {columns.map((col, colIdx) => {
          const columnCards = cards.filter((c) => {
            if (c.columnId === col.id) return true;
            if (col.id === 'col-todo' && (c.columnId === 'todo' || c.columnId === 'backlog')) return true;
            if (
              col.id === 'col-in-progress' &&
              (c.columnId === 'doing' || c.columnId === 'dev' || c.columnId === 'col-progress' || c.columnId === 'in-progress')
            ) return true;
            if (col.id === 'col-done' && (c.columnId === 'done')) return true;
            if (colIdx === 0 && (!c.columnId || c.columnId === 'col-todo')) return true;
            return false;
          }).filter((c) => {
            // Apply Search Query
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const titleMatch = c.title?.toLowerCase().includes(query);
              const descMatch = c.description?.toLowerCase().includes(query);
              const assigneeMatch = c.assignee?.toLowerCase().includes(query);
              const tagsMatch = c.tags?.some(tag => tag.toLowerCase().includes(query));
              if (!titleMatch && !descMatch && !assigneeMatch && !tagsMatch) return false;
            }
            // Apply Priority Filter
            if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
            // Apply Assignee Filter
            if (filterAssignee !== 'all' && c.assignee !== filterAssignee) return false;
            return true;
          });

          const prevCol = colIdx > 0 ? columns[colIdx - 1] : null;
          const nextCol = colIdx < columns.length - 1 ? columns[colIdx + 1] : null;

          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => { e.preventDefault(); setDragOverColId(col.id); }}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={(e) => handleCardDrop(e, col.id)}
              className={`bg-slate-950/60 rounded-xl border p-2.5 flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                dragOverColId === col.id 
                  ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/15 scale-[1.01]' 
                  : 'border-slate-800/80 hover:border-slate-750/80'
              }`}
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.color || '#38bdf8' }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {col.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                    {columnCards.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 overflow-y-auto max-h-[230px] pr-1">
                  {columnCards.map((card) => {
                    const doneSubtasks = card.checklist?.filter(item => item.done).length || 0;
                    const totalSubtasks = card.checklist?.length || 0;

                    const coverBg = getCoverBg(card.coverColor);

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCardEditor(card);
                        }}
                        className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-lg shadow-sm group/card transition-all cursor-pointer select-none overflow-hidden active:scale-[0.98]"
                      >
                        {coverBg && (
                          <div className={`h-2.5 w-full ${coverBg} opacity-85 transition-opacity group-hover/card:opacity-100`} />
                        )}
                        <div className="p-2.5">
                          {/* Tags Display */}
                          {card.tags && card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {card.tags.map((tag, tIdx) => {
                                const tagColors = [
                                  'bg-blue-500/20 text-blue-300 border-blue-500/25',
                                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/25',
                                  'bg-amber-500/20 text-amber-300 border-amber-500/25',
                                  'bg-rose-500/20 text-rose-300 border-rose-500/25',
                                  'bg-purple-500/20 text-purple-300 border-purple-500/25',
                                ];
                                const colorClass = tagColors[tIdx % tagColors.length];
                                return (
                                  <span key={tag} className={`text-[7.5px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${colorClass}`}>
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-slate-200 leading-snug break-words group-hover/card:text-white transition-colors">
                                {card.title}
                              </h4>
                            </div>
                            <button onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                              className="opacity-0 group-hover/card:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity shrink-0"
                              title="Excluir Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        {/* Optional Description preview indicator */}
                        {card.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                            {card.description}
                          </p>
                        )}

                        {/* Interactive Checklist list directly on the Card (Trello Paid Mode style) */}
                        {card.checklist && card.checklist.length > 0 && (
                          <div 
                            className="mt-2.5 space-y-1 bg-slate-950/45 p-2 rounded-lg border border-slate-800/60" 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                              <span className="uppercase font-bold text-emerald-400 flex items-center gap-1">
                                <CheckSquare className="w-2.5 h-2.5" /> Checklist
                              </span>
                              <span className="bg-slate-900 px-1.5 py-0.2 rounded text-[8.5px]">
                                {doneSubtasks}/{totalSubtasks}
                              </span>
                            </div>
                            <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5">
                              {card.checklist.map((item, idx) => (
                                <label 
                                  key={item.id} 
                                  className="flex items-center gap-2 cursor-pointer group/chk select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={(e) => {
                                      const updatedCards = cards.map((c) => {
                                        if (c.id === card.id) {
                                          const nextChecklist = [...(c.checklist || [])];
                                          nextChecklist[idx] = { ...item, done: e.target.checked };
                                          return { ...c, checklist: nextChecklist };
                                        }
                                        return c;
                                      });
                                      const newPct = calcCardsProgress(updatedCards);
                                      onUpdateData(node.id, { cards: updatedCards, progressPercent: newPct, currentValue: newPct });
                                    }}
                                    className="rounded text-emerald-500 bg-slate-900 border-slate-800 focus:ring-0 w-3 h-3 cursor-pointer"
                                  />
                                  <span className={`text-[10.5px] truncate flex-1 leading-none ${item.done ? 'line-through text-slate-500' : 'text-slate-300 group-hover/chk:text-white transition-colors'}`}>
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                            
                            {/* Inline Add Item to Checklist on Card */}
                            <div className="mt-1.5 pt-1.5 border-t border-slate-900/60">
                              <input 
                                type="text"
                                placeholder="+ Adicionar subtarefa..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      const newItem = { id: `chk-${Date.now()}-${Math.random()}`, text: val, done: false };
                                      const updatedCards = cards.map((c) => {
                                        if (c.id === card.id) {
                                          return { ...c, checklist: [...(c.checklist || []), newItem] };
                                        }
                                        return c;
                                      });
                                      const newPct = calcCardsProgress(updatedCards);
                                      onUpdateData(node.id, { cards: updatedCards, progressPercent: newPct, currentValue: newPct });
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                                className="w-full bg-transparent border-none p-0 text-[10px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-0 font-medium"
                              />
                            </div>
                          </div>
                        )}

                        {/* Additional customizable info rows (estimations, checklists, links) */}
                        {(card.linkUrl || totalSubtasks > 0 || card.estimatedHours || card.budgetCost) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1.5 border-t border-slate-800/40 text-[9px] font-mono text-slate-400">
                            {/* Checklist Progress */}
                            {totalSubtasks > 0 && (
                              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded" title="Subtarefas completas">
                                <CheckSquare className="w-2.5 h-2.5" />
                                <span>{doneSubtasks}/{totalSubtasks}</span>
                              </div>
                            )}

                            {/* Estimated Hours */}
                            {card.estimatedHours && (
                              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded" title="Tempo estimado">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{card.estimatedHours}h</span>
                              </div>
                            )}

                            {/* Budget Cost */}
                            {card.budgetCost && (
                              <div className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded" title="Orçamento estimado">
                                <DollarSign className="w-2.5 h-2.5" />
                                <span>R$ {card.budgetCost}</span>
                              </div>
                            )}

                            {/* Clickable External Links */}
                            {((card.links && card.links.length > 0) || card.linkUrl) && (
                              <div className="flex flex-wrap gap-1">
                                {(card.links && card.links.length > 0 
                                  ? card.links 
                                  : [{ id: 'legacy', title: card.linkTitle || 'Link', url: card.linkUrl! }]
                                ).map((lnk) => (
                                  <a 
                                    key={lnk.id}
                                    href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 px-1 py-0.5 rounded transition-colors text-[9px]" 
                                    title={lnk.title || lnk.url}
                                  >
                                    <Link2 className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate max-w-[65px]">{lnk.title || 'Link'}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card meta tags & details (Priority, Assignee, Dates) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/60 text-[9px] font-mono">
                          {card.priority && (
                            <span
                              className={`px-1 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                                card.priority
                              )}`}
                            >
                              {card.priority}
                            </span>
                          )}

                          {card.assignee && (
                            <span className="flex items-center gap-1 text-slate-400" title="Responsável">
                              <User className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                              <span className="truncate max-w-[50px]">{card.assignee}</span>
                            </span>
                          )}

                          {(card.startDate || card.dueDate) && (
                            <span className="flex items-center gap-1 text-slate-400 ml-auto" title="Prazos">
                              <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                              <span>
                                {card.startDate ? card.startDate.split('-').reverse().slice(0, 2).join('/') : ''}
                                {card.startDate && card.dueDate ? ' → ' : ''}
                                {card.dueDate ? card.dueDate.split('-').reverse().slice(0, 2).join('/') : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Column Move Shortcuts */}
                        <div className="mt-2 pt-1.5 border-t border-slate-800/40 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                          {prevCol ? (
                            <button onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); moveCard(card.id, prevCol.id); }}
                              className="text-[9px] font-mono flex items-center gap-0.5 text-slate-400 hover:text-sky-300 bg-slate-950/80 hover:bg-slate-800 px-1 py-0.5 rounded border border-slate-800 transition-colors"
                              title={`Mover para ${prevCol.title}`}
                            >
                              <span>← {prevCol.title}</span>
                            </button>
                          ) : <div />}

                          {nextCol ? (
                            <button onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); moveCard(card.id, nextCol.id); }}
                              className="text-[9px] font-mono flex items-center gap-0.5 text-slate-300 hover:text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-500/30 transition-colors font-medium ml-auto"
                              title={`Mover para ${nextCol.title}`}
                            >
                              <span>{nextCol.title}</span>
                              <ArrowRight className="w-2 h-2" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Add Card Button */}
              <div className="pt-2 border-t border-slate-800/60 mt-2">
                {activeColumnId === col.id ? (
                  <div className="space-y-1.5">
                    <input onMouseDown={(e) => e.stopPropagation()}
                      type="text"
                      autoFocus
                      placeholder="Título da tarefa..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCard(col.id)}
                      className="w-full bg-slate-900 border border-sky-500/50 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      <button onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); addCard(col.id); }}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] px-2 py-0.5 rounded"
                      >
                        Salvar
                      </button>
                      <button onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setActiveColumnId(null); }}
                        className="text-slate-400 text-[11px] px-1.5 py-0.5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setActiveColumnId(col.id); }}
                    className="w-full flex items-center justify-center gap-1 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo Card</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Card Editor Modal Overlay (Rendered via Portal to prevent canvas/node clipping) */}
      {editingCard && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setEditingCard(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 shrink-0 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block font-semibold">Detalhes do Card</span>
                  <h4 className="text-sm font-bold text-white truncate max-w-[280px]">
                    {editTitle || 'Editar Tarefa'}
                  </h4>
                </div>
              </div>
              <button 
                onClick={() => setEditingCard(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="space-y-4 p-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Title & Desc */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Título do Card</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-sky-500"
                    placeholder="Digite o título da tarefa..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Descrição / Notas</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="Descreva as especificações, observações ou escopo desta tarefa..."
                  />
                </div>
              </div>

              {/* Covers & Tags (Trello Paid Mode) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                {/* Card Cover Selector */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Capa do Cartão (Cover)</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { id: '', label: 'Nenhuma', class: 'bg-slate-950 border border-slate-800' },
                      { id: 'blue', label: 'Azul', class: 'bg-blue-600' },
                      { id: 'emerald', label: 'Verde', class: 'bg-emerald-600' },
                      { id: 'amber', label: 'Amarelo', class: 'bg-amber-500' },
                      { id: 'rose', label: 'Vermelho', class: 'bg-rose-600' },
                      { id: 'purple', label: 'Roxo', class: 'bg-purple-600' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditCoverColor(c.id)}
                        className={`w-6 h-6 rounded transition-all relative flex items-center justify-center border ${c.class} cursor-pointer ${
                          editCoverColor === c.id 
                            ? 'ring-2 ring-sky-500 scale-110 border-white' 
                            : 'hover:scale-105 border-transparent'
                        }`}
                        title={c.label}
                      >
                        {editCoverColor === c.id && (
                          <span className="text-[9px] font-bold text-white">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags/Labels Editor */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Etiquetas / Labels ({editTags.length})</label>
                  <div className="space-y-1.5">
                    {/* Tags list */}
                    {editTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                        {editTags.map((tag) => (
                          <span 
                            key={tag} 
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 uppercase tracking-wider"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                              className="text-slate-400 hover:text-white font-black text-[10px]"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* New Tag Input */}
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagText.trim() && !editTags.includes(newTagText.trim())) {
                              setEditTags([...editTags, newTagText.trim()]);
                              setNewTagText('');
                            }
                          }
                        }}
                        placeholder="Nova etiqueta..."
                        className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTagText.trim() && !editTags.includes(newTagText.trim())) {
                            setEditTags([...editTags, newTagText.trim()]);
                            setNewTagText('');
                          }
                        }}
                        className="px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 text-[10px] rounded cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Prioridade</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['baixa', 'media', 'alta', 'urgente'] as const).map((p) => {
                      const isActive = editPriority === p;
                      let activeColor = 'bg-sky-500/20 text-sky-300 border-sky-500';
                      if (p === 'baixa') activeColor = 'bg-slate-500/20 text-slate-300 border-slate-500';
                      if (p === 'alta') activeColor = 'bg-amber-500/20 text-amber-300 border-amber-500';
                      if (p === 'urgente') activeColor = 'bg-rose-500/20 text-rose-300 border-rose-500';
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditPriority(p)}
                          className={`px-1 py-1.5 rounded-md border text-[10px] font-mono uppercase text-center transition-all cursor-pointer ${
                            isActive ? activeColor + ' border-opacity-100 font-bold shadow-sm' : 'bg-slate-950 border-slate-850 text-slate-400 border-opacity-40 hover:border-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Responsável</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text"
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      placeholder="Ex: Ana Silva"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Data de Início</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Data de Entrega</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* External Links Section */}
              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Links Externos / URLs ({editLinks.length})</span>
                  </div>
                </div>

                {/* List of links */}
                {editLinks.length > 0 && (
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {editLinks.map((lnk) => (
                      <div key={lnk.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-850 hover:border-slate-700 transition-colors">
                        <a 
                          href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 transition-colors truncate flex-1"
                        >
                          <Link2 className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="font-semibold text-[11px] shrink-0 text-slate-300">[{lnk.title}]:</span>
                          <span className="truncate font-mono text-[10px] text-slate-400">{lnk.url}</span>
                        </a>
                        <button 
                          type="button"
                          onClick={() => {
                            setEditLinks(editLinks.filter(l => l.id !== lnk.id));
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new link fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Título (ex: Projeto Figma)"
                    className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newLinkUrl.trim()) {
                          const title = newLinkTitle.trim() || 'Link';
                          setEditLinks([...editLinks, { id: `lnk-${Date.now()}`, title, url: newLinkUrl.trim() }]);
                          setNewLinkTitle('');
                          setNewLinkUrl('');
                        }
                      }}
                      className="px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                    >
                      Add Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Estimation & Cost Estimates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Esforço Estimado (Horas)
                  </label>
                  <input 
                    type="number"
                    value={editEstimatedHours}
                    onChange={(e) => setEditEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
                    min="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="Ex: 8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Custo / Orçamento (R$)
                  </label>
                  <input 
                    type="number"
                    value={editBudgetCost}
                    onChange={(e) => setEditBudgetCost(e.target.value === '' ? '' : Number(e.target.value))}
                    min="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="Ex: 1200"
                  />
                </div>
              </div>

              {/* Subtask / Checklist Manager */}
              <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Subtarefas / Checklist</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    {editChecklist.filter(item => item.done).length}/{editChecklist.length}
                  </span>
                </div>

                {/* Subtasks Progress Bar */}
                {editChecklist.length > 0 && (
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(editChecklist.filter(item => item.done).length / editChecklist.length) * 100}%` }}
                    />
                  </div>
                )}

                {/* Subtasks list */}
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {editChecklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-850 hover:border-slate-700 transition-colors">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input 
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => {
                            const next = [...editChecklist];
                            next[idx] = { ...item, done: e.target.checked };
                            setEditChecklist(next);
                          }}
                          className="rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        />
                        <span className={`text-xs truncate ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.text}
                        </span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          setEditChecklist(editChecklist.filter(c => c.id !== item.id));
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new subtask input */}
                <div className="flex gap-1.5 pt-1">
                  <input 
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newChecklistItem.trim()) {
                          setEditChecklist([...editChecklist, { id: `chk-${Date.now()}`, text: newChecklistItem.trim(), done: false }]);
                          setNewChecklistItem('');
                        }
                      }
                    }}
                    placeholder="Nova subtarefa..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newChecklistItem.trim()) {
                        setEditChecklist([...editChecklist, { id: `chk-${Date.now()}`, text: newChecklistItem.trim(), done: false }]);
                        setNewChecklistItem('');
                      }
                    }}
                    className="px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3.5 bg-slate-900/90 shrink-0">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveCardChanges}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-950/50 hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
