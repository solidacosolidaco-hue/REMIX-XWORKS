import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { User, ShieldCheck, Clock } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface EmployeeNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const EmployeeNode: React.FC<EmployeeNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Funcionário');

  const employeeId = node.data.employeeId || 'FUNC-1092';
  const role = node.data.role || 'Operador de Usinagem CNC';
  const shift = node.data.shift || 'Turno Manhã (07:00 - 16:48)';
  const department = node.data.department || 'Usinagem Heavy-Duty';
  const employeeStatus = node.data.employeeStatus || 'Em Serviço';

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const getStatusColor = () => {
    switch (employeeStatus) {
      case 'Disponível':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Em Serviço':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'Em Férias':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-white/10';
    }
  };

  return (
    <div
      id={`employee-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-950/90 border border-blue-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              FUNCIONÁRIO
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-semibold ${getStatusColor()}`}>
            {employeeStatus}
          </span>
        </div>

        {/* Editable Title */}
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
            className="bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-blue-300 transition-colors"
            title="Clique para editar o nome do funcionário"
          >
            {node.name}
          </h3>
        )}

        <p className="text-xs text-slate-300 font-medium mb-1 truncate">
          {role}
        </p>
        <p className="text-[11px] text-slate-400 mb-2 font-mono truncate">
          RE: {employeeId} • {department}
        </p>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-400" />
          <span className="truncate">{shift}</span>
        </div>
      </div>
    </div>
  );
};
