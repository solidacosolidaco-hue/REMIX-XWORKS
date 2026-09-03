import { CanvasNode, ConnectionHandle, ConnectionLineStyle, Viewport } from '../types/canvas';

export function screenToCanvas(
  screenX: number | { x: number; y: number },
  screenY?: number | Viewport,
  viewportParam?: Viewport,
  containerRect?: DOMRect
): { x: number; y: number } {
  if (typeof screenX === 'object' && 'x' in screenX) {
    const point = screenX;
    const vp = screenY as Viewport;
    return {
      x: (point.x - vp.x) / vp.scale,
      y: (point.y - vp.y) / vp.scale,
    };
  }

  const x = screenX as number;
  const y = (screenY as number) || 0;
  const vp = viewportParam as Viewport;
  const relX = containerRect ? x - containerRect.left : x;
  const relY = containerRect ? y - containerRect.top : y;
  return {
    x: (relX - vp.x) / vp.scale,
    y: (relY - vp.y) / vp.scale,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport,
  containerRect?: DOMRect
): { x: number; y: number } {
  const screenX = canvasX * viewport.scale + viewport.x + (containerRect?.left || 0);
  const screenY = canvasY * viewport.scale + viewport.y + (containerRect?.top || 0);
  return { x: screenX, y: screenY };
}

export interface HandleInfo {
  id: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  label: string;
  index: number;
  total: number;
  ratio: number;
  x: number;
  y: number;
  percentStyle: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    transform?: string;
  };
}

export function getBaseSide(handle: string): 'top' | 'right' | 'bottom' | 'left' {
  if (handle.startsWith('top')) return 'top';
  if (handle.startsWith('bottom')) return 'bottom';
  if (handle.startsWith('left')) return 'left';
  if (handle.startsWith('right')) return 'right';
  return 'right';
}

export function getNodeHandles(node: CanvasNode, countPerSide?: number): HandleInfo[] {
  const points = Math.max(1, Math.min(5, countPerSide ?? node.data.connectionPointsPerSide ?? 3));
  const handles: HandleInfo[] = [];
  const sides: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

  sides.forEach((side) => {
    for (let i = 1; i <= points; i++) {
      const ratio = points === 1 ? 0.5 : i / (points + 1);
      const id = points === 1 ? side : `${side}-${i}`;
      const percent = Math.round(ratio * 100);

      let x = node.x;
      let y = node.y;
      let percentStyle: HandleInfo['percentStyle'] = {};
      let sideLabel = '';

      if (side === 'top') {
        x = node.x + node.width * ratio;
        y = node.y;
        percentStyle = {
          top: '0px',
          left: `${percent}%`,
          transform: 'translate(-50%, -50%)',
        };
        sideLabel = 'Superior';
      } else if (side === 'bottom') {
        x = node.x + node.width * ratio;
        y = node.y + node.height;
        percentStyle = {
          bottom: '0px',
          left: `${percent}%`,
          transform: 'translate(-50%, 50%)',
        };
        sideLabel = 'Inferior';
      } else if (side === 'left') {
        x = node.x;
        y = node.y + node.height * ratio;
        percentStyle = {
          top: `${percent}%`,
          left: '0px',
          transform: 'translate(-50%, -50%)',
        };
        sideLabel = 'Esquerda';
      } else if (side === 'right') {
        x = node.x + node.width;
        y = node.y + node.height * ratio;
        percentStyle = {
          top: `${percent}%`,
          right: '0px',
          transform: 'translate(50%, -50%)',
        };
        sideLabel = 'Direita';
      }

      const pointDesc =
        points === 1
          ? 'Centro'
          : i === 1
          ? 'Ponto 1 (Início)'
          : i === points
          ? `Ponto ${i} (Fim)`
          : `Ponto ${i} (Centro)`;

      handles.push({
        id,
        side,
        label: `${sideLabel} - ${pointDesc}`,
        index: i,
        total: points,
        ratio,
        x,
        y,
        percentStyle,
      });
    }
  });

  return handles;
}

