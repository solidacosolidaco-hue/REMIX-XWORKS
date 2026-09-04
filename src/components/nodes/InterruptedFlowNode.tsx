import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  ZapOff,
  AlertTriangle,
  Check
} from 'lucide-react';

// Helper functions to convert between local "DD/MM/YYYY HH:MM" format and native "YYYY-MM-DDTHH:MM" format
const convertToDateTimeLocalValue = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  try {
    // 1. Check for custom phrase like "Previsão: Hoje às 18:00"
    if (dateStr.toLowerCase().includes('hoje') && dateStr.includes(':')) {
      const matchTime = dateStr.match(/(\d{2}):(\d{2})/);
      if (matchTime) {
        const [_, hour, minute] = matchTime;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hour}:${minute}`;
      }
    }

    // 2. Format DD/MM/YYYY HH:MM
    const matchDmyHm = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (matchDmyHm) {
      const [_, day, month, year, hour, minute] = matchDmyHm;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    // 3. Format DD/MM/YYYY
    const matchDmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDmy) {
      const [_, day, month, year] = matchDmy;
      return `${year}-${month}-${day}T12:00`;
    }

    // 4. Format YYYY-MM-DD HH:MM
    const matchYmdHm = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (matchYmdHm) {
      const [_, year, month, day, hour, minute] = matchYmdHm;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    // 5. General fallback
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      const hh = String(parsed.getHours()).padStart(2, '0');
      const min = String(parsed.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
  } catch (e) {
    console.error('Error parsing datetime:', e);
  }
  return '';
};

const formatFromDateTimeLocal = (val: string): string => {
  if (!val) return '';
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (match) {
    const [_, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }
  return val;
};

interface InterruptedFlowNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle: (nodeId: string, name: string) => void;
}

export const InterruptedFlowNode: React.FC<InterruptedFlowNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Fluxo Interrompido');

  const isResolved = node.data?.isResolved ?? false;
  const incidentDescription = node.data?.incidentDescription ?? '';
  const incidentDate = node.data?.incidentDate ?? '';
  const incidentSector = node.data?.incidentSector ?? '';
  const incidentResponsible = node.data?.incidentResponsible ?? '';
  const incidentResolutionDate = node.data?.incidentResolutionDate ?? '';

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    onUpdateData(node.id, { [field]: value });
  };

  const toggleResolved = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextResolvedState = !isResolved;
    onUpdateData(node.id, {
      isResolved: nextResolvedState,
      // If marking as resolved and no resolution date specified yet, auto-fill current date/time
      ...(nextResolvedState && !incidentResolutionDate
        ? {
            incidentResolutionDate:
              new Date().toLocaleDateString('pt-BR') +
              ' ' +
              new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          }
        : {}),
    });
  };

  return (
    <div
      id={`interrupted-node-${node.id}`}
      className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col justify-between w-full h-full transition-all duration-300 ${
        isResolved
          ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950/95 border-emerald-500/50 shadow-emerald-950/40'
          : 'bg-gradient-to-br from-rose-950/70 via-slate-900/95 to-slate-950/95 border-rose-500/60 shadow-rose-950/50 ring-1 ring-rose-500/30'
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider">
            <ZapOff
              className={`w-4 h-4 shrink-0 ${
                isResolved ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
              }`}
            />
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded border border-rose-400 focus:outline-none w-36 font-semibold"
              />
            ) : (
              <h3
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className={`cursor-pointer hover:underline truncate max-w-[170px] ${
                  isResolved ? 'text-emerald-300' : 'text-rose-300 font-black'
                }`}
                title="Clique para editar o título"
              >
                {node.name || 'Fluxo Interrompido'}
              </h3>
            )}
          </div>

          {/* Status Badge */}
          <button
            onClick={toggleResolved}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              isResolved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
            }`}
            title="Clique para alterar status de resolução"
          >
            {isResolved ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>RESOLVIDO</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                <span>FLUXO PARADO</span>
              </>
            )}
          </button>
        </div>

        {/* Warning / Resolved Banner */}
        <div
          className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
            isResolved
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
          }`}
        >
          {isResolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          )}
          <div className="text-[11px] leading-tight">
            {isResolved ? (
              <p>
                <strong className="font-semibold text-emerald-300">Fluxo Normalizado:</strong> O
                problema foi resolvido e a animação das conexões foi reestabelecida.
              </p>
            ) : (
              <p>
                <strong className="font-semibold text-rose-300">Animação Interrompida:</strong> Posicione
                este quadro sobre qualquer linha de fluxo para travar a animação até ser resolvido.
              </p>
            )}
          </div>
        </div>

        {/* Fields Container */}
        <div className="space-y-2 text-xs">
          {/* O que aconteceu */}
          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-rose-400" />
              <span>O que aconteceu (Problema):</span>
            </label>
            <textarea
              value={incidentDescription}
              onChange={(e) => handleFieldChange('incidentDescription', e.target.value)}
              placeholder="Descreva a falha, quebra, falta de insumo ou gargalo..."
              rows={2}
              className="w-full bg-slate-900/90 border border-white/10 rounded-lg p-2 text-slate-200 placeholder-slate-500 text-xs focus:border-rose-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Grid: Quando Aconteceu & Setor */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Quando Aconteceu:</span>
              </label>
              <input
                type="datetime-local"
                value={convertToDateTimeLocalValue(incidentDate)}
                onChange={(e) => handleFieldChange('incidentDate', formatFromDateTimeLocal(e.target.value))}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {}
                }}
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-rose-500/50 focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>Setor:</span>
              </label>
              <input
                type="text"
                value={incidentSector}
                onChange={(e) => handleFieldChange('incidentSector', e.target.value)}
                placeholder="Ex: Usinagem"
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-rose-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Grid: Responsável & Data de Resolução */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-blue-400" />
                <span>Responsável:</span>
              </label>
              <input
                type="text"
                value={incidentResponsible}
                onChange={(e) => handleFieldChange('incidentResponsible', e.target.value)}
                placeholder="Ex: Carlos (Líder)"
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-rose-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Previsão/Resolução:</span>
              </label>
              <input
                type="datetime-local"
                value={convertToDateTimeLocalValue(incidentResolutionDate)}
                onChange={(e) => handleFieldChange('incidentResolutionDate', formatFromDateTimeLocal(e.target.value))}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {}
                }}
                className="w-full bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-rose-500/50 focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="pt-3 border-t border-white/10 mt-3">
        {isResolved ? (
          <button
            onClick={toggleResolved}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            title="Reabrir este problema e interromper novamente as linhas de fluxo"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>REABRIR OCORRÊNCIA (PARAR FLUXO)</span>
          </button>
        ) : (
          <button
            onClick={toggleResolved}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            title="Marcar como resolvido e reativar a animação e o movimento das linhas de fluxo"
          >
            <Check className="w-4 h-4 text-emerald-200 group-hover:scale-125 transition-transform" />
            <span>MARCAR COMO RESOLVIDO (LIBERAR FLUXO)</span>
          </button>
        )}
      </div>
    </div>
  );
};
