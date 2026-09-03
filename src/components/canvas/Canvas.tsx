import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CanvasNode,
  Connection,
  Viewport,
  CanvasMode,
  NodeType,
  ConnectionHandle,
  CanvasTheme,
} from '../../types/canvas';
import {
  screenToCanvas,
  canvasToScreen,
  calculateBoundingBox,
  getHandlePosition,
  getAutoHandles,
  isNodeInsideGroup,
} from '../../utils/geometry';
import { NodeWrapper } from '../nodes/NodeWrapper';
import { TextNode } from '../nodes/TextNode';
import { NoteNode } from '../nodes/NoteNode';
import { ChecklistNode } from '../nodes/ChecklistNode';
import { KanbanNode } from '../nodes/KanbanNode';
import { DeadlineNode } from '../nodes/DeadlineNode';
import { CalendarNode } from '../nodes/CalendarNode';
import { CustomerNode } from '../nodes/CustomerNode';
import { OrderNode } from '../nodes/OrderNode';
import { ProjectNode } from '../nodes/ProjectNode';
import { IndicatorNode } from '../nodes/IndicatorNode';
import { ProgressNode } from '../nodes/ProgressNode';
import { DocumentNode } from '../nodes/DocumentNode';
import { GroupNode } from '../nodes/GroupNode';
import { InvoiceNode } from '../nodes/InvoiceNode';
import { CustomNode } from '../nodes/CustomNode';
import { FinalizedOrderNode } from '../nodes/FinalizedOrderNode';
import { FinancialModuleNode } from '../nodes/FinancialModuleNode';
import { ProductNode } from '../nodes/ProductNode';
import { PartNode } from '../nodes/PartNode';
import { ServiceNode } from '../nodes/ServiceNode';
import { EmployeeNode } from '../nodes/EmployeeNode';
import { SupervisorNode } from '../nodes/SupervisorNode';
import { ProductionOrderNode } from '../nodes/ProductionOrderNode';
import { ProductionRouteNode } from '../nodes/ProductionRouteNode';
import { SectorNode } from '../nodes/SectorNode';
import { AttachmentNode } from '../nodes/AttachmentNode';
import { BudgetNode } from '../nodes/BudgetNode';
import { ConnectionRenderer } from './ConnectionRenderer';
import { Minimap } from './Minimap';
import { 
  getValidConnectionTargets, 
  getMissingMandatoryHandles, 
  getValidTargetHandles,
  getRecommendedProviderHandles
} from '../../utils/flowIntelligence';
import { ContextMenu } from './ContextMenu';
import { isNodeBottleneck } from '../../utils/nodeProgress';

