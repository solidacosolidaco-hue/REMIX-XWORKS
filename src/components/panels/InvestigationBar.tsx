import React from 'react';
import { CanvasNode } from '../../types/canvas';
import { Search, X, Network, Sparkles, ArrowRight } from 'lucide-react';

interface InvestigationBarProps {
  investigatedNode: CanvasNode | null;
  connectedCount: number;
  onExit: () => void;
}

export const InvestigationBar: React.FC<InvestigationBarProps> = ({
  investigatedNode,
  connectedCount,
  onExit,
}) => {
  return (
    <div
      id="investigation-mode-bar"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border-2 border-emerald-500/80 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.3)] backdrop-blur-xl px-4 py-2.5 flex items-center gap-3 text-emerald-100 font-mono text-xs select-none animate-in slide-in-from-top-4 duration-200"
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950">
          <Search className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold tracking-wider">
            <Network className="w-3.5 h-3.5" />
            <span>MODO INVESTIGAÇÃO VISUAL ATIVO</span>
          </div>
          <div className="text-xs text-white font-semibold">
            {investigatedNode ? (
              <span>
                Foco em: <strong className="text-emerald-300">{investigatedNode.name}</strong> ({connectedCount} conexões diretas/indiretas destacadas)
              </span>
            ) : (
              <span>Clique em qualquer objeto para isolar e destacar sua rede de relações</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-px h-6 bg-emerald-800/80 mx-1" />

      <button
        onClick={onExit}
        className="flex items-center gap-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-xl border border-emerald-700/60 transition-colors text-xs font-semibold"
      >
        <X className="w-3.5 h-3.5" />
        <span>Sair do Modo</span>
      </button>
    </div>
  );
};
