import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Package, Tag, AlertTriangle, Layers } from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface ProductNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const ProductNode: React.FC<ProductNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Produto Industrial');
  const theme = getNodeColorTheme(node.color);

  const sku = node.data.sku || 'PRD-9042-X';
  const unitPrice = node.data.unitPrice ?? 14800;
  const stockQty = node.data.stockQty ?? 45;
  const minStockQty = node.data.minStockQty ?? 10;
  const category = node.data.category || 'Equipamentos Pesados';

  const isLowStock = stockQty <= minStockQty;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(unitPrice);

  const formattedStockValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(unitPrice * stockQty);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  return (
    <div
      id={`product-node-${node.id}`}
      className={`p-4 bg-gradient-to-br ${theme.bgGradient} border ${theme.borderNormal} rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg ${theme.iconBg} ${theme.iconText} border ${theme.iconBorder}`}>
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textAccent}`}>
              PRODUTO
            </span>
          </div>

          <span className={`px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono ${theme.badgeText} border border-white/5 font-semibold`}>
            {sku}
          </span>
        </div>

        {/* Product Title */}
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
            className="bg-slate-900 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <h3
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="font-bold text-sm text-white mb-0.5 leading-snug cursor-pointer hover:underline hover:text-indigo-300 transition-colors"
            title="Clique para editar o nome do produto"
          >
            {node.name}
          </h3>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2 font-mono">
          <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="truncate">{category}</span>
        </div>

        {/* Prazo Inicial e Prazo Final do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Content Progress Bar */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="mb-2" />

        {/* Tracking Section */}
        <div className="mb-2 px-2 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-tighter text-indigo-400 font-bold leading-none">Rastreio Vinculado</span>
            <span className="text-[10px] font-mono text-indigo-100 font-bold">#TRK-{node.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] text-emerald-400 font-medium">Lote Validado</span>
          </div>
        </div>

        {/* Product Specs Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[10px] font-mono">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">PREÇO UNIT.</span>
            <span className="text-indigo-300 font-bold">{formattedPrice}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">ESTOQUE TOTAL</span>
            <div className="flex items-center gap-1">
              <span className={`font-bold ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stockQty} un.
              </span>
              {isLowStock && (
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" title="Estoque abaixo do mínimo!" />
              )}
            </div>
          </div>
        </div>

        {/* Hierarchical Structure (BOM) */}
        {node.data.components && node.data.components.length > 0 && (
          <div className="mt-2 p-2 bg-slate-900/60 rounded-lg border border-indigo-500/10">
            <div className="flex items-center gap-1.5 mb-1.5 border-b border-white/5 pb-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estrutura de Nível Inferior (BOM)</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1 custom-scrollbar">
              {node.data.components.map((comp, idx) => (
                <div key={idx} className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] text-indigo-200 font-medium flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                  {comp}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Valor em Estoque:</span>
        <span className="text-emerald-400 font-bold">{formattedStockValue}</span>
      </div>
    </div>
  );
};