interface CanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  viewport: Viewport;
  mode: CanvasMode;
  selectedNodeIds: string[];
  selectedConnectionId: string | null;
  investigatedNodeId: string | null;
  isLightMode?: boolean;
  onUpdateViewport: (viewport: Viewport) => void;
  onSelectNode: (nodeId: string | null, isMulti?: boolean) => void;
  onSelectConnection: (connId: string | null) => void;
  onMoveNodes: (deltas: { id: string; x: number; y: number }[]) => void;
  onResizeNode: (id: string, width: number, height: number) => void;
  onCreateNode: (type: NodeType, coords: { x: number; y: number }) => void;
  onDeleteSelected: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateNodeTitle: (nodeId: string, name: string) => void;
  onUpdateNode?: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onToggleLock?: (nodeId: string) => void;
  onConnectNodes: (
    fromId: string,
    toId: string,
    fromHandle?: ConnectionHandle,
    toHandle?: ConnectionHandle
  ) => void;
  onDeleteConnection: (connId: string) => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenInvoiceModal?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => void;
  onFitView: () => void;
  onSetMode: (mode: CanvasMode) => void;
  onOpenProductsCatalog?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenSectorReport?: (nodeId: string) => void;
  onConvertToOrder?: (budgetId: string) => void;
  theme?: CanvasTheme;
  onChangeTheme?: (theme: CanvasTheme) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  viewport,
  mode,
  selectedNodeIds,
  selectedConnectionId,
  investigatedNodeId,
  isLightMode = false,
  theme = 'dark',
  onChangeTheme,
  onUpdateViewport,
  onSelectNode,
  onSelectConnection,
  onMoveNodes,
  onResizeNode,
  onCreateNode,
  onDeleteSelected,
  onUpdateNodeData,
  onUpdateNodeTitle,
  onUpdateNode,
  onDuplicateNode,
  onToggleLock,
  onConnectNodes,
  onDeleteConnection,
  onOpenSearch,
  onOpenAI,
  onOpenInvoiceModal,
  onExpandNode,
  onFitView,
  onSetMode,
  onOpenProductsCatalog,
  onOpenCalendarModal,
  onOpenSectorReport,
  onConvertToOrder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [initialNodePositions, setInitialNodePositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  // Connecting State
  const [activeConnecting, setActiveConnecting] = useState<{
    fromNodeId: string;
    fromHandle: ConnectionHandle;
    currentPoint: { x: number; y: number };
  } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasCoords: { x: number; y: number };
  } | null>(null);

  // Investigation Mode Relations Set
  const investigationConnectedNodeIds = React.useMemo(() => {
    if (!investigatedNodeId) return new Set<string>();
    const set = new Set<string>([investigatedNodeId]);
    connections.forEach((c) => {
      if (c.fromId === investigatedNodeId) set.add(c.toId);
      if (c.toId === investigatedNodeId) set.add(c.fromId);
    });
    return set;
  }, [investigatedNodeId, connections]);

  // Pre-calculate all mandatory missing handles and their potential providers
  const allMissingMandatory = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    nodes.forEach(node => {
      const missing = getMissingMandatoryHandles(node, connections);
      if (missing.length > 0) map[node.id] = missing;
    });
    return map;
  }, [nodes, connections]);

  const allRecommendations = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(allMissingMandatory).forEach(([nodeId, missingHandles]) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const recs = getRecommendedProviderHandles(node, missingHandles as any, nodes, connections);
        Object.entries(recs).forEach(([providerId, handles]) => {
          if (!map[providerId]) map[providerId] = [];
          map[providerId] = [...new Set([...map[providerId], ...handles])];
        });
      }
    });
    return map;
  }, [allMissingMandatory, nodes, connections]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
      if (e.key.toLowerCase() === 'f') {
        onFitView();
      }
      if (e.key.toLowerCase() === 'v') {
        onSetMode('select');
      }
      if (e.key.toLowerCase() === 'c') {
        onSetMode('connect');
      }
      if (e.key === 'Escape') {
        onSelectNode(null);
        onSelectConnection(null);
        setActiveConnecting(null);
        setContextMenu(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDeleteSelected, onOpenSearch, onFitView, onSetMode, onSelectNode, onSelectConnection]);

  // Canvas Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(Math.max(viewport.scale * zoomFactor, 0.04), 4.0);

    // Zoom centered around the cursor
    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

    onUpdateViewport({ x: newX, y: newY, scale: newScale });
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) {
      const menuEl = document.getElementById('canvas-context-menu');
      if (!menuEl || !menuEl.contains(e.target as Node)) {
        setContextMenu(null);
      }
      return;
    }

    // Middle click or space+left or pan mode triggers pan
    if (e.button === 1 || (e.button === 0 && (isSpacePressed || mode === 'pan'))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Left click on empty canvas clears selection
    if (e.button === 0 && e.target === containerRef.current) {
      onSelectNode(null);
      onSelectConnection(null);
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onUpdateViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
        scale: viewport.scale,
      });
      return;
    }

    if (activeConnecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const canvasCoords = screenToCanvas(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        viewport
      );
      setActiveConnecting((prev) =>
        prev ? { ...prev, currentPoint: canvasCoords } : null
      );
      return;
    }

    if (draggingNodeId) {
      const deltaX = (e.clientX - dragStartMouse.x) / viewport.scale;
      const deltaY = (e.clientY - dragStartMouse.y) / viewport.scale;

      const deltas = Array.from(initialNodePositions.entries()).map(([id, pos]) => ({
        id,
        x: Math.round(pos.x + deltaX),
        y: Math.round(pos.y + deltaY),
      }));

      onMoveNodes(deltas);
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId) setDraggingNodeId(null);
    if (activeConnecting) setActiveConnecting(null);
  };

  // Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasCoords = screenToCanvas(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      viewport
    );

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasCoords,
    });
  };

  // Node Drag Start Trigger
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpacePressed || mode === 'pan') return;

    const isAlreadySelected = selectedNodeIds.includes(nodeId);
    let currentSelection = selectedNodeIds;

    if (!isAlreadySelected) {
      if (e.shiftKey) {
        currentSelection = [...selectedNodeIds, nodeId];
      } else {
        currentSelection = [nodeId];
      }
      onSelectNode(nodeId, e.shiftKey);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const nodeIdsToMove = new Set<string>(currentSelection);

    // Expand selection for any group/sector nodes to move nodes contained inside them
    currentSelection.forEach((id) => {
      const selectedNode = nodes.find((n) => n.id === id);
      if (selectedNode && (selectedNode.type === 'group' || selectedNode.type === 'sector')) {
        nodes.forEach((other) => {
          if (isNodeInsideGroup(other, selectedNode) || other.groupId === selectedNode.id) {
            nodeIdsToMove.add(other.id);
          }
        });
      }
    });

    nodes.forEach((n) => {
      if (nodeIdsToMove.has(n.id)) {
        positions.set(n.id, { x: n.x, y: n.y });
      }
    });

    setInitialNodePositions(positions);
    setDraggingNodeId(nodeId);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
  };

  // Start Connection from Handle
  const handleStartConnect = (
    fromNodeId: string,
    handle: ConnectionHandle,
    startCoords: { x: number; y: number }
  ) => {
    const fromNode = nodes.find((n) => n.id === fromNodeId);
    const startPoint = fromNode
      ? getHandlePosition(fromNode, handle)
      : containerRef.current
      ? screenToCanvas(
          {
            x: startCoords.x - containerRef.current.getBoundingClientRect().left,
            y: startCoords.y - containerRef.current.getBoundingClientRect().top,
          },
          viewport
        )
      : startCoords;

    setActiveConnecting({
      fromNodeId,
      fromHandle: handle,
      currentPoint: startPoint,
    });
  };

  // Drop Connection on Target Node / Handle
  const handleEndConnect = (toNodeId: string, toHandle?: ConnectionHandle) => {
    if (activeConnecting && activeConnecting.fromNodeId !== toNodeId) {
      const fromNode = nodes.find((n) => n.id === activeConnecting.fromNodeId);
      const toNode = nodes.find((n) => n.id === toNodeId);
      let targetHandle = toHandle;
      if (!targetHandle && fromNode && toNode) {
        const auto = getAutoHandles(fromNode, toNode);
        targetHandle = auto.toHandle;
      }
      onConnectNodes(
        activeConnecting.fromNodeId,
        toNodeId,
        activeConnecting.fromHandle,
        targetHandle || 'left-2'
      );
    }
    setActiveConnecting(null);
  };

  // Render Inner Node Content by NodeType
  const renderNodeContent = (node: CanvasNode) => {
    switch (node.type) {
      case 'text':
        return (
          <TextNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'note':
        return (
          <NoteNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'checklist':
        return (
          <ChecklistNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'attachment':
        return (
          <AttachmentNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'kanban':
        return (
          <KanbanNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'deadline':
        return (
          <DeadlineNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'calendar':
        return (
          <CalendarNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onOpenCalendarModal={onOpenCalendarModal}
          />
        );
      case 'customer':
        return (
          <CustomerNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onOpenCustomerModal={() => onExpandNode?.(node.id)}
          />
        );
      case 'budget':
        return (
          <BudgetNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onConvertToOrder={onConvertToOrder}
          />
        );
      case 'order':
        return (
          <OrderNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'invoice':
        return (
          <InvoiceNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onOpenInvoiceModal={onOpenInvoiceModal}
          />
        );
      case 'project':
        return (
          <ProjectNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'indicator':
        return (
          <IndicatorNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            allNodes={nodes}
            connections={connections}
          />
        );
      case 'progress':
        return (
          <ProgressNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'document':
        return (
          <DocumentNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'group':
        return (
          <GroupNode
            node={node}
            allNodes={nodes}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onOpenReport={onOpenSectorReport}
          />
        );
      case 'custom':
        return (
          <CustomNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'finalized_order':
        return (
          <FinalizedOrderNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'financial_module':
        return (
          <FinancialModuleNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'product':
        return (
          <ProductNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'part':
        return (
          <PartNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'service':
        return (
          <ServiceNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'employee':
        return (
          <EmployeeNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'supervisor':
        return (
          <SupervisorNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'production_order':
        return (
          <ProductionOrderNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'production_route':
        return (
          <ProductionRouteNode
            node={node}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
          />
        );
      case 'sector':
        return (
          <SectorNode
            node={node}
            allNodes={nodes}
            onUpdateData={onUpdateNodeData}
            onUpdateTitle={onUpdateNodeTitle}
            onOpenReport={onOpenSectorReport}
          />
        );
      default:
        return (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-xs">{node.name}</h4>
            <p className="text-[11px] text-slate-400 mt-1">{node.data.description || ''}</p>
          </div>
        );
    }
  };

  // Sort nodes so groups and sectors are rendered at the bottom (z-index) and regular nodes on top
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const isAGroup = a.type === 'group' || a.type === 'sector';
      const isBGroup = b.type === 'group' || b.type === 'sector';
      if (isAGroup && !isBGroup) return -1;
      if (!isAGroup && isBGroup) return 1;
      return (a.zIndex || 1) - (b.zIndex || 1);
    });
  }, [nodes]);

  const isGrabbing = isPanning || isSpacePressed || mode === 'pan';

  const getThemeBgClass = () => {
    switch (theme) {
      case 'white':
      case 'light':
      case 'blueprint_light':
      case 'warm_light':
        return 'bg-[#ffffff] canvas-theme-light';
      case 'gray':
        return 'bg-[#242936] canvas-theme-gray';
      case 'black':
      case 'dark':
      default:
        return 'bg-[#07090e]';
    }
  };

  const getGridClass = () => {
    switch (theme) {
      case 'white':
      case 'light':
      case 'blueprint_light':
      case 'warm_light':
        return 'bg-sleek-grid-light opacity-75';
      case 'gray':
        return 'bg-sleek-grid-gray opacity-60';
      case 'black':
      case 'dark':
      default:
        return 'bg-sleek-grid opacity-50';
    }
  };

  return (
    <div
      ref={containerRef}
      id="xcanvas-viewport-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden transition-colors duration-300 select-none ${getThemeBgClass()} ${
        isGrabbing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Visual Background Infinite Grid Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none ${getGridClass()}`}
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${40 * viewport.scale}px ${40 * viewport.scale}px`,
        }}
      />

      {/* World Coordinate Transform Wrapper */}
      <div
        id="xcanvas-world"
        className="absolute inset-0 origin-top-left pointer-events-auto"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render Connection Lines (SVG) */}
        <ConnectionRenderer
          connections={connections}
          nodes={nodes}
          selectedConnectionId={selectedConnectionId}
          selectedNodeIds={selectedNodeIds}
          investigatedNodeId={investigatedNodeId}
          investigationConnectedNodeIds={investigationConnectedNodeIds}
          activeConnecting={activeConnecting}
          onSelectConnection={onSelectConnection}
          onDeleteConnection={onDeleteConnection}
          isLightMode={isLightMode}
        />

        {/* Render Canvas Nodes */}
        {(() => {
          const rect = containerRef.current?.getBoundingClientRect();
          const width = rect?.width || window.innerWidth;
          const height = rect?.height || window.innerHeight;
          const pad = 200;

          const minVisibleX = -viewport.x / viewport.scale - pad;
          const maxVisibleX = (width - viewport.x) / viewport.scale + pad;
          const minVisibleY = -viewport.y / viewport.scale - pad;
          const maxVisibleY = (height - viewport.y) / viewport.scale + pad;

          return sortedNodes.map((node) => {
            const nodeWidth = node.width || 320;
            const nodeHeight = node.height || 220;

            const isCulled = isLightMode && (
              node.x + nodeWidth < minVisibleX ||
              node.x > maxVisibleX ||
              node.y + nodeHeight < minVisibleY ||
              node.y > maxVisibleY
            );

            if (isCulled) {
              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: nodeWidth,
                    height: nodeHeight,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                  }}
                />
              );
            }

            const isSelected = selectedNodeIds.includes(node.id);
            const isInvestigated =
              investigatedNodeId && investigationConnectedNodeIds.has(node.id);
            const isDimmed = investigatedNodeId && !isInvestigated;

            const missingMandatoryHandles = allMissingMandatory[node.id] || [];
            const suggestedHandles = allRecommendations[node.id] || [];
            let validTargetHandles: string[] = [];

            if (activeConnecting && activeConnecting.nodeId !== node.id) {
              const sourceNode = nodes.find(n => n.id === activeConnecting.nodeId);
              if (sourceNode) {
                validTargetHandles = getValidTargetHandles(sourceNode, activeConnecting.handleId, node);
              }
            }

            let connectionHighlight: 'valid' | 'invalid' | null = null;
            if (selectedNodeIds.length === 1 && !isSelected && !investigatedNodeId && !activeConnecting) {
              const selectedNode = nodes.find(n => n.id === selectedNodeIds[0]);
              if (selectedNode) {
                const validTargets = getValidConnectionTargets(selectedNode.type);
                connectionHighlight = validTargets.includes(node.type) ? 'valid' : 'invalid';
              }
            }

            const isBottleneck = isNodeBottleneck(node, nodes, connections);
            
            return (
            <div
              key={node.id}
              className={`transition-opacity duration-200 ${
                isDimmed ? 'opacity-15 pointer-events-none' : 'opacity-100'
              }`}
            >
              <NodeWrapper
                node={node}
                isSelected={isSelected}
                isConnecting={mode === 'connect' || !!activeConnecting}
                connectionHighlight={connectionHighlight}
                missingMandatoryHandles={missingMandatoryHandles}
                validTargetHandles={validTargetHandles}
                suggestedHandles={suggestedHandles}
                isBottleneck={isBottleneck}
                onOpenReport={onOpenSectorReport}
                onSelect={(id, isMulti) => {
                  if (activeConnecting) {
                    handleEndConnect(id);
                  } else {
                    onSelectNode(id, isMulti);
                  }
                }}
                onDragStart={(id, e) => handleNodeDragStart(id, e)}
                onResize={(id, w, h) => onResizeNode(id, w, h)}
                onStartConnect={(id, handle, coords) =>
                  handleStartConnect(id, handle, coords)
                }
                onEndConnect={(id, handle) => handleEndConnect(id, handle)}
                onToggleLock={onToggleLock}
                onDuplicate={onDuplicateNode}
                onDelete={onDeleteSelected}
                onExpand={onExpandNode}
              >
                {renderNodeContent(node)}
              </NodeWrapper>
            </div>
          );
        });
      })()}
      </div>

      {/* Interactive Minimap */}
      <Minimap
        nodes={nodes}
        viewport={viewport}
        canvasContainerRect={containerRef.current?.getBoundingClientRect() || null}
        theme={theme}
        onNavigate={(newX, newY) =>
          onUpdateViewport({ x: newX, y: newY, scale: viewport.scale })
        }
      />

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canvasCoordinates={contextMenu.canvasCoords}
          currentTheme={theme}
          onClose={() => setContextMenu(null)}
          onCreateNode={onCreateNode}
          onEnterConnectMode={() => onSetMode('connect')}
          onOpenProductsCatalog={onOpenProductsCatalog}
          onChangeTheme={onChangeTheme}
        />
      )}
    </div>
  );
};
