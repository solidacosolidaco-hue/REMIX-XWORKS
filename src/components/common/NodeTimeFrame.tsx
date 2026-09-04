import React from 'react';
import { CanvasNode } from '../../types/canvas';

interface NodeTimeFrameProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  className?: string;
  compact?: boolean;
  simulatedDate?: string;
}

export const NodeTimeFrame: React.FC<NodeTimeFrameProps> = () => {
  return null;
};
