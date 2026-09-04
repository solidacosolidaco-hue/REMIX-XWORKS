import React, { useState } from 'react';
import {
  CanvasNode,
  Connection,
  ConnectionHandle,
  ConnectionRelationType,
  NodeColor,
  NodeStatus,
} from '../../types/canvas';
import { getNodeHandles } from '../../utils/geometry';
import { getConnectedContextForNode, getNodeNature, NATURE_DESCRIPTIONS, calculateConnectionValue } from '../../utils/flowIntelligence';
import { getNodeDeadlineInfo } from '../../utils/nodeDeadline';
import {
  X,
  Tag,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Copy,
  Maximize2,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Link,
  DollarSign,
  Building2,
  ShoppingCart,
  FolderGit2,
  Clock,
  Activity,
  Plus,
  Network,
  Receipt,
  FileSpreadsheet,
  Paperclip,
  Zap,
  Sparkles,
  ExternalLink,
  Search,
  PanelLeft,
  PanelRight,
  Move,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Calculator,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InspectorPanelProps {
  selectedNode: CanvasNode | null;
  selectedConnection: Connection | null;
  allNodes: CanvasNode[];
  connections: Connection[];
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateConnection: (connId: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (connId: string) => void;
  onFocusNode: (nodeId: string) => void;
  onOpenInvoiceModal?: (nodeId: string) => void;
  onSyncConnectionData?: (connId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onCopyNode?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => void;
  dockPosition: 'left' | 'right' | 'floating';
  onSetDockPosition: (pos: 'left' | 'right' | 'floating') => void;
  panelWidth: number;
  onSetPanelWidth: (width: number) => void;
  panelHeight?: number;
  onSetPanelHeight?: (height: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  selectedConnection,
  allNodes,
  connections,
  onClose,
  onUpdateNode,
  onUpdateNodeData,
  onDeleteNode,
  onUpdateConnection,
  onDeleteConnection,
  onFocusNode,
  onOpenInvoiceModal,
  onSyncConnectionData,
  onDuplicateNode,
  onCopyNode,
  onExpandNode,
  dockPosition,
  onSetDockPosition,
  panelWidth,
  onSetPanelWidth,
  panelHeight = 600,
  onSetPanelHeight,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);

  if (!selectedNode && !selectedConnection) return null;

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = dockPosition === 'right' ? startX - moveEvent.clientX : moveEvent.clientX - startX;
      onSetPanelWidth(Math.max(280, Math.min(800, startWidth + delta)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDownResizeBoth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelWidth;
    const startHeight = panelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      onSetPanelWidth(Math.max(280, Math.min(1000, startWidth + deltaX)));
      if (onSetPanelHeight) {
        onSetPanelHeight(Math.max(300, Math.min(900, startHeight + deltaY)));
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const nodeMap = new Map<string, CanvasNode>(allNodes.map((n) => [n.id, n]));

  // If a connection is selected:
  if (selectedConnection) {
    const fromNode = nodeMap.get(selectedConnection.fromId);
    const toNode = nodeMap.get(selectedConnection.toId);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: dockPosition === 'right' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dockPosition === 'right' ? 20 : -20 }}
        id="inspector-panel-connection"
        className="w-full h-full flex flex-col text-slate-200"
        style={{ width: dockPosition === 'floating' ? `${panelWidth}px` : '100%' }}
      >
        {/* Resize Handle for Docked */}
        {dockPosition !== 'floating' && (
          <div
            onMouseDown={handleMouseDownResize}
            className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-blue-500/50 transition-colors ${
              dockPosition === 'right' ? 'left-0' : 'right-0'
            }`}
          />
        )}

        {/* Floating Resize Handles (Corner & Edges) */}
        {dockPosition === 'floating' && (
          <>
            {/* Corner Resize Handle */}
            <div
              onMouseDown={handleMouseDownResizeBoth}
              className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize z-[110] flex items-end justify-end p-1.5 group"
            >
              <div className="relative w-4 h-4 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-full h-full border-r-4 border-b-4 border-blue-500/30 group-hover:border-blue-400 transition-colors rounded-br-sm" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-blue-500/20" />
              </div>
            </div>
            
            {/* Right Edge Resize Handle */}
            <div
              onMouseDown={handleMouseDownResizeBoth}
              className="absolute top-0 bottom-10 right-0 w-2 cursor-col-resize z-[105] hover:bg-blue-500/10 transition-colors"
            />
            
            {/* Bottom Edge Resize Handle */}
            <div
              onMouseDown={handleMouseDownResizeBoth}
              className="absolute left-0 right-10 bottom-0 h-2 cursor-row-resize z-[105] hover:bg-blue-500/10 transition-colors"
            />
          </>
        )}

        {/* Drag Handle for Floating */}
        {dockPosition === 'floating' && (
          <div className="h-2 bg-white/5 cursor-move flex items-center justify-center group">
            <div className="w-8 h-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Link className="w-4 h-4" />
              <span>PROPRIEDADES DA CONEXÃO</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSetDockPosition(dockPosition === 'floating' ? 'right' : 'floating')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title={dockPosition === 'floating' ? 'Prender no canto' : 'Desprender / Flutuar'}
              >
                {dockPosition === 'floating' ? <PanelRight className="w-4 h-4" /> : <Move className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Rótulo da Relação
            </label>
            <input
              type="text"
              value={selectedConnection.label || ''}
              placeholder="ex: gerou, originou, possui..."
              onChange={(e) => onUpdateConnection(selectedConnection.id, { label: e.target.value })}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Tipo Semântico de Conexão
            </label>
            <select
              value={selectedConnection.relationType || 'custom'}
              onChange={(e) =>
                onUpdateConnection(selectedConnection.id, {
                  relationType: e.target.value as ConnectionRelationType,
                })
              }
              className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="client_to_order">Cliente ➔ Pedido Comercial</option>
              <option value="order_to_project">Pedido ➔ Projeto / Produto</option>
              <option value="order_to_invoice">Pedido / Cliente ➔ Nota Fiscal</option>
              <option value="project_to_production">Projeto ➔ Manufatura / Qualidade</option>
              <option value="project_to_deadline">Projeto ➔ Prazo / Cronograma</option>
              <option value="dependency">Dependência Técnica</option>
              <option value="custom">Relação Customizada</option>
            </select>
          </div>

          {onSyncConnectionData && (
            <button
              onClick={() => onSyncConnectionData(selectedConnection.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors font-mono text-xs font-semibold"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Sincronizar Dados Entre Nós</span>
            </button>
          )}

          {selectedConnection.dataExchange && (
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-1 text-[11px] font-mono">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                Dados Transmitidos no Fluxo
              </span>
              {selectedConnection.dataExchange.customerName && (
                <div className="text-slate-300">
                  Cliente: <span className="text-white font-bold">{selectedConnection.dataExchange.customerName}</span>
                </div>
              )}
              {selectedConnection.dataExchange.orderCode && (
                <div className="text-slate-300">
                  Pedido: <span className="text-blue-300">{selectedConnection.dataExchange.orderCode}</span>
                </div>
              )}
              {selectedConnection.dataExchange.orderValue !== undefined && (
                <div className="text-slate-300">
                  Valor:{' '}
                  <span className="text-emerald-400 font-bold">
                    R$ {Number(selectedConnection.dataExchange.orderValue).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Financial Value Summary (Calculated) */}
          {(() => {
            const flowValue = calculateConnectionValue(fromNode!, toNode!);
            if (flowValue <= 0) return null;
            return (
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                  <DollarSign className="w-3 h-3" />
                  <span>Valor Identificado no Fluxo</span>
                </div>
                <div className="text-lg font-black text-white tracking-tighter">
                  R$ {flowValue.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] text-emerald-400/60 font-mono italic">
                  * A espessura da linha foi ajustada automaticamente.
                </div>
              </div>
            );
          })()}

          {/* Attachments Section (URLs / Local Paths) */}
          <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-widest">
                <Paperclip className="w-3 h-3" />
                <span>Anexos e Caminhos</span>
              </div>
            </div>

            <div className="space-y-2">
              {selectedConnection.attachments?.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-white/5 group/att">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {att.type === 'folder' ? <FolderOpen size={12} className="text-amber-400 shrink-0" /> : <Link size={12} className="text-blue-400 shrink-0" />}
                    <span className="text-[11px] text-slate-300 truncate font-mono" title={att.url}>{att.name || att.url}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition-opacity">
                    <button 
                      onClick={() => window.open(att.url, '_blank')}
                      className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                      title="Abrir Link"
                    >
                      <ExternalLink size={10} />
                    </button>
                    <button 
                      onClick={() => {
                        const newAtts = (selectedConnection.attachments || []).filter(a => a.id !== att.id);
                        onUpdateConnection(selectedConnection.id, { attachments: newAtts });
                      }}
                      className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400"
                      title="Remover"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-1.5 pt-1">
                <input 
                  type="text"
                  placeholder="Colar URL ou caminho da pasta..."
                  className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-500 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value;
                      if (!url) return;
                      const isFolder = url.includes('\\') || url.includes(':/') || !url.startsWith('http');
                      const newAtt = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: url.split(/[\\/]/).pop() || url,
                        url,
                        type: isFolder ? 'folder' as const : 'url' as const
                      };
                      onUpdateConnection(selectedConnection.id, { 
                        attachments: [...(selectedConnection.attachments || []), newAtt] 
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-[9px] text-slate-500 font-mono italic">
                * Pressione Enter para vincular o endereço.
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-2.5">
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-0.5">Origem:</div>
              <div
                onClick={() => fromNode && onFocusNode(fromNode.id)}
                className="text-xs font-semibold text-blue-300 hover:underline cursor-pointer truncate mb-1"
              >
                {fromNode?.name || selectedConnection.fromId}
              </div>
              {fromNode && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">Ponto de Origem</label>
                  <select
                    value={selectedConnection.fromHandle || 'right-2'}
                    onChange={(e) =>
                      onUpdateConnection(selectedConnection.id, {
                        fromHandle: e.target.value as ConnectionHandle,
                      })
                    }
                    className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {getNodeHandles(fromNode).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="text-[11px] font-mono text-slate-400 mb-0.5">Destino:</div>
              <div
                onClick={() => toNode && onFocusNode(toNode.id)}
                className="text-xs font-semibold text-emerald-300 hover:underline cursor-pointer truncate mb-1"
              >
                {toNode?.name || selectedConnection.toId}
              </div>
              {toNode && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">Ponto de Destino</label>
                  <select
                    value={selectedConnection.toHandle || 'left-2'}
                    onChange={(e) =>
                      onUpdateConnection(selectedConnection.id, {
                        toHandle: e.target.value as ConnectionHandle,
                      })
                    }
                    className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {getNodeHandles(toNode).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Estilo da Linha
            </label>
            <select
              value={selectedConnection.lineStyle || 'curved'}
              onChange={(e) =>
                onUpdateConnection(selectedConnection.id, {
                  lineStyle: e.target.value as any,
                })
              }
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
            >
              <option value="curved">Curva Suave (Bézier)</option>
              <option value="orthogonal">Ortogonal (Ângulos Retos)</option>
              <option value="straight">Reta</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Padrão do Traço
            </label>
            <select
              value={selectedConnection.strokePattern || 'solid'}
              onChange={(e) =>
                onUpdateConnection(selectedConnection.id, {
                  strokePattern: e.target.value as any,
                })
              }
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
            >
              <option value="solid">Linha Sólida</option>
              <option value="dashed">Linha Tracejada (Dashed)</option>
              <option value="dotted">Linha Pontilhada (Dotted)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Fluxo Ativo / Animado
            </label>
            <button
              onClick={() =>
                onUpdateConnection(selectedConnection.id, {
                  animated: !selectedConnection.animated,
                })
              }
              className={`w-full py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                selectedConnection.animated
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400 border-white/5'
              }`}
            >
              {selectedConnection.animated ? '✓ Animação Ativa' : 'Desativado'}
            </button>
          </div>

          <div className="pt-3 border-t border-white/5">
            <button
              onClick={() => onDeleteConnection(selectedConnection.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl transition-colors font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Conexão</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

  if (!selectedNode) return null;

  // Find incoming and outgoing connections
  const incoming = connections.filter((c) => c.toId === selectedNode.id);
  const outgoing = connections.filter((c) => c.fromId === selectedNode.id);

  const statuses: NodeStatus[] = [
    'A Fazer',
    'Em Andamento',
    'Em Produção',
    'Aprovado',
    'Orçamento',
    'Concluído',
    'Atrasado',
    'Alerta',
    'Pendente',
    'Cancelado',
  ];

  const colors: { color: NodeColor; label: string; bg: string }[] = [
    { color: 'slate', label: 'Cinza', bg: 'bg-slate-600' },
    { color: 'blue', label: 'Azul', bg: 'bg-blue-500' },
    { color: 'emerald', label: 'Verde', bg: 'bg-emerald-500' },
    { color: 'cyan', label: 'Ciano', bg: 'bg-cyan-500' },
    { color: 'amber', label: 'Âmbar', bg: 'bg-amber-500' },
    { color: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
    { color: 'purple', label: 'Roxo', bg: 'bg-purple-500' },
    { color: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
    { color: 'orange', label: 'Laranja', bg: 'bg-orange-500' },
  ];

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const currentTags = selectedNode.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      onUpdateNode(selectedNode.id, { tags: [...currentTags, newTagInput.trim()] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = (selectedNode.tags || []).filter((t) => t !== tagToRemove);
    onUpdateNode(selectedNode.id, { tags: updated });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: dockPosition === 'right' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      id="inspector-panel-node"
      className="w-full h-full flex flex-col text-slate-200"
      style={{ width: dockPosition === 'floating' ? `${panelWidth}px` : '100%' }}
    >
      {/* Resize Handle for Docked */}
      {dockPosition !== 'floating' && (
        <div
          onMouseDown={handleMouseDownResize}
          className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-blue-500/50 transition-colors ${
            dockPosition === 'right' ? 'left-0' : 'right-0'
          }`}
        />
      )}

      {/* Floating Resize Handles (Corner & Edges) */}
      {dockPosition === 'floating' && (
        <>
          {/* Corner Resize Handle */}
          <div
            onMouseDown={handleMouseDownResizeBoth}
            className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize z-[110] flex items-end justify-end p-1.5 group"
          >
            <div className="relative w-4 h-4 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-full h-full border-r-4 border-b-4 border-blue-500/30 group-hover:border-blue-400 transition-colors rounded-br-sm" />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-blue-500/20" />
            </div>
          </div>
          
          {/* Right Edge Resize Handle */}
          <div
            onMouseDown={handleMouseDownResizeBoth}
            className="absolute top-0 bottom-10 right-0 w-2 cursor-col-resize z-[105] hover:bg-blue-500/10 transition-colors"
          />
          
          {/* Bottom Edge Resize Handle */}
          <div
            onMouseDown={handleMouseDownResizeBoth}
            className="absolute left-0 right-10 bottom-0 h-2 cursor-row-resize z-[105] hover:bg-blue-500/10 transition-colors"
          />
        </>
      )}

      {/* Drag Handle for Floating */}
      {dockPosition === 'floating' && (
        <div className="h-2 bg-white/5 cursor-move flex items-center justify-center group">
          <div className="w-8 h-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                INSPETOR DE OBJETO
              </span>
              <div className="flex items-center gap-1 bg-white/5 rounded-md px-1 py-0.5">
                <button
                  onClick={() => onSetDockPosition('left')}
                  className={`p-0.5 rounded transition-colors ${dockPosition === 'left' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Prender à Esquerda"
                >
                  <PanelLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onSetDockPosition('right')}
                  className={`p-0.5 rounded transition-colors ${dockPosition === 'right' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Prender à Direita"
                >
                  <PanelRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onSetDockPosition('floating')}
                  className={`p-0.5 rounded transition-colors ${dockPosition === 'floating' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Desprender / Flutuar"
                >
                  <Move className="w-3 h-3" />
                </button>
              </div>
            </div>
            {(() => {
              const nature = getNodeNature(selectedNode.type);
              const natureColors: Record<string, string> = {
                'Base de Dados': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                'Fluxo Principal': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                'Controle Operacional': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                'Métrica de Desempenho': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                'Avanço de Status': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                'Prazo Crítico': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                'Documentação': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                'Área / Setor': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                'Suporte': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
              };
              
              return (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase ${natureColors[nature]}`}>
                      {nature}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                      Tipo: {selectedNode.type}
                    </span>
                  </div>
                  <div className="text-[10px] leading-tight text-slate-400 italic font-medium max-w-[200px]">
                    {NATURE_DESCRIPTIONS[nature]}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateNode(selectedNode.id, { locked: !selectedNode.locked })}
              className={`p-1.5 rounded-lg border ${
                selectedNode.locked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-white border-white/5 hover:border-white/20'
              }`}
              title={selectedNode.locked ? 'Destravar objeto' : 'Travar posição'}
            >
              {selectedNode.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Main Properties Form */}
      <div className="space-y-3.5 text-xs">
        {/* Title / Name */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Título / Nome</label>
          <input
            type="text"
            value={selectedNode.name}
            onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* CONNECTED INTELLIGENCE & TRACEABILITY CARD */}
        {(() => {
          const ctx = getConnectedContextForNode(selectedNode.id, allNodes, connections);
          if (!ctx) return null;
          return (
            <div className="p-3 bg-gradient-to-br from-blue-950/40 via-slate-950/60 to-slate-950/80 rounded-xl border border-blue-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Rastreabilidade Conectada
                </span>
              </div>

              {/* Connected Customer */}
              {ctx.connectedCustomer && (
                <div className="p-2 bg-slate-900/80 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">
                    Cliente do Produto / Pedido
                  </span>
                  <div
                    onClick={() => onFocusNode(ctx.connectedCustomer!.id)}
                    className="font-bold text-white text-xs hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{ctx.connectedCustomer.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    CNPJ: {ctx.connectedCustomer.data.cnpj || '00.000.000/0001-00'}
                  </div>
                </div>
              )}

              {/* Connected Projects/Products */}
              {selectedNode.type === 'customer' && ctx.connectedProjects.length > 0 && (
                <div className="p-2 bg-slate-900/80 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">
                    Produtos & Máquinas Vinculadas ({ctx.connectedProjects.length})
                  </span>
                  {ctx.connectedProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onFocusNode(p.id)}
                      className="text-[11px] font-medium text-cyan-300 hover:underline cursor-pointer flex items-center gap-1 truncate"
                    >
                      <FolderGit2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.name} ({p.data.projectProgress || 0}%)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial summary */}
              {ctx.totalValue > 0 && (
                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className="text-slate-400">Valor Total Vinculado:</span>
                  <span className="text-emerald-400 font-bold">
                    R$ {ctx.totalValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Direct NF-e Trigger Button */}
              {onOpenInvoiceModal && (
                <button
                  onClick={() => onOpenInvoiceModal(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors font-mono text-xs font-semibold"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Emitir Nota Fiscal (NF-e)</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Status & Assignee */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Status</label>
            <select
              value={selectedNode.status}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, { status: e.target.value as NodeStatus })
              }
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Responsável</label>
            <input
              type="text"
              value={selectedNode.assignee || ''}
              placeholder="Nome..."
              onChange={(e) => onUpdateNode(selectedNode.id, { assignee: e.target.value })}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Deadline & Border State Monitor (Excluding Base Nodes like Customer, Attachment and Document) */}
        {selectedNode.type !== 'customer' && selectedNode.type !== 'attachment' && selectedNode.type !== 'document' && (() => {
          const dInfo = getNodeDeadlineInfo(selectedNode);
          const rawStart = selectedNode.data.startDate || '';
          const rawDeadline = selectedNode.data.deliveryDeadline || selectedNode.data.dueDate || selectedNode.data.deadline || '';

          return (
            <div className={`p-3 rounded-xl border transition-all ${
              dInfo.state === 'delayed'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : dInfo.state === 'warning'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : dInfo.state === 'completed'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-950/40 border-white/5 text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sinalização de Prazo & Borda</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold flex items-center gap-1 border ${
                  dInfo.state === 'delayed'
                    ? 'bg-rose-600 text-white border-rose-300/40 animate-pulse shadow-sm shadow-rose-900/50'
                    : dInfo.state === 'warning'
                    ? 'bg-amber-500 text-slate-950 border-amber-300/50 font-bold'
                    : dInfo.state === 'completed'
                    ? 'bg-emerald-600/90 text-white border-emerald-400/40'
                    : 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                }`}>
                  {dInfo.state === 'delayed' && <AlertCircle className="w-2.5 h-2.5" />}
                  {dInfo.state === 'warning' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {dInfo.state === 'completed' && <CheckCircle className="w-2.5 h-2.5" />}
                  <span>{dInfo.badgeText || dInfo.label}</span>
                </span>
              </div>

              <div className="text-[11px] font-mono mb-2 text-slate-300 leading-snug">
                {dInfo.reason}
              </div>

              {/* Quick Date Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-white" />
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={rawStart}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, { startDate: e.target.value })
                    }
                    className="w-full bg-slate-900/80 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    Prazo Limite
                  </label>
                  <input
                    type="date"
                    value={rawDeadline}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, {
                        deliveryDeadline: e.target.value,
                        dueDate: e.target.value,
                        deadline: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900/80 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })()}


        {/* Color Theme Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Cor de Destaque</label>
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.color}
                onClick={() => onUpdateNode(selectedNode.id, { color: c.color })}
                className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                  selectedNode.color === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Connection Points Per Side (1 to 5) */}
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span>Pontos de Conexão por Lado</span>
            </label>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              Total: {(selectedNode.data.connectionPointsPerSide ?? 3) * 4}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((count) => {
              const current = selectedNode.data.connectionPointsPerSide ?? 3;
              const isSelected = current === count;
              return (
                <button
                  key={count}
                  onClick={() =>
                    onUpdateNodeData(selectedNode.id, { connectionPointsPerSide: count })
                  }
                  className={`py-1 text-xs font-mono rounded border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/20'
                  }`}
                  title={`${count} ponto${count > 1 ? 's' : ''} em cada uma das 4 faces (${count * 4} pontos no total)`}
                >
                  {count}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500">
            Define a quantidade de âncoras para conectar linhas nas 4 laterais do quadro.
          </p>
        </div>

        {/* Canvas Dimensions (Width & Height) */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
              Largura (px)
            </label>
            <input
              type="number"
              value={selectedNode.width}
              onChange={(e) => onUpdateNode(selectedNode.id, { width: Number(e.target.value) })}
              className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
              Altura (px)
            </label>
            <input
              type="number"
              value={selectedNode.height}
              onChange={(e) => onUpdateNode(selectedNode.id, { height: Number(e.target.value) })}
              className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Specific Object Data Fields */}
        {selectedNode.type === 'attachment' && (
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-1 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              Resumo da Central de Anexos
            </span>
            <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded border border-white/5">
              <span className="text-slate-400">Total de Anexos/URLs:</span>
              <span className="font-mono font-bold text-cyan-300">
                {(selectedNode.data.attachments || []).length} arquivo(s)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded border border-white/5">
              <span className="text-slate-400">Arquivos Validados:</span>
              <span className="font-mono font-bold text-emerald-400">
                {(selectedNode.data.attachments || []).filter((a) => a.checked).length} de {(selectedNode.data.attachments || []).length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Gerencie seus links, PDFs e desenhos diretamente no cartão interativo da lousa.
            </p>
          </div>
        )}

        {selectedNode.type === 'indicator' && (
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Parâmetros do Indicador KPI
            </span>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Valor do KPI (ex: 85%, R$ 4.8M)</label>
                <input
                  type="text"
                  value={selectedNode.data.kpiValue ?? '85%'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const update: Partial<CanvasNode['data']> = { kpiValue: val };
                    if (val.includes('%')) {
                      const num = parseFloat(val.replace(',', '.').replace('%', '').trim());
                      if (!isNaN(num)) {
                        update.progressPercent = num;
                        update.currentValue = num;
                      }
                    }
                    onUpdateNodeData(selectedNode.id, update);
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1.5 text-white font-mono font-bold text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tendência (ex: +18.4%)</label>
                  <input
                    type="text"
                    value={selectedNode.data.kpiTrend || '+18.4%'}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { kpiTrend: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-emerald-400 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tipo de Tendência</label>
                  <select
                    value={selectedNode.data.kpiTrendType || 'up'}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { kpiTrendType: e.target.value as any })}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                  >
                    <option value="up">📈 Alta / Positivo</option>
                    <option value="down">📉 Queda / Atenção</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Unidade / Comparativo (ex: vs mês ant.)</label>
                <input
                  type="text"
                  value={selectedNode.data.kpiUnit || 'vs mês ant.'}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { kpiUnit: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-slate-300 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'product' && (
          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold block mb-1">
              Atributos do Produto Industrial
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Código SKU</label>
                <input
                  type="text"
                  value={selectedNode.data.sku || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { sku: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Preço Unitário (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.unitPrice || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { unitPrice: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Estoque Atual</label>
                <input
                  type="number"
                  value={selectedNode.data.stockQty || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { stockQty: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Estoque Mínimo</label>
                <input
                  type="number"
                  value={selectedNode.data.minStockQty || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { minStockQty: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Categoria</label>
              <input
                type="text"
                value={selectedNode.data.category || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { category: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
              />
            </div>

            {/* Hierarchical BOM section in Inspector */}
            {selectedNode.data.components && selectedNode.data.components.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Estrutura de Nível Inferior (BOM)
                </span>
                <div className="space-y-1">
                  {selectedNode.data.components.map((comp, idx) => {
                    const compId = selectedNode.data.componentIds?.[idx];
                    return (
                      <div 
                        key={idx}
                        onClick={() => compId && onFocusNode(compId)}
                        className={`group flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5 ${compId ? 'hover:bg-indigo-500/10 cursor-pointer transition-colors' : ''}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                          <span className="text-[10px] text-slate-300 truncate group-hover:text-amber-200">{comp}</span>
                        </div>
                        {compId && <ArrowRight className="w-2.5 h-2.5 text-slate-600 group-hover:text-amber-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedNode.type === 'part' && (
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-1">
              Atributos da Peça / Componente
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Part Number</label>
                <input
                  type="text"
                  value={selectedNode.data.partNumber || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { partNumber: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Estoque de Peças</label>
                <input
                  type="number"
                  value={selectedNode.data.partStock || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { partStock: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Material</label>
                <input
                  type="text"
                  value={selectedNode.data.material || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { material: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Dimensões</label>
                <input
                  type="text"
                  value={selectedNode.data.dimensions || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { dimensions: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Fornecedor</label>
              <input
                type="text"
                value={selectedNode.data.supplier || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { supplier: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'service' && (
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold block mb-1">
              Atributos do Serviço Técnico
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Código Serviço</label>
                <input
                  type="text"
                  value={selectedNode.data.serviceCode || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { serviceCode: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Taxa por Hora (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.hourlyRate || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { hourlyRate: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Horas Estimadas</label>
                <input
                  type="number"
                  value={selectedNode.data.estimatedHours || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { estimatedHours: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Categoria</label>
                <input
                  type="text"
                  value={selectedNode.data.serviceCategory || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { serviceCategory: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'employee' && (
          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-bold block mb-1">
              Dados do Funcionário
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Registro (RE)</label>
                <input
                  type="text"
                  value={selectedNode.data.employeeId || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { employeeId: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Status de Serviço</label>
                <select
                  value={selectedNode.data.employeeStatus || 'Em Serviço'}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { employeeStatus: e.target.value as any })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                >
                  <option value="Disponível">Disponível</option>
                  <option value="Em Serviço">Em Serviço</option>
                  <option value="Em Férias">Em Férias</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={selectedNode.data.role || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { role: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Setor / Dpto</label>
                <input
                  type="text"
                  value={selectedNode.data.department || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { department: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Turno de Trabalho</label>
              <input
                type="text"
                value={selectedNode.data.shift || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { shift: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'supervisor' && (
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block mb-1">
              Dados da Liderança / Encarregado
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Código Encarregado</label>
                <input
                  type="text"
                  value={selectedNode.data.supervisorId || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { supervisorId: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Liderados (Qtd)</label>
                <input
                  type="number"
                  value={selectedNode.data.subordinatesCount || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { subordinatesCount: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Setor Sob Responsabilidade</label>
              <input
                type="text"
                value={selectedNode.data.managedSector || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { managedSector: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'sector' && (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block mb-1">
              Parâmetros do Setor Fabril
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Código Setor</label>
                <input
                  type="text"
                  value={selectedNode.data.sectorCode || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { sectorCode: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Capacidade / Ocupação</label>
                <input
                  type="text"
                  value={selectedNode.data.sectorCapacity || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { sectorCapacity: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Operadores Ativos</label>
                <input
                  type="number"
                  value={selectedNode.data.activeWorkers || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { activeWorkers: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Máquinas Ativas</label>
                <input
                  type="number"
                  value={selectedNode.data.activeMachineCount || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { activeMachineCount: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'financial_module' && (
          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
              Parâmetros Financeiros & Fiscais
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Receita Bruta (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.grossRevenue || 450000}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { grossRevenue: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Custo Produção (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.productionCost || 260000}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { productionCost: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Impostos (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.taxes || 49500}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { taxes: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Cód Fiscal / NF-e</label>
                <input
                  type="text"
                  value={selectedNode.data.fiscalCode || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { fiscalCode: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'invoice' && (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
              Dados da Nota Fiscal
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Número da Nota</label>
                <input
                  type="text"
                  value={selectedNode.data.invoiceNumber || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { invoiceNumber: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.invoiceValue || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { invoiceValue: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'progress' && (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block mb-1">
              Etapas / Tarefas
            </span>
            <div className="space-y-1.5">
              {(selectedNode.data.milestones || []).map((m: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={m.achieved}
                    onChange={(e) => {
                      const newMilestones = [...(selectedNode.data.milestones || [])];
                      newMilestones[idx].achieved = e.target.checked;
                      
                      const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                      const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                      
                      onUpdateNodeData(selectedNode.id, {
                        milestones: newMilestones,
                        currentValue: newProgress
                      });
                    }}
                    className="w-3 h-3 rounded border-slate-700 bg-slate-900 text-emerald-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const newMilestones = [...(selectedNode.data.milestones || [])];
                      newMilestones[idx].name = e.target.value;
                      onUpdateNodeData(selectedNode.id, { milestones: newMilestones });
                    }}
                    className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded px-1.5 py-1 text-white text-[10px] focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      const newMilestones = [...(selectedNode.data.milestones || [])];
                      newMilestones.splice(idx, 1);
                      
                      const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                      const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                      
                      onUpdateNodeData(selectedNode.id, {
                        milestones: newMilestones,
                        currentValue: newProgress
                      });
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newMilestones = [...(selectedNode.data.milestones || []), { name: 'Nova Etapa', achieved: false }];
                  
                  const achievedCount = newMilestones.filter((x: any) => x.achieved).length;
                  const newProgress = newMilestones.length > 0 ? Math.round((achievedCount / newMilestones.length) * 100) : 0;
                  
                  onUpdateNodeData(selectedNode.id, {
                    milestones: newMilestones,
                    currentValue: newProgress
                  });
                }}
                className="mt-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              >
                + Adicionar Etapa
              </button>
            </div>
          </div>
        )}

        {selectedNode.type === 'custom' && (
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              Atributos Customizados
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Orçamento (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.budget || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { budget: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Gasto Atual (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.spent || 0}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { spent: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded p-1 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Hierarchical BOM section in Inspector for Custom Nodes */}
            {selectedNode.data.components && selectedNode.data.components.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Subconjuntos e Peças (BOM)
                </span>
                <div className="space-y-1">
                  {selectedNode.data.components.map((comp, idx) => {
                    const compId = selectedNode.data.componentIds?.[idx];
                    return (
                      <div 
                        key={idx}
                        onClick={() => compId && onFocusNode(compId)}
                        className={`group flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5 ${compId ? 'hover:bg-amber-500/10 cursor-pointer transition-colors' : ''}`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                          <span className="text-[10px] text-slate-300 truncate group-hover:text-amber-200">{comp}</span>
                        </div>
                        {compId && <ArrowRight className="w-2.5 h-2.5 text-slate-600 group-hover:text-amber-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedNode.type === 'budget' && (
          <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/35 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                Dados da Proposta de Orçamento
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                ORÇAMENTO (ORC)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onExpandNode?.(selectedNode.id)}
              className="w-full py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Abrir Gestão Completa de Orçamento</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Nº Orçamento</label>
                <input
                  type="text"
                  value={selectedNode.data.budgetNumber || selectedNode.data.orderCode || ''}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      budgetNumber: e.target.value,
                      orderCode: e.target.value,
                    })
                  }
                  placeholder="ORC-2026-..."
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-amber-300 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Validade Proposta</label>
                <input
                  type="date"
                  value={selectedNode.data.validUntil || '2026-09-25'}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, { validUntil: e.target.value })
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Cliente Solicitante</label>
              <input
                type="text"
                value={selectedNode.data.customerName || ''}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, { customerName: e.target.value })
                }
                placeholder="Nome do cliente ou razão social"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Valor Proposto (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.totalOrderValue || selectedNode.data.orderValue || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateNodeData(selectedNode.id, { orderValue: val, totalOrderValue: val });
                  }}
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-amber-400 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Status da Proposta</label>
                <select
                  value={selectedNode.data.commercialStatus || 'Orçamento em Elaboração'}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, { commercialStatus: e.target.value })
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                >
                  <option value="Orçamento em Elaboração">Em Elaboração</option>
                  <option value="Orçamento Enviado">Enviado ao Cliente</option>
                  <option value="Em Negociação">Em Negociação</option>
                  <option value="Aprovado pelo Cliente">Aprovado pelo Cliente</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono">Condições Comerciais</label>
              <input
                type="text"
                value={selectedNode.data.paymentConditions || '30 DDL, Frete CIF'}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, { paymentConditions: e.target.value })
                }
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-slate-200 font-mono"
              />
            </div>

            {selectedNode.data.orderItems && selectedNode.data.orderItems.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Itens Orçados ({selectedNode.data.orderItems.length}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedNode.data.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/50 px-2 py-1 rounded">
                      <span className="truncate">{item.quantity}x {item.description}</span>
                      <span className="font-mono text-amber-400 shrink-0 ml-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedNode.type === 'order' && (
          <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                Dados do Pedido de Venda
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-blue-500/20 text-blue-300 border-blue-500/30">
                PEDIDO DE VENDA (PV)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onExpandNode?.(selectedNode.id)}
              className="w-full py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Abrir Gestão do Pedido de Venda (PV)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Nº Pedido (PV)</label>
                <input
                  type="text"
                  value={selectedNode.data.salesOrderNumber || selectedNode.data.orderCode || ''}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      salesOrderNumber: e.target.value,
                      orderCode: e.target.value,
                    })
                  }
                  placeholder="PV-..."
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-blue-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Origem (Orçamento)</label>
                <input
                  type="text"
                  value={selectedNode.data.budgetNumber || ''}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, { budgetNumber: e.target.value })
                  }
                  placeholder="ORC-2026-..."
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-amber-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Cliente Vinculado</label>
              <input
                type="text"
                value={selectedNode.data.customerName || ''}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, { customerName: e.target.value })
                }
                placeholder="Nome do cliente ou razão social"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
              />
            </div>

            {/* Modalidade: Sem Valor / Descritivo */}
            <div className="p-2 bg-slate-900/60 border border-white/10 rounded space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={Boolean(selectedNode.data.withoutValue)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdateNodeData(selectedNode.id, {
                      withoutValue: checked,
                      descriptiveOnly: checked,
                      ...(checked ? { orderValue: 0, totalOrderValue: 0 } : {}),
                    });
                  }}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                />
                <span className="font-semibold text-[11px] text-sky-300">
                  Pedido sem valor comercial (Apenas descritivo)
                </span>
              </label>
              {selectedNode.data.withoutValue && (
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">
                    Dados / Observações Descritivas:
                  </label>
                  <textarea
                    rows={2}
                    value={selectedNode.data.descriptiveNotes || ''}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, { descriptiveNotes: e.target.value })
                    }
                    placeholder="Especificações técnicas, escopo, desenhos..."
                    className="w-full bg-slate-950/80 border border-sky-500/30 rounded p-1.5 text-xs text-white placeholder-slate-500"
                  />
                </div>
              )}

              {/* OPÇÃO: OCULTAR O VALOR APENAS */}
              {!selectedNode.data.withoutValue && (
                <div className="pt-1.5 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 hover:text-amber-200">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedNode.data.hideValueOnly || selectedNode.data.hideValue)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onUpdateNodeData(selectedNode.id, {
                          hideValueOnly: checked,
                          hideValue: checked,
                        });
                      }}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      Ocultar o valor apenas (Exibição sigilosa)
                    </span>
                  </label>
                  <p className="text-[9px] text-slate-400 pl-5.5 mt-0.5">
                    O valor é mantido nos totais e relatórios, mas fica oculto no card do canvas.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Valor Total (R$)</label>
                {selectedNode.data.withoutValue ? (
                  <div className="w-full bg-sky-950/40 border border-sky-500/30 rounded p-1 text-xs text-sky-400 font-mono font-bold text-center">
                    Sem Valor
                  </div>
                ) : (
                  <input
                    type="number"
                    value={selectedNode.data.totalOrderValue || selectedNode.data.orderValue || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateNodeData(selectedNode.id, { orderValue: val, totalOrderValue: val });
                    }}
                    className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-emerald-400 font-mono font-bold"
                  />
                )}
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Status Comercial</label>
                <select
                  value={selectedNode.data.commercialStatus || 'Pedido de Venda Confirmado'}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, { commercialStatus: e.target.value })
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                >
                  <option value="Pedido de Venda Confirmado">PV Confirmado</option>
                  <option value="Em Produção">Em Produção</option>
                  <option value="Faturado">Faturado</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {selectedNode.data.orderItems && selectedNode.data.orderItems.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Itens Contratados ({selectedNode.data.orderItems.length}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedNode.data.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/50 px-2 py-1 rounded">
                      <span className="truncate">{item.quantity}x {item.description}</span>
                      <span className="font-mono text-blue-400 shrink-0 ml-1">
                        {selectedNode.data.withoutValue && item.subtotal === 0
                          ? 'Descritivo'
                          : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedNode.type === 'customer' && (
          <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Dados Cadastrais (Quadro Base)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {selectedNode.data.personType || 'PJ'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onExpandNode?.(selectedNode.id)}
              className="w-full py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar ou Abrir Cadastro Completo</span>
            </button>

            <div>
              <label className="text-[10px] text-slate-400">Razão Social</label>
              <input
                type="text"
                value={selectedNode.data.corporateName || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { corporateName: e.target.value })}
                placeholder="Nome empresarial oficial"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Nome Fantasia</label>
              <input
                type="text"
                value={selectedNode.data.tradeName || selectedNode.name || ''}
                onChange={(e) => {
                  onUpdateNodeData(selectedNode.id, { tradeName: e.target.value });
                  onUpdateNode(selectedNode.id, { name: e.target.value });
                }}
                placeholder="Nome fantasia de exibição"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">CNPJ / CPF</label>
                <input
                  type="text"
                  value={selectedNode.data.cnpj || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Inscrição Estadual (IE)</label>
                <input
                  type="text"
                  value={selectedNode.data.stateRegistration || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { stateRegistration: e.target.value })}
                  placeholder="Isento ou nº"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Segmento / Ramo</label>
              <input
                type="text"
                value={selectedNode.data.customerSegment || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { customerSegment: e.target.value })}
                placeholder="Ex: Manufatura & Metalmecânica"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Contato Comercial</label>
                <input
                  type="text"
                  value={selectedNode.data.contactName || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { contactName: e.target.value })}
                  placeholder="Nome do contato"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Cargo do Contato</label>
                <input
                  type="text"
                  value={selectedNode.data.contactRole || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { contactRole: e.target.value })}
                  placeholder="Gerente de Compras"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={selectedNode.data.phone || selectedNode.data.cellphone || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { phone: e.target.value, cellphone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">E-mail Comercial</label>
                <input
                  type="text"
                  value={selectedNode.data.email || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { email: e.target.value })}
                  placeholder="compras@cliente.com.br"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400">Cidade</label>
                <input
                  type="text"
                  value={selectedNode.data.city || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={selectedNode.data.state || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono uppercase text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Logradouro / Endereço</label>
              <input
                type="text"
                value={selectedNode.data.street || selectedNode.data.address || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { street: e.target.value, address: e.target.value })}
                placeholder="Rua, Av, Número, Bairro"
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Faturamento Histórico</label>
                <input
                  type="text"
                  value={selectedNode.data.totalRevenue || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { totalRevenue: e.target.value })}
                  placeholder="R$ 100.000"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Qtd. Pedidos Ativos</label>
                <input
                  type="number"
                  value={selectedNode.data.ordersCount ?? 1}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { ordersCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Condição Pgto</label>
                <input
                  type="text"
                  value={selectedNode.data.paymentTerm || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { paymentTerm: e.target.value })}
                  placeholder="30 DDL"
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Limite Crédito (R$)</label>
                <input
                  type="number"
                  value={selectedNode.data.creditLimit ?? 50000}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { creditLimit: Number(e.target.value) })}
                  className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono text-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {selectedNode.type === 'deadline' && (
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
              Configuração de Prazo
            </span>
            <div>
              <label className="text-[10px] text-slate-400">Data Final de Entrega</label>
              <input
                type="date"
                value={selectedNode.data.dueDate || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { dueDate: e.target.value })}
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Avanço (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={selectedNode.data.progressPercent ?? 0}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, {
                    progressPercent: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-900/60 border border-white/10 rounded p-1 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Tags & Marcadores</label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {(selectedNode.tags || []).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-slate-800 text-blue-300 border border-white/5 px-2 py-0.5 rounded-md text-[11px] font-mono"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-400 text-slate-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Adicionar tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            />
            <button
              onClick={handleAddTag}
              className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-xs text-slate-200 border border-white/5"
            >
              +
            </button>
          </div>
        </div>

        {/* Connected Objects / Graph Explorer */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              Conexões ({incoming.length + outgoing.length})
            </span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {incoming.map((c) => {
              const from = nodeMap.get(c.fromId);
              return (
                <div
                  key={c.id}
                  onClick={() => from && onFocusNode(from.id)}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-white/5 hover:border-blue-500/50 cursor-pointer text-[11px]"
                >
                  <span className="text-slate-400 truncate">
                    ← {from?.name || c.fromId} ({c.label || 'conectado'})
                  </span>
                  <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                </div>
              );
            })}

            {outgoing.map((c) => {
              const to = nodeMap.get(c.toId);
              return (
                <div
                  key={c.id}
                  onClick={() => to && onFocusNode(to.id)}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-white/5 hover:border-emerald-500/50 cursor-pointer text-[11px]"
                >
                  <span className="text-slate-300 truncate">
                    → {to?.name || c.toId} ({c.label || 'origem'})
                  </span>
                  <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              );
            })}

            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="text-[11px] text-slate-500 italic">
                Nenhuma conexão ativa. Arraste dos pontos para conectar.
              </div>
            )}
          </div>
        </div>

        {/* Delete / Actions Footer */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          {onExpandNode && (
            <button
              onClick={() => onExpandNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl transition-colors font-mono"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expandir Modo Foco</span>
            </button>
          )}
          {onCopyNode && (
            <button
              onClick={() => onCopyNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl transition-colors font-mono cursor-pointer"
              title="Copiar Quadro para Área de Transferência (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span>Copiar Quadro (Ctrl+C)</span>
            </button>
          )}
          {onDuplicateNode && (
            <button
              onClick={() => onDuplicateNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-colors font-mono"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicar Quadro (Ctrl+D)</span>
            </button>
          )}
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl transition-colors font-mono"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Objeto</span>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);
};
