import React from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V / Esc', desc: 'Modo Selecionar / Mover Objetos' },
    { key: 'Espaço + Arrastar', desc: 'Arrastar Canvas (Pan Livre)' },
    { key: 'Ctrl + C', desc: 'Copiar Quadro(s) Selecionado(s)' },
    { key: 'Ctrl + V', desc: 'Colar Quadro(s) Copiado(s)' },
    { key: 'Ctrl + X', desc: 'Recortar Quadro(s)' },
    { key: 'Ctrl + D', desc: 'Duplicar Objeto Imediatamente' },
    { key: 'C', desc: 'Modo Conectar (Ligar Nós)' },
    { key: 'Ctrl + K', desc: 'Busca Global & Filtros' },
    { key: 'F', desc: 'Ajustar Canvas na Tela (Fit View)' },
    { key: '+ / -', desc: 'Zoom In / Zoom Out' },
    { key: 'Ctrl + Z', desc: 'Desfazer Última Ação' },
    { key: 'Ctrl + Y', desc: 'Refazer Ação' },
    { key: 'Del / Backspace', desc: 'Excluir Objeto Selecionado' },
    { key: 'Duplo Clique', desc: 'Editar Texto / Nota' },
    { key: 'Botão Direito', desc: 'Menu de Contexto (Ações e Novos Objetos)' },
  ];

  return (
    <div
      id="shortcuts-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl p-5 text-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Atalhos de Teclado</h3>
              <p className="text-[11px] text-slate-400">
                Navegação rápida e comandos de produtividade no XCanvas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 my-2 overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-850 border border-slate-700 text-sky-300 rounded-lg font-mono text-[11px] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 text-center text-[11px] font-mono text-slate-500">
          XCanvas Studio • Workspace Visual Inteligente
        </div>
      </div>
    </div>
  );
};
