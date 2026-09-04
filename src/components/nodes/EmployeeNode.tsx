import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { User, Clock, Check } from 'lucide-react';
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const employeeId = node.data.employeeId || 'FUNC-1092';
  const role = node.data.role || 'Operador de Usinagem CNC';
  const shift = node.data.shift || 'Turno Manhã (07:00 - 16:48)';
  const department = node.data.department || 'Usinagem Heavy-Duty';
  const employeeStatus = node.data.employeeStatus || 'Em Serviço';

  const startEditing = (field: string, initialVal: string) => {
    setEditingField(field);
    setTempValue(initialVal);
  };

  const saveEditing = (field: string) => {
    setEditingField(null);
    const val = tempValue.trim();

    if (field === 'title') {
      if (val) onUpdateTitle?.(node.id, val);
    } else if (field === 'employeeId') {
      onUpdateData?.(node.id, { employeeId: val || 'FUNC-100' });
    } else if (field === 'role') {
      onUpdateData?.(node.id, { role: val || 'Operador' });
    } else if (field === 'department') {
      onUpdateData?.(node.id, { department: val || 'Produção' });
    } else if (field === 'shift') {
      onUpdateData?.(node.id, { shift: val || 'Turno Geral' });
    }
  };

  const cycleStatus = () => {
    const statuses: ('Disponível' | 'Em Serviço' | 'Em Férias' | 'Ausente')[] = [
      'Em Serviço',
      'Disponível',
      'Em Férias',
      'Ausente',
    ];
    const currentIdx = statuses.indexOf(employeeStatus as any);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length < 0 ? 0 : (currentIdx + 1) % statuses.length];
    onUpdateData?.(node.id, { employeeStatus: nextStatus });
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

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              Ativo
            </span>
          </div>
        </div>

        {/* Editable Title / Nome */}
        {editingField === 'title' ? (
          <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('title');
                if (e.key === 'Escape') setEditingField(null);
              }}
              className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500 shrink-0 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title', node.name || 'Funcionário');
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all flex items-center justify-between"
            title="Clique para editar o nome do funcionário"
          >
            <span>{node.name}</span>
            <span className="text-[10px] text-blue-400 opacity-60">✏️</span>
          </h3>
        )}

        {/* Cargo Editable */}
        {editingField === 'role' ? (
          <input
            type="text"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEditing('role')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing('role');
              if (e.key === 'Escape') setEditingField(null);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Cargo"
            className="bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full mb-1"
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              startEditing('role', role);
            }}
            className="text-xs text-slate-300 font-medium mb-1 truncate cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all"
            title="Clique para editar o cargo"
          >
            {role}
          </p>
        )}

        {/* RE & Department Editable */}
        <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center gap-1.5 flex-wrap">
          <span>RE:</span>
          {editingField === 'employeeId' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('employeeId')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('employeeId');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-20"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('employeeId', employeeId);
              }}
              className="cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all font-semibold text-slate-200 border-b border-dashed border-slate-600"
              title="Clique para editar o registro RE"
            >
              {employeeId}
            </span>
          )}

          <span>•</span>

          {editingField === 'department' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('department')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('department');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-28"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('department', department);
              }}
              className="cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all truncate max-w-[120px] border-b border-dashed border-slate-600"
              title="Clique para editar o departamento"
            >
              {department}
            </span>
          )}
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />
      </div>

      {/* Footer / Turno */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1 w-full">
          <Clock className="w-3 h-3 text-blue-400 shrink-0" />
          {editingField === 'shift' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('shift')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('shift');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('shift', shift);
              }}
              className="truncate cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all"
              title="Clique para editar o turno"
            >
              {shift}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
