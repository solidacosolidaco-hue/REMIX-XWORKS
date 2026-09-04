import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Factory, Cpu, Users, Check } from 'lucide-react';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface SectorNodeProps {
  node: CanvasNode;
  allNodes?: CanvasNode[];
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const SectorNode: React.FC<SectorNodeProps> = ({
  node,
  allNodes,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const sectorCode = node.data.sectorCode || 'ST-USINAGEM-01';
  const sectorCapacity = node.data.sectorCapacity || '85% Utilização';
  const activeWorkers = node.data.activeWorkers ?? 18;
  const activeMachineCount = node.data.activeMachineCount ?? 8;

  const startEditing = (field: string, initialVal: string) => {
    setEditingField(field);
    setTempValue(initialVal);
  };

  const saveEditing = (field: string) => {
    setEditingField(null);
    const val = tempValue.trim();

    if (field === 'title') {
      if (val) onUpdateTitle?.(node.id, val);
    } else if (field === 'sectorCode') {
      onUpdateData?.(node.id, { sectorCode: val || 'ST-01' });
    } else if (field === 'sectorCapacity') {
      onUpdateData?.(node.id, { sectorCapacity: val || '100% Capacidade' });
    } else if (field === 'activeWorkers') {
      const parsed = parseInt(val, 10);
      onUpdateData?.(node.id, { activeWorkers: isNaN(parsed) ? 0 : parsed });
    } else if (field === 'activeMachineCount') {
      const parsed = parseInt(val, 10);
      onUpdateData?.(node.id, { activeMachineCount: isNaN(parsed) ? 0 : parsed });
    }
  };

  return (
    <div
      id={`sector-node-${node.id}`}
      className="p-4 bg-gradient-to-br from-slate-950/80 via-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              SETOR
            </span>
          </div>

          {/* Sector Code Editable */}
          {editingField === 'sectorCode' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('sectorCode')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('sectorCode');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 focus:outline-none w-24"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('sectorCode', sectorCode);
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-mono text-emerald-300 border border-white/5 font-semibold cursor-pointer transition-all"
              title="Clique para editar código do setor"
            >
              {sectorCode}
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
              className="bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 shrink-0 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title', node.name || 'Setor Industrial');
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/10 rounded px-1 -mx-1 transition-all flex items-center justify-between"
            title="Clique para editar nome do setor"
          >
            <span>{node.name}</span>
            <span className="text-[10px] text-emerald-400 opacity-60">✏️</span>
          </h3>
        )}

        {/* Sector Capacity Editable */}
        {editingField === 'sectorCapacity' ? (
          <input
            type="text"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEditing('sectorCapacity')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing('sectorCapacity');
              if (e.key === 'Escape') setEditingField(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full mb-2 font-mono"
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              startEditing('sectorCapacity', sectorCapacity);
            }}
            className="text-xs text-slate-400 mb-2 font-mono cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/10 rounded px-1 -mx-1 transition-all"
            title="Clique para editar capacidade do setor"
          >
            Capacidade: <span className="text-slate-200">{sectorCapacity}</span>
          </p>
        )}

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono mb-2">
          {/* OPERADORES */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">OPERADORES</span>
            {editingField === 'activeWorkers' ? (
              <input
                type="number"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('activeWorkers')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('activeWorkers');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-emerald-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('activeWorkers', String(activeWorkers));
                }}
                className="flex items-center gap-1 text-slate-200 font-bold cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar número de operadores"
              >
                <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{activeWorkers} ativos</span>
              </div>
            )}
          </div>

          {/* MAQUINÁRIO */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">MAQUINÁRIO</span>
            {editingField === 'activeMachineCount' ? (
              <input
                type="number"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('activeMachineCount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('activeMachineCount');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-emerald-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('activeMachineCount', String(activeMachineCount));
                }}
                className="flex items-center gap-1 text-slate-200 font-bold cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar número de máquinas"
              >
                <Cpu className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{activeMachineCount} máquinas</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
