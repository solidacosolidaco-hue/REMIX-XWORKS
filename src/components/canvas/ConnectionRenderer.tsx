import React, { useState } from 'react';
import { CanvasNode, Connection, ConnectionHandle, ConnectionLineStyle } from '../../types/canvas';
import { generatePath, getAutoHandles, getHandlePosition } from '../../utils/geometry';
import { getFeedPhrase, isConnectionLogicValid, calculateConnectionValue, getStrokeWidthFromValue } from '../../utils/flowIntelligence';
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
  isLightMode = false,
}) => {
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  const nodeMap = new Map<string, CanvasNode>(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Markers for arrows */}
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

        {/* Glow Filters */}
        <filter id="glow-connection" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Render All Existing Connections */}
      {connections.map((conn) => {
        const fromNode = nodeMap.get(conn.fromId);
        const toNode = nodeMap.get(conn.toId);

        if (!fromNode || !toNode) return null;

        const autoHandles = getAutoHandles(fromNode, toNode);
        const fromHandle = conn.fromHandle || autoHandles.fromHandle;
        const toHandle = conn.toHandle || autoHandles.toHandle;

        const start = getHandlePosition(fromNode, fromHandle);
        const end = getHandlePosition(toNode, toHandle);

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
        const connectionValue = calculateConnectionValue(fromNode, toNode);

        const strokeColor = !isLogicallyValid
          ? '#f43f5e'
          : isInvestigated
          ? '#10b981'
          : isSelected
          ? '#38bdf8'
          : conn.color || '#38bdf8';

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
              strokeWidth="24"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredConnId(conn.id)}
              onMouseLeave={() => setHoveredConnId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(conn.id);
              }}
            />

            {/* Background Shadow / Glow Path */}
            {!isLightMode && (isSelected || isInvestigated || isHovered || !isLogicallyValid || connectionValue > 50000) && (
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth + 4}
                strokeOpacity={!isLogicallyValid ? "1" : connectionValue > 100000 ? "0.6" : "0.4"}
                filter="url(#glow-connection)"
                className={!isLogicallyValid ? 'animate-error-blink' : connectionValue > 100000 ? 'animate-pulse' : ''}
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
                  : conn.animated
                  ? '10 8'
                  : conn.strokePattern === 'dashed'
                  ? '8 6'
                  : conn.strokePattern === 'dotted'
                  ? '2 4'
                  : undefined
              }
              strokeLinecap={conn.strokePattern === 'dotted' ? 'round' : undefined}
              className={!isLogicallyValid ? 'animate-error-blink' : conn.animated ? 'animate-[dash_1.2s_linear_infinite]' : ''}
              markerEnd={
                conn.arrow === 'start' || conn.arrow === 'none'
                  ? undefined
                  : `url(#arrow-${
                      !isLogicallyValid
                        ? 'rose'
                        : strokeColor.includes('10b981')
                        ? 'emerald'
                        : strokeColor.includes('f59e0b')
                        ? 'amber'
                        : strokeColor.includes('f43f5e')
                        ? 'rose'
                        : strokeColor.includes('06b6d4')
                        ? 'cyan'
                        : 'default'
                    })`
              }
            />

            {/* Traveling Data Flow Particles (only if valid and not in high-performance light mode) */}
            {!isLightMode && conn.animated && isLogicallyValid && (
              <>
                <circle r="4.5" fill={strokeColor} className="filter drop-shadow-[0_0_10px_currentColor]">
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={path} />
                </circle>
                <circle r="3" fill="#ffffff" opacity="0.95" className="filter drop-shadow-[0_0_6px_#ffffff]">
                  <animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path={path} />
                </circle>
                <circle r="2" fill={strokeColor} opacity="0.8">
                  <animateMotion dur="1.6s" begin="1.1s" repeatCount="indefinite" path={path} />
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
