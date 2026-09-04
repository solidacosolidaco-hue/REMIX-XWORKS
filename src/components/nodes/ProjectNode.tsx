import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { FolderGit2, User } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';

interface ProjectNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ProjectNode: React.FC<ProjectNodeProps> = ({ node, onUpdateData, onUpdateTitle }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Projeto');

  const projectCode = node.data.projectCode || 'PX-2026-042';
  const clientName = node.data.clientName || 'Empresa ABC S/A';
  const subModules = node.data.subModules || [
    'Desenhos Mecânicos 3D (SolidWorks)',
    'Esquema Hidráulico com Válvulas Proporcionais',
    'Programação de CLP & Segurança NR-12',
  ];

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`project-node-${node.id}`}
      className="p-4 bg-[#1A2235]/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              PROJETO
            </span>
          </div>

          <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-cyan-300 border border-white/5 font-semibold">
            {projectCode}
          </span>
        </div>

        {/* Project Title & Client */}
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
            className="bg-slate-900 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-cyan-300 transition-colors"
            title="Clique para editar o título do projeto"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-400 mb-2 font-mono">
          Cliente: {clientName}
        </p>

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Engineering Modules List */}
        <div className="space-y-1 my-2">
          {subModules.slice(0, 2).map((sub, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/40 p-1.5 rounded border border-white/5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1 text-slate-300">
          <User className="w-3 h-3 text-cyan-400" />
          <span>{node.assignee || 'João Mendes'}</span>
        </div>
        <span className="text-slate-500 text-[10px]">Engenharia</span>
      </div>
    </div>
  );
};