export function getHandlePosition(
  node: CanvasNode,
  handle: ConnectionHandle = 'right'
): { x: number; y: number } {
  const points = node.data.connectionPointsPerSide ?? 3;
  const allHandles = getNodeHandles(node, points);
  
  const matched = allHandles.find((h) => h.id === handle);
  if (matched) {
    return { x: matched.x, y: matched.y };
  }

  // Exact matches for legacy single handles
  if (handle === 'top') return { x: node.x + node.width * 0.5, y: node.y };
  if (handle === 'bottom') return { x: node.x + node.width * 0.5, y: node.y + node.height };
  if (handle === 'left') return { x: node.x, y: node.y + node.height * 0.5 };
  if (handle === 'right') return { x: node.x + node.width, y: node.y + node.height * 0.5 };

  if (handle === 'top-left') return { x: node.x + node.width * 0.25, y: node.y };
  if (handle === 'top-center') return { x: node.x + node.width * 0.5, y: node.y };
  if (handle === 'top-right') return { x: node.x + node.width * 0.75, y: node.y };

  if (handle === 'bottom-left') return { x: node.x + node.width * 0.25, y: node.y + node.height };
  if (handle === 'bottom-center') return { x: node.x + node.width * 0.5, y: node.y + node.height };
  if (handle === 'bottom-right') return { x: node.x + node.width * 0.75, y: node.y + node.height };

  if (handle === 'left-top') return { x: node.x, y: node.y + node.height * 0.25 };
  if (handle === 'left-center') return { x: node.x, y: node.y + node.height * 0.5 };
  if (handle === 'left-bottom') return { x: node.x, y: node.y + node.height * 0.75 };

  if (handle === 'right-top') return { x: node.x + node.width, y: node.y + node.height * 0.25 };
  if (handle === 'right-center') return { x: node.x + node.width, y: node.y + node.height * 0.5 };
  if (handle === 'right-bottom') return { x: node.x + node.width, y: node.y + node.height * 0.75 };

  // Parse pattern like 'top-1', 'right-2', etc.
  const side = getBaseSide(handle);
  const match = handle.match(/-(\d+)/);
  if (match) {
    const idx = parseInt(match[1], 10);
    const ratio = Math.max(0.1, Math.min(0.9, idx / (points + 1)));
    if (side === 'top') return { x: node.x + node.width * ratio, y: node.y };
    if (side === 'bottom') return { x: node.x + node.width * ratio, y: node.y + node.height };
    if (side === 'left') return { x: node.x, y: node.y + node.height * ratio };
    if (side === 'right') return { x: node.x + node.width, y: node.y + node.height * ratio };
  }

  // Fallback to center of side
  if (side === 'top') return { x: node.x + node.width * 0.5, y: node.y };
  if (side === 'bottom') return { x: node.x + node.width * 0.5, y: node.y + node.height };
  if (side === 'left') return { x: node.x, y: node.y + node.height * 0.5 };
  return { x: node.x + node.width, y: node.y + node.height * 0.5 };
}

export function getAutoHandles(
  fromNode: CanvasNode,
  toNode: CanvasNode
): { fromHandle: ConnectionHandle; toHandle: ConnectionHandle } {
  const fromHandles = getNodeHandles(fromNode, fromNode.data.connectionPointsPerSide ?? 3);
  const toHandles = getNodeHandles(toNode, toNode.data.connectionPointsPerSide ?? 3);

  let minDistance = Infinity;
  let bestFrom: ConnectionHandle = fromHandles[0]?.id || 'right-2';
  let bestTo: ConnectionHandle = toHandles[0]?.id || 'left-2';

  for (const fh of fromHandles) {
    for (const th of toHandles) {
      const dx = th.x - fh.x;
      const dy = th.y - fh.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        bestFrom = fh.id;
        bestTo = th.id;
      }
    }
  }

  return { fromHandle: bestFrom, toHandle: bestTo };
}

