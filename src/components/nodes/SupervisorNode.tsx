import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { ShieldCheck, Users, Award, Check } from 'lucide-react';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface SupervisorNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const SupervisorNode: React.FC<SupervisorNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const supervisorId = node.data.supervisorId || 'ENC-401';
  const managedSector = node.data.managedSector || 'Caldeiraria & Solda Especializada';
  const subordinatesCount = node.data.subordinatesCount ?? 14;
  const rawCertifications = node.data.certifications;
  const certificationsStr = Array.isArray(rawCertifications)
    ? rawCertifications.join(', ')
    : typeof rawCertifications === 'string'
    ? rawCertifications
    : 'NR-12, ISO 9001, Green Belt Six Sigma';

  const startEditing = (field: string, initialVal: string) => {
    setEditingField(field);
    setTempValue(initialVal);
  };

  const saveEditing = (field: string) => {
    setEditingField(null);
    const val = tempValue.trim();

    if (field === 'title') {
      if (val) onUpdateTitle?.(node.id, val);
    } else if (field === 'supervisorId') {
      onUpdateData?.(node.id, { supervisorId: val || 'ENC-401' });
    } else if (field === 'managedSector') {
      onUpdateData?.(node.id, { managedSector: val || 'Setor Geral' });
    } else if (field === 'subordinatesCount') {
      const parsed = parseInt(val, 10);
      onUpdateData?.(node.id, { subordinatesCount: isNaN(parsed) ? 0 : parsed });
    } else if (field === 'certifications') {
      const certsArr = val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
      onUpdateData?.(node.id, { certifications: certsArr });
    }
  };

  return (
    <div
      id={`supervisor-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950/90 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              ENCARREGADO / LÍDER
            </span>
          </div>

          {/* Supervisor ID / Código Editable */}
          {editingField === 'supervisorId' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('supervisorId')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('supervisorId');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-amber-300 focus:outline-none w-20"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('supervisorId', supervisorId);
              }}
              className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-bold cursor-pointer transition-all"
              title="Clique para editar o código do encarregado"
            >
              {supervisorId}
            </span>
          )}
        </div>

        {/* Editable Title */}
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
              className="bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-amber-600 text-slate-950 hover:bg-amber-500 shrink-0 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title', node.name || 'Encarregado');
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all flex items-center justify-between"
            title="Clique para editar o nome do encarregado"
          >
            <span>{node.name}</span>
            <span className="text-[10px] text-amber-400 opacity-60">✏️</span>
          </h3>
        )}

        {/* Managed Sector Editable */}
        {editingField === 'managedSector' ? (
          <input
            type="text"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEditing('managedSector')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing('managedSector');
              if (e.key === 'Escape') setEditingField(null);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Nome do Setor"
            className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full mb-2"
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              startEditing('managedSector', managedSector);
            }}
            className="text-xs text-slate-300 font-medium mb-2 truncate cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all"
            title="Clique para editar o setor gerido"
          >
            Setor: <span className="text-white font-semibold">{managedSector}</span>
          </p>
        )}

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono">
          {/* EQUIPE / Subordinados */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">EQUIPE</span>
            {editingField === 'subordinatesCount' ? (
              <input
                type="number"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('subordinatesCount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('subordinatesCount');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full font-mono"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('subordinatesCount', String(subordinatesCount));
                }}
                className="flex items-center gap-1 text-slate-200 font-bold cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar quantidade de funcionários na equipe"
              >
                <Users className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{subordinatesCount} func.</span>
              </div>
            )}
          </div>

          {/* CERTIFICAÇÕES */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">CERTIFICAÇÕES</span>
            {editingField === 'certifications' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('certifications')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('certifications');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Ex: NR-12, ISO 9001"
                className="bg-slate-900 border border-amber-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full font-mono"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('certifications', certificationsStr);
                }}
                className="flex items-center gap-1 text-slate-200 font-semibold truncate cursor-pointer hover:text-amber-300 hover:bg-amber-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar certificações (separadas por vírgula)"
              >
                <Award className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{certificationsStr}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
        <span>Supervisão Operacional</span>
        <span className="text-amber-400 font-bold">Liderança OK</span>
      </div>
    </div>
  );
};
