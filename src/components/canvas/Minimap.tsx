import React, { useRef } from 'react';
import { CanvasNode, Viewport, CanvasTheme } from '../../types/canvas';
import { calculateBoundingBox } from '../../utils/geometry';
import { Map, Eye, Minimize2, Maximize2 } from 'lucide-react';

interface MinimapProps {
  nodes: CanvasNode[];
  viewport: Viewport;
  canvasContainerRect: DOMRect | null;
  theme?: CanvasTheme;
  onNavigate: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  nodes,
  viewport,
  canvasContainerRect,
  theme = 'dark',
  onNavigate,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const MAP_WIDTH = 200;
  const MAP_HEIGHT = 130;

  const isLight = theme === 'white' || theme === 'light' || theme === 'blueprint_light' || theme === 'warm_light';

  // Calculate world bounds
  const bb = calculateBoundingBox(nodes);
  const padding = 400;
  const worldMinX = bb.minX - padding;
  const worldMinY = bb.minY - padding;
  const worldWidth = Math.max(bb.width + padding * 2, 2000);
  const worldHeight = Math.max(bb.height + padding * 2, 1400);

  const scaleX = MAP_WIDTH / worldWidth;
  const scaleY = MAP_HEIGHT / worldHeight;
  const mapScale = Math.min(scaleX, scaleY);

  // Viewport rect on minimap
  const viewWidth = (canvasContainerRect?.width || 1000) / viewport.scale;
  const viewHeight = (canvasContainerRect?.height || 700) / viewport.scale;
  const viewCanvasX = -viewport.x / viewport.scale;
  const viewCanvasY = -viewport.y / viewport.scale;

  const viewMapX = (viewCanvasX - worldMinX) * mapScale;
  const viewMapY = (viewCanvasY - worldMinY) * mapScale;
  const viewMapWidth = viewWidth * mapScale;
  const viewMapHeight = viewHeight * mapScale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = worldMinX + clickX / mapScale;
    const targetCanvasY = worldMinY + clickY / mapScale;

    // Center viewport at targetCanvasX, targetCanvasY
    const containerW = canvasContainerRect?.width || 1000;
    const containerH = canvasContainerRect?.height || 700;

    const newViewportX = containerW / 2 - targetCanvasX * viewport.scale;
    const newViewportY = containerH / 2 - targetCanvasY * viewport.scale;

    onNavigate(newViewportX, newViewportY);
  };

  const getNodeColor = (node: CanvasNode) => {
    switch (node.type) {
      case 'customer':
        return '#38bdf8';
      case 'order':
        return '#10b981';
      case 'project':
        return '#06b6d4';
      case 'deadline':
        return '#f59e0b';
      case 'indicator':
        return '#a855f7';
      case 'checklist':
        return '#34d399';
      case 'kanban':
        return '#64748b';
      case 'note':
        return '#fbbf24';
      default:
        return '#94a3b8';
    }
  };

  if (isCollapsed) {
    return (
      <button
        id="btn-minimap-expand"
        onClick={() => setIsCollapsed(false)}
        className={`absolute bottom-5 right-5 z-40 p-2.5 rounded-xl shadow-2xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-mono border ${
          isLight
            ? 'bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 border-slate-300 shadow-slate-400/20'
            : 'bg-[#0D1221]/90 hover:bg-[#161F36] text-slate-300 hover:text-blue-400 border-white/10'
        }`}
        title="Expandir Minimapa"
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">Mapa</span>
      </button>
    );
  }

  return (
    <div
      id="minimap-container"
      className={`absolute bottom-5 right-5 z-40 rounded-xl shadow-2xl backdrop-blur-md p-2.5 select-none border ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10'
          : 'bg-[#0D1221]/95 border-white/10 text-slate-300'
      }`}
    >
      <div className={`flex items-center justify-between pb-1.5 mb-1.5 border-b text-[10px] font-mono ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-white/5 text-slate-400'
      }`}>
        <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
          <Map className="w-3.5 h-3.5" />
          <span>RADAR / MINIMAPA</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className={`p-0.5 ${isLight ? 'hover:text-slate-900 text-slate-400' : 'hover:text-white text-slate-400'}`}
          title="Minimizar"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      <div
        ref={mapRef}
        onClick={handleClick}
        style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }}
        className={`relative rounded-lg border overflow-hidden cursor-crosshair ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#070A12] border-white/5'
        }`}
      >
        {/* Render Miniature Nodes */}
        {nodes.map((node) => {
          const mapNodeX = (node.x - worldMinX) * mapScale;
          const mapNodeY = (node.y - worldMinY) * mapScale;
          const mapNodeW = Math.max(node.width * mapScale, 3);
          const mapNodeH = Math.max(node.height * mapScale, 3);

          if (node.type === 'group') {
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${mapNodeX}px`,
                  top: `${mapNodeY}px`,
                  width: `${mapNodeW}px`,
                  height: `${mapNodeH}px`,
                  border: '1px dashed rgba(148, 163, 184, 0.3)',
                  backgroundColor: 'rgba(30, 41, 59, 0.2)',
                }}
              />
            );
          }

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${mapNodeX}px`,
                top: `${mapNodeY}px`,
                width: `${mapNodeW}px`,
                height: `${mapNodeH}px`,
                backgroundColor: getNodeColor(node),
                borderRadius: '2px',
                opacity: 0.85,
              }}
            />
          );
        })}

        {/* Viewport Box */}
        <div
          style={{
            position: 'absolute',
            left: `${viewMapX}px`,
            top: `${viewMapY}px`,
            width: `${Math.max(viewMapWidth, 10)}px`,
            height: `${Math.max(viewMapHeight, 10)}px`,
            border: '1.5px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div className="flex items-center justify-between pt-1.5 mt-1 text-[9px] font-mono text-slate-400">
        <span>{nodes.length} Objetos</span>
        <span>Zoom: {Math.round(viewport.scale * 100)}%</span>
      </div>
    </div>
  );
};
