import React, { createContext, useContext } from 'react';
import { CanvasNode, Connection } from '../types/canvas';

interface CanvasContextType {
  nodes: CanvasNode[];
  connections: Connection[];
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasProviderProps {
  nodes: CanvasNode[];
  connections: Connection[];
  children: React.ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ nodes, connections, children }) => {
  return (
    <CanvasContext.Provider value={{ nodes, connections }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  return useContext(CanvasContext);
};
