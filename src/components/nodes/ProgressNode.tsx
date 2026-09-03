import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Gauge, Palette, Sliders, CheckCircle2, ChevronRight } from 'lucide-react';
import { NodeTimeFrame } from '../common/NodeTimeFrame';

interface ProgressNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

const COLOR_THEMES = [
  { id: 'emerald', label: 'Esmeralda', gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'blue', label: 'Azul', gradient: 'from-blue-500 to-sky-400', text: 'text-blue-400', bg: 'bg-blue-500', ring: 'ring-blue-400' },
  { id: 'cyan', label: 'Ciano', gradient: 'from-cyan-500 to-teal-300', text: 'text-cyan-400', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
  { id: 'purple', label: 'Roxo', gradient: 'from-purple-500 to-fuchsia-400', text: 'text-purple-400', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'amber', label: 'Âmbar', gradient: 'from-amber-500 to-yellow-400', text: 'text-amber-400', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  { id: 'rose', label: 'Rosa', gradient: 'from-rose-500 to-pink-400', text: 'text-rose-400', bg: 'bg-rose-500', ring: 'ring-rose-400' },
  { id: 'indigo', label: 'Índigo', gradient: 'from-indigo-500 to-blue-600', text: 'text-indigo-400', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
];

export const ProgressNode: React.FC<ProgressNodeProps> = ({ node, onUpdateData, onUpdateTitle }) => {
  const currentValue = typeof node.data.currentValue === 'number' ? node.data.currentValue : 65;
  const themeId = node.data.colorTheme || 'emerald';
  const subtitle = node.data.subtitle || 'Barra de Progresso Personalizada';

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Barra de Progresso');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const activeTheme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];

  const handleValueChange = (newValue: number) => {
    const clamped = Math.min(100, Math.max(0, newValue));
    onUpdateData?.(node.id, { currentValue: clamped });
  };

  const handleColorChange = (colorId: string) => {
    onUpdateData?.(node.id, { colorTheme: colorId });
    setShowColorPicker(false);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`progress-node-${node.id}`}
      className="p-4 bg-[#0D1221]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl text-slate-100 flex flex-col justify-between w-full h-full select-none"
    >
      {/* Header: Icon, Editable Title & Percentage */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${activeTheme.text} shrink-0`}>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${activeTheme.text} block`}>
              PROGRESSO MODULAR
            </span>
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                }}
                className="bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
              />
            ) : (
              <h3
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className="font-bold text-xs text-slate-100 leading-tight truncate cursor-pointer hover:text-white hover:underline transition-colors"
                title="Clique para editar o título"
              >
                {node.name || 'Barra de Progresso'}
              </h3>
            )}
          </div>
        </div>

        {/* Big Percentage Display & Color Palette Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="Personalizar Cor da Barra"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <span className={`text-base font-mono font-extrabold ${activeTheme.text}`}>
            {currentValue}%
          </span>
        </div>
      </div>

      {/* Color Palette Popover Dropdown */}
      {showColorPicker && (
        <div
          className="my-2 p-2 bg-slate-900/95 border border-white/10 rounded-lg shadow-xl flex items-center justify-between gap-1 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-slate-400 font-mono">Cor:</span>
          <div className="flex items-center gap-1.5">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleColorChange(theme.id)}
                className={`w-4 h-4 rounded-full ${theme.bg} transition-transform ${
                  themeId === theme.id ? `ring-2 ${theme.ring} scale-125` : 'hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                title={theme.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Customizable Progress Bar */}
      <div className="my-2 space-y-2">
        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Interactive Clickable Bar Track */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.round((clickX / rect.width) * 100);
            handleValueChange(pct);
          }}
          className="relative w-full h-4 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10 cursor-pointer group shadow-inner"
          title="Clique ou arraste para ajustar o progresso"
        >
          <div
            className={`h-full bg-gradient-to-r ${activeTheme.gradient} rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]`}
            style={{ width: `${currentValue}%` }}
          />
        </div>

        {/* Range Slider for Smooth Control */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={currentValue}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-full accent-emerald-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Quick Percentage Presets & Connection Info */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(Math.max(0, currentValue - 10));
            }}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            -10%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(50);
            }}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            50%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(100);
            }}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            100%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleValueChange(Math.min(100, currentValue + 10));
            }}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            +10%
          </button>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
          <ChevronRight className="w-3 h-3 text-emerald-400" />
          <span>Conecta c/ todos os módulos</span>
        </div>
      </div>
    </div>
  );
};

