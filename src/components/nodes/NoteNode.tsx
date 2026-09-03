import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { StickyNote, AlertTriangle, Calendar } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface NoteNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle: (nodeId: string, name: string) => void;
}

export const NoteNode: React.FC<NoteNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Nota / Lembrete');

  const isWarning = node.data.isWarning ?? false;
  const noteText = node.data.noteText || node.data.description || '⚠️ Verificar itens críticos...';

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const theme = getNodeColorTheme(node.color);

  const getColorTheme = () => {
    return `bg-gradient-to-br ${theme.bgGradient} ${theme.borderNormal} text-slate-100`;
  };

  return (
    <div
      id={`note-node-${node.id}`}
      className={`p-4 rounded-xl border backdrop-blur-md shadow-xl flex flex-col justify-between w-full h-full ${getColorTheme()}`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider">
            {isWarning ? (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                ALERTA
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-300">
                <StickyNote className="w-3.5 h-3.5" />
                NOTA
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Calendar className="w-3 h-3 text-white" />
            <span>{node.updatedAt || node.createdAt}</span>
          </div>
        </div>

        {/* Note Title */}
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
            className="bg-slate-950 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-2"
          />
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-semibold text-sm text-slate-100 mb-2 cursor-pointer hover:underline hover:text-amber-300 transition-colors"
            title="Clique para editar o título da nota"
          >
            {node.name}
          </div>
        )}

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Note Body */}
        {isEditing ? (
          <textarea
            autoFocus
            value={node.data.noteText || ''}
            onChange={(e) => onUpdateData(node.id, { noteText: e.target.value })}
            onBlur={() => setIsEditing(false)}
            className="w-full bg-slate-950/80 border border-amber-500/50 rounded-lg p-2 text-sm text-slate-100 focus:outline-none resize-none min-h-[70px]"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="text-xs sm:text-sm leading-relaxed text-slate-300/90 whitespace-pre-wrap mb-2 cursor-pointer hover:text-white"
          >
            {noteText}
          </p>
        )}
      </div>
    </div>
  );
};
