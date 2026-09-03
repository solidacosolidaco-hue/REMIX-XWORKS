import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Type, Bold, Italic } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';

interface TextNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle: (nodeId: string, name: string) => void;
}

export const TextNode: React.FC<TextNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const content = node.data.content || node.name || 'Clique para editar o texto...';
  const fontSize = node.data.fontSize || 'base';
  const isBold = node.data.isBold ?? false;
  const isItalic = node.data.isItalic ?? false;

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl font-bold tracking-tight';
      case '3xl': return 'text-3xl font-extrabold tracking-tight';
      default: return 'text-base';
    }
  };

  return (
    <div
      id={`text-node-${node.id}`}
      className="p-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-slate-100 shadow-lg min-w-[200px] w-full h-full flex flex-col justify-between"
      onDoubleClick={() => setIsEditing(true)}
    >
      <div>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-400">
            <Type className="w-3.5 h-3.5" />
            <span>TEXTO LIVRE</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateData(node.id, { isBold: !isBold })}
              className={`p-1 rounded hover:bg-slate-800 ${isBold ? 'text-sky-400 bg-slate-800' : 'text-slate-400'}`}
              title="Negrito"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateData(node.id, { isItalic: !isItalic })}
              className={`p-1 rounded hover:bg-slate-800 ${isItalic ? 'text-sky-400 bg-slate-800' : 'text-slate-400'}`}
              title="Itálico"
            >
              <Italic className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {isEditing ? (
          <textarea
            autoFocus
            value={node.data.content ?? node.name}
            onChange={(e) => {
              onUpdateData(node.id, { content: e.target.value });
              onUpdateTitle(node.id, e.target.value.slice(0, 30));
            }}
            onBlur={() => setIsEditing(false)}
            className="w-full bg-slate-950/80 border border-sky-500/50 rounded-lg p-2 text-slate-100 focus:outline-none resize-none min-h-[80px]"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`${getFontSizeClass()} ${isBold ? 'font-semibold' : 'font-normal'} ${
              isItalic ? 'italic' : ''
            } text-slate-200 whitespace-pre-wrap leading-relaxed cursor-text`}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
};
