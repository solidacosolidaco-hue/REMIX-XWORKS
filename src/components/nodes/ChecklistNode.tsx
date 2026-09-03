import React, { useState } from 'react';
import { CanvasNode, ChecklistItem } from '../../types/canvas';
import { CheckSquare, Plus, Trash2, CheckCircle2, Edit2, Check } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface ChecklistNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ChecklistNode: React.FC<ChecklistNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Checklist');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  const items: ChecklistItem[] = node.data.items || [];
  const completedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

  const toggleItem = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const done = updated.filter((i) => i.checked).length;
    const newPct = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    onUpdateData(node.id, { items: updated, progressPercent: newPct, currentValue: newPct });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
    };
    const updated = [...items, newItem];
    const done = updated.filter((i) => i.checked).length;
    const newPct = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    onUpdateData(node.id, { items: updated, progressPercent: newPct, currentValue: newPct });
    setNewItemText('');
    setIsAdding(false);
  };

  const startEditingItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemText(item.text);
  };

  const saveEditingItem = (itemId: string) => {
    if (!editingItemText.trim()) return;
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, text: editingItemText.trim() } : i
    );
    onUpdateData(node.id, { items: updated });
    setEditingItemId(null);
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    const done = updated.filter((i) => i.checked).length;
    const newPct = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    onUpdateData(node.id, { items: updated, progressPercent: newPct, currentValue: newPct });
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`checklist-node-${node.id}`}
      className="p-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                CHECKLIST
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
                  className="bg-slate-950 border border-emerald-500/50 rounded px-1 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-sm text-slate-100 leading-tight truncate cursor-pointer hover:underline hover:text-emerald-300 transition-colors"
                  title="Clique para editar o nome do checklist"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 ml-2">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1 bg-slate-950 border border-emerald-500/20 rounded flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] uppercase text-emerald-500 font-bold leading-none">Rastreio de Controle</span>
            <span className="text-[9px] font-mono text-slate-300">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] text-emerald-400">Verificado</span>
          </div>
        </div>

        {/* Checklist Items List */}
        <div className="space-y-1.5 my-3 max-h-[220px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isEditingThisItem = editingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`group/item flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                  item.checked
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 line-through'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                {isEditingThisItem ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      autoFocus
                      value={editingItemText}
                      onChange={(e) => setEditingItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingItem(item.id);
                        if (e.key === 'Escape') setEditingItemId(null);
                      }}
                      className="flex-1 bg-slate-950 border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => saveEditingItem(item.id)}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                      title="Salvar"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          item.checked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {item.checked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{item.text}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditingItem(item)}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Editar item"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Item Form */}
      <div className="pt-2 border-t border-slate-800">
        {isAdding ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Novo item..."
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={addItem}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Adicionar Item
          </button>
        )}
      </div>
    </div>
  );
};
