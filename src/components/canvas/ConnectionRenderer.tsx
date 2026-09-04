import React, { useState } from 'react';
import { CanvasNode, Connection, ConnectionHandle, ConnectionLineStyle } from '../../types/canvas';
import { generatePath, getAutoHandles, getHandlePosition, getInterruptedConnectionIds } from '../../utils/geometry';
import { getFeedPhrase, isConnectionLogicValid, calculateConnectionValue, getStrokeWidthFromValue } from '../../utils/flowIntelligence';
import { getNodeDeadlineInfo } from '../../utils/nodeDeadline';
import { X, ArrowRight, Zap, AlertCircle, Paperclip, ExternalLink } from 'lucide-react';

interface ConnectionRendererProps {
  connections: Connection[];
  nodes: CanvasNode[];
  selectedConnectionId: string | null;
  selectedNodeIds?: string[];
  investigatedNodeId: string | null;
  investigationConnectedNodeIds?: Set<string>;
  activeConnecting?: {
    fromNodeId: string;
    fromHandle: ConnectionHandle;
    currentPoint: { x: number; y: number };
  } | null;
  onSelectConnection: (connId: string) => void;
  onDeleteConnection: (connId: string) => void;
  onConnectToLine?: (fromNodeId: string, targetConnectionId: string, fromHandle?: ConnectionHandle) => void;
  isLightMode?: boolean;
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  connections,
  nodes,
  selectedConnectionId,
  selectedNodeIds = [],
  investigatedNodeId,
  investigationConnectedNodeIds,
  activeConnecting,
  onSelectConnection,
  onDeleteConnection,
  onConnectToLine,
  isLightMode = false,
}) => {
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  const nodeMap = new Map<string, CanvasNode>(nodes.map((n) => [n.id, n]));

  // Find all unresolved 'interrupted_flow' nodes
  const unresolvedInterruptedNodes = React.useMemo(() => {
    return nodes.filter((n) => n.type === 'interrupted_flow' && !n.data?.isResolved);
  }, [nodes]);

  const unresolvedInterruptedIds = React.useMemo(() => {
    return new Set(unresolvedInterruptedNodes.map((n) => n.id));
  }, [unresolvedInterruptedNodes]);

  // Compute set of all connection IDs that are interrupted (ONLY the specific line connected or intersected)
  const interruptedConnectionIds = React.useMemo(() => {
    const { interruptedConns } = getInterruptedConnectionIds(nodes, connections);
    return interruptedConns;
  }, [nodes, connections]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Markers for arrows (Dark Mode/Standard) */}
        <marker
          id="arrow-default"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>

        <marker
          id="arrow-emerald"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
        </marker>

        <marker
          id="arrow-amber"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
        </marker>

        <marker
          id="arrow-rose"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
        </marker>

        <marker
          id="arrow-cyan"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
        </marker>

        {/* Markers for arrows (Light Mode High-Contrast) */}
        <marker
          id="arrow-default-light"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
        </marker>

        <marker
          id="arrow-emerald-light"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
        </marker>

        <marker
          id="arrow-amber-light"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
        </marker>

        <marker
          id="arrow-rose-light"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
        </marker>

        <marker
          id="arrow-cyan-light"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0891b2" />
        </marker>

        {/* Glow Filters */}
        <filter id="glow-connection" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Render All Existing Connections */}
      {connections.map((conn) => {
        const fromNode = nodeMap.get(conn.fromId);
        let toNode = nodeMap.get(conn.toId);

        if (!fromNode) return null;

        const autoHandles = toNode ? getAutoHandles(fromNode, toNode) : { fromHandle: 'bottom-2' as ConnectionHandle, toHandle: 'top-2' as ConnectionHandle };
        const fromHandle = conn.fromHandle || autoHandles.fromHandle;
        const toHandle = conn.toHandle || autoHandles.toHandle;

        const start = getHandlePosition(fromNode, fromHandle);
        let end = toNode ? getHandlePosition(toNode, toHandle) : { x: 0, y: 0 };

        // If this wire connects directly to another connection line
        if (conn.toConnectionId) {
          const targetConn = connections.find((tc) => tc.id === conn.toConnectionId);
          if (targetConn) {
            const targetFrom = nodeMap.get(targetConn.fromId);
            const targetTo = nodeMap.get(targetConn.toId);
            if (targetFrom && targetTo) {
              const autoH = getAutoHandles(targetFrom, targetTo);
              const targetStart = getHandlePosition(targetFrom, targetConn.fromHandle || autoH.fromHandle);
              const targetEnd = getHandlePosition(targetTo, targetConn.toHandle || autoH.toHandle);
              const targetPathRes = generatePath(targetStart, targetEnd, targetConn.fromHandle || autoH.fromHandle, targetConn.toHandle || autoH.toHandle, targetConn.lineStyle || 'curved');
              end = targetPathRes.midPoint;
              if (!toNode) toNode = targetTo;
            }
          }
        }

        if (!toNode) return null;

        const { path, midPoint } = generatePath(
          start,
          end,
          fromHandle,
          toHandle,
          conn.lineStyle || 'curved'
        );

        const isSelected = selectedConnectionId === conn.id;
        const isHovered = hoveredConnId === conn.id;

        // Investigation Mode highlight:
        const isInvestigated =
          investigatedNodeId &&
          (conn.fromId === investigatedNodeId ||
            conn.toId === investigatedNodeId ||
            (investigationConnectedNodeIds?.has(conn.fromId) &&
              investigationConnectedNodeIds?.has(conn.toId)));

        const isDimmed = investigatedNodeId && !isInvestigated;
        const isLogicallyValid = isConnectionLogicValid(fromNode.type, toNode.type);
        const isInterrupted = interruptedConnectionIds.has(conn.id);
        const connectionValue = calculateConnectionValue(fromNode, toNode);
        const fromDeadline = getNodeDeadlineInfo(fromNode);
        const isFromCompleted = fromDeadline.state === 'completed' || fromNode.status === 'Concluído' || (fromNode.data.progressPercent ?? 0) >= 100;

        let strokeColor = !isLogicallyValid
          ? '#f43f5e'
          : isInterrupted
          ? '#f43f5e'
          : isInvestigated || isFromCompleted
          ? '#10b981'
          : isSelected
          ? '#38bdf8'
          : conn.color || '#38bdf8';

        // Adapt colors for light mode to increase contrast, visibility, and depth
        if (isLightMode) {
          if (strokeColor === '#38bdf8') {
            strokeColor = '#0284c7'; // Saturated dark sky blue
          } else if (strokeColor === '#10b981') {
            strokeColor = '#059669'; // Saturated deep emerald
          } else if (strokeColor === '#f43f5e') {
            strokeColor = '#e11d48'; // High-contrast rose
          } else if (strokeColor === '#f59e0b') {
            strokeColor = '#d97706'; // High-contrast warm amber
          } else if (strokeColor === '#06b6d4') {
            strokeColor = '#0891b2'; // Rich cyan
          } else if (strokeColor === '#ffffff' || strokeColor === '#FFF' || strokeColor === 'white') {
            strokeColor = '#475569'; // High-contrast slate slate
          }
        }

        // Use dynamic stroke width if value exists
        const baseStrokeWidth = isInvestigated ? 3.5 : isSelected ? 3 : conn.strokeWidth || 2;
        const strokeWidth = connectionValue > 0 ? getStrokeWidthFromValue(connectionValue) : baseStrokeWidth;

        return (
          <g
            key={conn.id}
            id={`connection-${conn.id}`}
            className={`transition-opacity duration-200 ${isDimmed ? 'opacity-10' : 'opacity-100'}`}
          >
            {/* Invisible thicker path for easier click/hover */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredConnId(conn.id)}
              onMouseLeave={() => setHoveredConnId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(conn.id);
              }}
              onMouseUp={(e) => {
                if (activeConnecting && onConnectToLine) {
                  e.stopPropagation();
                  onConnectToLine(activeConnecting.fromNodeId, conn.id, activeConnecting.fromHandle);
                }
              }}
            />

            {/* Background Shadow / Glow Path */}
            {(isSelected || isInvestigated || isHovered || isInterrupted || !isLogicallyValid || connectionValue > 50000) && (
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth + 5}
                strokeOpacity={
                  isLightMode
                    ? (!isLogicallyValid || isInterrupted ? "0.22" : "0.12")
                    : (!isLogicallyValid || isInterrupted ? "0.9" : "0.4")
                }
                filter={isLightMode ? undefined : "url(#glow-connection)"}
                className={!isLogicallyValid ? 'animate-error-blink' : isInterrupted ? 'animate-pulse' : connectionValue > 100000 ? 'animate-pulse' : ''}
              />
            )}

            {/* Conduit Pipe Base (Background reference path for animated flows) */}
            {conn.animated && !isInterrupted && isLogicallyValid && (
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={isLightMode ? "0.15" : "0.22"}
              />
            )}

            {/* Main Visual Connection Line */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={
                !isLogicallyValid
                  ? 'none'
                  : isInterrupted
                  ? '12 6'
                  : conn.animated
                  ? '14 10' // Standardized spacing
                  : conn.strokePattern === 'dashed'
                  ? '8 6'
                  : conn.strokePattern === 'dotted'
                  ? '2 4'
                  : undefined
              }
              strokeLinecap={conn.strokePattern === 'dotted' ? 'round' : undefined}
              className={
                !isLogicallyValid
                  ? 'animate-error-blink'
                  : isInterrupted
                  ? 'animate-pulse'
                  : conn.animated
                  ? 'animate-[dash_1.4s_linear_infinite]'
                  : ''
              }
              markerEnd={
                conn.arrow === 'start' || conn.arrow === 'none'
                  ? undefined
                  : `url(#arrow-${
                      !isLogicallyValid || isInterrupted
                        ? (isLightMode ? 'rose-light' : 'rose')
                        : strokeColor === '#10b981' || strokeColor === '#059669'
                        ? (isLightMode ? 'emerald-light' : 'emerald')
                        : strokeColor === '#f59e0b' || strokeColor === '#d97706'
                        ? (isLightMode ? 'amber-light' : 'amber')
                        : strokeColor === '#f43f5e' || strokeColor === '#e11d48'
                        ? (isLightMode ? 'rose-light' : 'rose')
                        : strokeColor === '#06b6d4' || strokeColor === '#0891b2'
                        ? (isLightMode ? 'cyan-light' : 'cyan')
                        : (isLightMode ? 'default-light' : 'default')
                    })`
              }
            />

            {/* Traveling Data Flow Particles (Beautifully rendered and highly visible on BOTH light & dark modes) */}
            {conn.animated && !isInterrupted && isLogicallyValid && (
              <>
                {/* Particle Node 1 */}
                <circle 
                  r={isLightMode ? "5.5" : "7.5"} 
                  fill={strokeColor} 
                  opacity={isLightMode ? "0.3" : "0.35"} 
                  className={isLightMode ? "" : "filter drop-shadow-[0_0_8px_currentColor]"}
                >
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "3.5" : "4.5"} 
                  fill={isLightMode ? "#ffffff" : strokeColor} 
                  opacity="0.85"
                >
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "2" : "2.5"} 
                  fill={isLightMode ? strokeColor : "#ffffff"}
                >
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                </circle>

                {/* Particle Node 2 (Lagging 600ms) */}
                <circle 
                  r={isLightMode ? "4.5" : "6.5"} 
                  fill={strokeColor} 
                  opacity={isLightMode ? "0.25" : "0.3"} 
                  className={isLightMode ? "" : "filter drop-shadow-[0_0_8px_currentColor]"}
                >
                  <animateMotion dur="1.8s" begin="0.6s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "2.8" : "3.8"} 
                  fill={isLightMode ? "#ffffff" : strokeColor} 
                  opacity="0.8"
                >
                  <animateMotion dur="1.8s" begin="0.6s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "1.5" : "2"} 
                  fill={isLightMode ? strokeColor : "#ffffff"}
                >
                  <animateMotion dur="1.8s" begin="0.6s" repeatCount="indefinite" path={path} />
                </circle>

                {/* Particle Node 3 (Lagging 1.2s) */}
                <circle 
                  r={isLightMode ? "3.5" : "5.5"} 
                  fill={strokeColor} 
                  opacity={isLightMode ? "0.2" : "0.25"} 
                  className={isLightMode ? "" : "filter drop-shadow-[0_0_8px_currentColor]"}
                >
                  <animateMotion dur="1.8s" begin="1.2s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "2" : "3.2"} 
                  fill={isLightMode ? "#ffffff" : strokeColor} 
                  opacity="0.75"
                >
                  <animateMotion dur="1.8s" begin="1.2s" repeatCount="indefinite" path={path} />
                </circle>
                <circle 
                  r={isLightMode ? "1" : "1.5"} 
                  fill={isLightMode ? strokeColor : "#ffffff"}
                >
                  <animateMotion dur="1.8s" begin="1.2s" repeatCount="indefinite" path={path} />
                </circle>
              </>
            )}

            {/* Feeding Phrase Label on top of the connection line */}
            {(() => {
              const feedInfo = getFeedPhrase(fromNode, toNode, conn.label);
              const isFromSelected = selectedNodeIds.includes(fromNode.id);
              const isToSelected = selectedNodeIds.includes(toNode.id);

              let phraseText = feedInfo.actionPhrase;
              const hasAttachments = conn.attachments && conn.attachments.length > 0;
              
              // Append financial value if exists
              if (connectionValue > 0) {
                phraseText += ` • R$ ${connectionValue.toLocaleString('pt-BR')}`;
              }

              let bgClass = "fill-[#0D1221]/95 stroke-blue-500/40 shadow-xl backdrop-blur-md";
              let textClass = "fill-blue-200 font-medium";

              if (!isLogicallyValid) {
                phraseText = `⚠️ FLUXO ILÓGICO: ${fromNode.type} -> ${toNode.type}`;
                bgClass = "fill-rose-950/95 stroke-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]";
                textClass = "fill-rose-200 font-black animate-pulse";
              } else if (isInterrupted) {
                phraseText = `🛑 FLUXO PARADO: INTERRUPÇÃO EM PROCESSO`;
                bgClass = "fill-rose-950/95 stroke-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]";
                textClass = "fill-rose-200 font-bold animate-pulse";
              } else if (isFromSelected) {
                phraseText = `📤 ALIMENTANDO ➔ '${toNode.name}' (${feedInfo.actionPhrase})`;
                bgClass = "fill-cyan-950/95 stroke-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]";
                textClass = "fill-cyan-200 font-bold";
              } else if (isToSelected) {
                phraseText = `📥 SENDO ALIMENTADO POR ➔ '${fromNode.name}' (${feedInfo.actionPhrase})`;
                bgClass = "fill-emerald-950/95 stroke-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
                textClass = "fill-emerald-200 font-bold";
              } else if (isSelected || isHovered || isInvestigated) {
                bgClass = "fill-slate-900/95 stroke-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                textClass = "fill-emerald-200 font-semibold";
              }

              const charWidth = 6.8;
              const boxWidth = Math.max(130, phraseText.length * charWidth + (hasAttachments ? 34 : 24));
              const boxX = -boxWidth / 2;
              const deleteBtnX = boxWidth / 2 + 14;

              return (
                <g transform={`translate(${midPoint.x}, ${midPoint.y})`}>
                  {/* Phrase Pill on top of line */}
                  <g
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectConnection(conn.id);
                    }}
                  >
                    <rect
                      x={boxX}
                      y="-13"
                      width={boxWidth}
                      height="26"
                      rx="8"
                      className={`${bgClass} transition-all duration-200`}
                    />
                    <text
                      x={hasAttachments ? -10 : 0}
                      y="4"
                      textAnchor="middle"
                      className={`${textClass} text-[11px] font-mono select-none tracking-wide`}
                    >
                      {phraseText}
                    </text>
                    {hasAttachments && (
                      <g transform={`translate(${boxWidth / 2 - 18}, 0)`}>
                        <Paperclip size={14} className="text-blue-400 filter drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                      </g>
                    )}
                  </g>

                  {/* Quick delete button beside phrase */}
                  {(isHovered || isSelected) && (
                    <g
                      transform={`translate(${deleteBtnX}, 0)`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConnection(conn.id);
                      }}
                    >
                      <circle r="10" className="fill-rose-600 hover:fill-rose-500 shadow-xl filter drop-shadow-md" />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="fill-white text-[10px] font-bold select-none"
                      >
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* Render Active Connecting Line (When user is actively dragging from a port) */}
      {activeConnecting && (() => {
        const fromNode = nodeMap.get(activeConnecting.fromNodeId);
        if (!fromNode) return null;

        const start = getHandlePosition(fromNode, activeConnecting.fromHandle);
        const end = activeConnecting.currentPoint;

        const { path } = generatePath(
          start,
          end,
          activeConnecting.fromHandle,
          'left',
          'curved'
        );

        return (
          <g>
            <path
              d={path}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="animate-pulse"
              markerEnd="url(#arrow-default)"
            />
            <circle
              cx={end.x}
              cy={end.y}
              r="5"
              fill="#38bdf8"
              className="animate-ping opacity-75"
            />
          </g>
        );
      })()}
    </svg>
  );
};