export function generatePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startHandle: ConnectionHandle = 'right',
  endHandle: ConnectionHandle = 'left',
  style: ConnectionLineStyle = 'curved'
): { path: string; midPoint: { x: number; y: number } } {
  const startSide = getBaseSide(startHandle);
  const endSide = getBaseSide(endHandle);

  if (style === 'straight') {
    const midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    return {
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      midPoint,
    };
  }

  if (style === 'orthogonal') {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    let path = '';
    let midPoint = { x: midX, y: midY };

    if (startSide === 'right' || startSide === 'left') {
      path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
      midPoint = { x: midX, y: midY };
    } else {
      path = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
      midPoint = { x: midX, y: midY };
    }

    return { path, midPoint };
  }

  // Curved (Smooth Cubic Bezier)
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.max(distance * 0.35, 40);

  let cp1 = { x: start.x, y: start.y };
  let cp2 = { x: end.x, y: end.y };

  switch (startSide) {
    case 'right':
      cp1 = { x: start.x + curvature, y: start.y };
      break;
    case 'left':
      cp1 = { x: start.x - curvature, y: start.y };
      break;
    case 'bottom':
      cp1 = { x: start.x, y: start.y + curvature };
      break;
    case 'top':
      cp1 = { x: start.x, y: start.y - curvature };
      break;
  }

  switch (endSide) {
    case 'right':
      cp2 = { x: end.x + curvature, y: end.y };
      break;
    case 'left':
      cp2 = { x: end.x - curvature, y: end.y };
      break;
    case 'bottom':
      cp2 = { x: end.x, y: end.y + curvature };
      break;
    case 'top':
      cp2 = { x: end.x, y: end.y - curvature };
      break;
  }

  const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  // Approximate mid-point of cubic bezier (t = 0.5)
  const t = 0.5;
  const midX =
    Math.pow(1 - t, 3) * start.x +
    3 * Math.pow(1 - t, 2) * t * cp1.x +
    3 * (1 - t) * Math.pow(t, 2) * cp2.x +
    Math.pow(t, 3) * end.x;
  const midY =
    Math.pow(1 - t, 3) * start.y +
    3 * Math.pow(1 - t, 2) * t * cp1.y +
    3 * (1 - t) * Math.pow(t, 2) * cp2.y +
    Math.pow(t, 3) * end.y;

  return { path, midPoint: { x: midX, y: midY } };
}

export function calculateBoundingBox(nodes: CanvasNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 600, width: 1000, height: 600, centerX: 500, centerY: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function isNodeInsideGroup(node: CanvasNode, group: CanvasNode): boolean {
  if (node.id === group.id) return false;
  const nodeCenterX = node.x + (node.width || 300) / 2;
  const nodeCenterY = node.y + (node.height || 200) / 2;

  return (
    nodeCenterX >= group.x &&
    nodeCenterX <= group.x + (group.width || 600) &&
    nodeCenterY >= group.y &&
    nodeCenterY <= group.y + (group.height || 400)
  );
}

/**
 * Finds the group node (sector) that fully encloses the given node.
 */
export function getEnclosingSector(node: CanvasNode, allNodes: CanvasNode[]): CanvasNode | undefined {
  return allNodes.find(
    (n) =>
      n.type === 'group' &&
      node.x >= n.x &&
      node.y >= n.y &&
      node.x + node.width <= n.x + n.width &&
      node.y + node.height <= n.y + n.height
  );
}

/**
 * Resolves collisions between nodes, ensuring they don't overlap,
 * and ensures nodes stay within their enclosing sector.
 * Except for nodes of type 'group', which are allowed to be under other nodes.
 */
export function resolveNodeCollisions(
  movingNodeId: string,
  newX: number,
  newY: number,
  allNodes: CanvasNode[],
  ignoreType: string = 'group'
): { x: number; y: number } {
  const movingNode = allNodes.find((n) => n.id === movingNodeId);
  if (!movingNode || movingNode.type === ignoreType) return { x: newX, y: newY };

  let resX = newX;
  let resY = newY;
  const w = movingNode.width;
  const h = movingNode.height;

  // Check against all other nodes that are NOT groups and NOT the moving node
  for (const other of allNodes) {
    if (other.id === movingNodeId || other.type === ignoreType) continue;

    // AABB Collision Detection
    const isColliding =
      resX < other.x + other.width &&
      resX + w > other.x &&
      resY < other.y + other.height &&
      resY + h > other.y;

    if (isColliding) {
      // Resolve collision by pushing out to the nearest edge
      const overlapLeft = resX + w - other.x;
      const overlapRight = other.x + other.width - resX;
      const overlapTop = resY + h - other.y;
      const overlapBottom = other.y + other.height - resY;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) resX -= overlapLeft;
      else if (minOverlap === overlapRight) resX += overlapRight;
      else if (minOverlap === overlapTop) resY -= overlapTop;
      else if (minOverlap === overlapBottom) resY += overlapBottom;
    }
  }

  // Ensure node stays within its enclosing sector, if any
  const enclosingSector = getEnclosingSector({ ...movingNode, x: resX, y: resY }, allNodes);
  if (enclosingSector) {
    resX = Math.max(enclosingSector.x, Math.min(resX, enclosingSector.x + enclosingSector.width - w));
    resY = Math.max(enclosingSector.y, Math.min(resY, enclosingSector.y + enclosingSector.height - h));
  }

  return { x: resX, y: resY };
}
