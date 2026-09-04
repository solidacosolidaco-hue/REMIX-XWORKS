import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Layers, Building2, Cpu, Factory, ShoppingCart } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface GroupNodeProps {
  node: CanvasNode;
  allNodes?: CanvasNode[];
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const GroupNode: React.FC<GroupNodeProps> = ({
  node,
  allNodes,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Novo Setor');

  const groupIconName = node.data.groupIcon;

  const renderIcon = () => {
    switch (groupIconName) {
      case 'Building2':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'Factory':
        return <Factory className="w-4 h-4 text-emerald-400" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const theme = getNodeColorTheme(node.color);

  const getBorderColor = () => {
    return `${theme.borderNormal} ${theme.bgSubtle}`;
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`group-node-${node.id}`}
      className={`w-full h-full rounded-2xl border-2 border-dashed ${getBorderColor()} p-4 flex flex-col justify-between pointer-events-none`}
    >
      {/* Top Header of the Group Frame */}
      <div className="flex flex-col gap-2 pb-2 border-b border-white/5 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-white/10 shrink-0">
              {renderIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <span 
                className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block cursor-help"
                title="Função do Setor: Um espaço para agrupar e organizar outros blocos. Arraste quadros para dentro desta área para separá-los por departamento, fase ou categoria e medir o progresso conjunto."
              >
                SETOR
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
                  className="bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-sm text-white font-bold focus:outline-none w-full"
                />
              ) : (
                <h2
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-bold text-base text-slate-100 tracking-tight cursor-pointer hover:underline hover:text-white transition-colors"
                  title="Clique para editar o nome do grupo"
                >
                  {node.name}
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* Content Progress Bar for Group */}
        <NodeProgressBar node={node} allNodes={allNodes} onUpdateData={onUpdateData} compact={false} />
      </div>
    </div>
  );
};
