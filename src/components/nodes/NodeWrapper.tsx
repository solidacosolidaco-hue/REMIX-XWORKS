import React from 'react';
import { CanvasNode, ConnectionHandle } from '../../types/canvas';
import { getNodeHandles } from '../../utils/geometry';
import { 
  NODE_DESCRIPTIONS, 
  getNodeNature, 
  getHandleConnectionGuidance 
} from '../../utils/flowIntelligence';
import { getNodeDeadlineInfo } from '../../utils/nodeDeadline';
import { getNodeColorTheme } from '../../utils/nodeTheme';
import { Lock, Unlock, Copy, CopyPlus, Trash2, Link, Sparkles, Maximize2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NodeWrapperProps {
  node: CanvasNode;
  isSelected: boolean;
  isInvestigated?: boolean;
  isDimmed?: boolean;
  isConnecting?: boolean;
  isSourceForConnection?: boolean;
  connectionHighlight?: 'valid' | 'invalid' | null;
  missingMandatoryHandles?: string[];
  validTargetHandles?: string[];
  suggestedHandles?: string[];
  isBottleneck?: boolean;
  onSelect: (nodeId: string, isMulti?: boolean) => void;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onResize?: (nodeId: string, width: number, height: number) => void;
  onStartConnect: (nodeId: string, handle: ConnectionHandle, coords: { x: number; y: number }) => void;
  onEndConnect?: (nodeId: string, handle?: ConnectionHandle) => void;
  onToggleLock?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onCopy?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onExpand?: (nodeId: string) => void;
  children: React.ReactNode;
}

export const NodeWrapper: React.FC<NodeWrapperProps> = ({
  node,
  isSelected,
  isInvestigated = false,
  isDimmed = false,
  isConnecting = false,
  isSourceForConnection = false,
  connectionHighlight = null,
  missingMandatoryHandles = [],
  validTargetHandles = [],
  suggestedHandles = [],
  isBottleneck = false,
  onSelect,
  onDragStart,
  onResize,
  onStartConnect,
  onEndConnect,
  onToggleLock,
  onDuplicate,
  onCopy,
  onDelete,
  onExpand,
  children,
}) => {
  const handles = getNodeHandles(node, node.data.connectionPointsPerSide ?? 3);
  const deadlineInfo = getNodeDeadlineInfo(node);
  const colorTheme = getNodeColorTheme(node.color);
  const isCompleted = node.data?.progressPercent === 100 || node.status === 'Concluído' || node.type === 'order';

  const getBorderColor = () => {
    if (connectionHighlight === 'valid') return 'ring-4 ring-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.5)] z-50';
    if (connectionHighlight === 'invalid') return 'ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)] opacity-30 grayscale-[50%]';
    if (isInvestigated) return 'ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]';
    
    // Priority: Delay states
    if (deadlineInfo.state === 'delayed') {
      if (isSelected) {
        return 'card-border-delayed ring-4 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.7)]';
      }
      return 'card-border-delayed ring-2 ring-rose-500/80';
    }

    if (deadlineInfo.state === 'warning') {
      if (isSelected) {
        return 'card-border-warning ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]';
      }
      return 'card-border-warning ring-2 ring-amber-500/70';
    }

    if (deadlineInfo.state === 'completed') {
      if (isSelected) {
        const glow = node.data?.enableGlow !== false ? colorTheme.shadowSelected : '';
        return `${colorTheme.ringSelected} ${glow} card-border-completed`.trim();
      }
      return 'card-border-completed';
    }

    if (isSelected) {
      const glow = node.data?.enableGlow !== false ? colorTheme.shadowSelected : '';
      return `${colorTheme.ringSelected} ${glow}`.trim();
    }
    return `${colorTheme.borderNormal} ${colorTheme.borderHover}`;
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (node.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = node.width;
    const initialHeight = node.height;

    const worldEl = document.getElementById('xcanvas-world');
    let scale = 1;
    if (worldEl) {
      const transform = window.getComputedStyle(worldEl).transform;
      if (transform && transform !== 'none') {
        const values = transform.split('(')[1].split(')')[0].split(',');
        scale = parseFloat(values[0]) || 1;
      }
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      const newWidth = Math.max(220, initialWidth + dx);
      const newHeight = Math.max(160, initialHeight + dy);

      onResize?.(node.id, Math.round(newWidth), Math.round(newHeight));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      id={`node-wrapper-${node.id}`}
      data-node-id={node.id}
      title={NODE_DESCRIPTIONS[node.type]}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onDragStart(node.id, e);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onExpand?.(node.id);
      }}
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        minHeight: `${node.height}px`,
        height: node.type === 'group' || node.type === 'sector' ? `${node.height}px` : 'auto',
        zIndex: isSelected ? 40 : node.type === 'group' || node.type === 'sector' ? 5 : 20,
      }}
      className={`group/node transition-shadow duration-150 select-none ${
        isDimmed ? 'card-glow-dimmed' : ''
      }`}
    >
      {/* Functional Nature Badge Removed for cleaner minimalist look */}

      {/* Deadline Status Badge on Top Right */}
      {deadlineInfo.state === 'delayed' && (
        <div className="absolute -top-3 right-3 z-30 pointer-events-none px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-extrabold shadow-lg shadow-rose-900/50 flex items-center gap-1 border border-rose-300/40 animate-pulse">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>{deadlineInfo.badgeText}</span>
        </div>
      )}

      {deadlineInfo.state === 'warning' && (
        <div className="absolute -top-3 right-3 z-30 pointer-events-none px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[9px] font-extrabold shadow-lg shadow-amber-950/50 flex items-center gap-1 border border-amber-300/60">
          <AlertTriangle className="w-2.5 h-2.5 text-slate-950" />
          <span>{deadlineInfo.badgeText}</span>
        </div>
      )}

      {deadlineInfo.state === 'completed' && (
        <div className="absolute -top-3 right-3 z-30 pointer-events-none px-2 py-0.5 rounded-full bg-emerald-600/90 text-white font-mono text-[8px] font-bold shadow flex items-center gap-1 border border-emerald-400/30 opacity-75 group-hover/node:opacity-100 transition-opacity">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>CONCLUÍDO</span>
        </div>
      )}

      {/* Node Content Container */}
      <div
        className={`relative w-full min-h-full h-full rounded-xl transition-all duration-200 ${getBorderColor()} ${isBottleneck ? 'animate-bottleneck-pulse' : ''}`}
      >
        {children}

        {/* Resize Handle (Bottom-Right Corner for manual expansion) */}
        {isSelected && !node.locked && (
          <div
            id={`resize-handle-${node.id}`}
            onMouseDown={handleResizeStart}
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 hover:bg-blue-400 rounded-full border-2 border-[#0B0F1A] cursor-se-resize shadow-lg z-50 flex items-center justify-center transition-transform hover:scale-110"
            title="Arraste para redimensionar / expandir manualmente"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        )}

        {/* Quick Float Toolbar when selected */}
        {isSelected && !node.locked && (
          <div
            id={`node-toolbar-${node.id}`}
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#0D1221]/95 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg shadow-2xl z-50 text-slate-300 text-xs font-mono"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] text-blue-400 font-semibold uppercase px-1">
              {node.type}
            </span>
            <div className="w-px h-3 bg-white/10" />
            <button
              id={`btn-expand-${node.id}`}
              onClick={() => onExpand?.(node.id)}
              className="p-1 hover:text-blue-400 hover:bg-white/10 rounded transition-colors"
              title="Expandir e Editar Detalhes"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              id={`btn-lock-${node.id}`}
              onClick={() => onToggleLock?.(node.id)}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={node.locked ? 'Destravar objeto' : 'Travar posição'}
            >
              {node.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              id={`btn-copy-${node.id}`}
              onClick={() => onCopy?.(node.id)}
              className="p-1 hover:text-sky-300 hover:bg-white/10 rounded transition-colors"
              title="Copiar objeto (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              id={`btn-dup-${node.id}`}
              onClick={() => onDuplicate?.(node.id)}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Duplicar objeto (Ctrl+D)"
            >
              <CopyPlus className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-del-${node.id}`}
              onClick={() => onDelete?.(node.id)}
              className="p-1 hover:text-rose-400 hover:bg-white/10 rounded transition-colors"
              title="Excluir objeto (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Locked Indicator Badge */}
        {node.locked && (
          <div className="absolute top-2 right-2 z-30 bg-[#0D1221]/80 border border-white/10 p-1 rounded text-amber-400">
            <Lock className="w-3 h-3" />
          </div>
        )}

        {/* Multiple Connection Ports / Handles per Side */}
        {handles.map((handle) => (
          <div
            key={handle.id}
            id={`handle-${node.id}-${handle.id}`}
            data-handle={handle.id}
            data-node-id={node.id}
            style={handle.percentStyle as React.CSSProperties}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnect(node.id, handle.id, { x: e.clientX, y: e.clientY });
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onEndConnect?.(node.id, handle.id);
            }}
            className={`absolute w-3.5 h-3.5 rounded-full z-40 cursor-crosshair transition-all duration-150 flex items-center justify-center ${
              isSourceForConnection
                ? 'bg-blue-400 ring-4 ring-blue-500/40 scale-125 opacity-100'
                : validTargetHandles.includes(handle.id)
                ? 'bg-emerald-400 opacity-100 animate-target-pulse border-2 border-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                : suggestedHandles.includes(handle.id)
                ? 'bg-emerald-500/40 opacity-80 animate-pulse border-2 border-emerald-500/30'
                : isConnecting
                ? 'bg-emerald-400 ring-2 ring-emerald-500/50 scale-110 opacity-100'
                : missingMandatoryHandles.includes(handle.id)
                ? 'bg-rose-500 opacity-100 animate-handle-alert border-2 border-rose-900 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : 'bg-slate-700/90 border-2 border-[#0B0F1A] hover:bg-blue-400 hover:scale-125 group-hover/node:bg-blue-400/90 group-hover/node:scale-110 opacity-0 group-hover/node:opacity-100'
            }`}
            title={
              `O que faz esta conexão?\n\n` +
              `↳ ${getHandleConnectionGuidance(node.type, handle.id)}\n\n` +
              `Dica: Clique, segure e arraste este ponto até outro bloco para conectar.`
            }
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#0B0F1A]" />
            
            {/* Floating Guidance Label */}
            {missingMandatoryHandles.includes(handle.id) && !isConnecting && (
              <div className={`absolute whitespace-nowrap pointer-events-none px-2 py-0.5 rounded text-[9px] font-bold tracking-tighter uppercase z-50 bg-rose-500 text-white shadow-lg ${
                handle.id.includes('top')
                  ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                  : handle.id.includes('bottom')
                  ? 'top-full mt-2 left-1/2 -translate-x-1/2'
                  : handle.id.includes('left')
                  ? 'right-full mr-2 top-1/2 -translate-y-1/2'
                  : 'left-full ml-2 top-1/2 -translate-y-1/2'
              }`}>
                {handle.id.includes('left') || handle.id.includes('top') ? 'Entrada Necessária' : 'Saída Necessária'}
                <div className={`absolute w-1.5 h-1.5 bg-rose-500 rotate-45 ${
                  handle.id.includes('top') ? 'bottom-[-3px] left-1/2 -translate-x-1/2' :
                  handle.id.includes('bottom') ? 'top-[-3px] left-1/2 -translate-x-1/2' :
                  handle.id.includes('left') ? 'right-[-3px] top-1/2 -translate-y-1/2' :
                  'left-[-3px] top-1/2 -translate-y-1/2'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
