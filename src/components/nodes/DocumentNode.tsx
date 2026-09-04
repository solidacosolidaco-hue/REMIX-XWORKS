import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { FileText, FileCode, FileSpreadsheet } from 'lucide-react';

interface DocumentNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const DocumentNode: React.FC<DocumentNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Informação Técnica');

  const docType = node.data.docType || 'CAD';
  const description = node.data.description || 'Documentação técnica do projeto.';

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const getIcon = () => {
    switch (docType) {
      case 'CAD':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'SHEET':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div
      id={`document-node-${node.id}`}
      className="p-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">
                INFORMAÇÃO TÉCNICA
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
                  className="bg-slate-950 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-sm text-slate-100 leading-tight truncate cursor-pointer hover:underline hover:text-indigo-300 transition-colors"
                  title="Clique para editar o nome do documento"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 my-2 text-xs">
          <p className="text-slate-300 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};
