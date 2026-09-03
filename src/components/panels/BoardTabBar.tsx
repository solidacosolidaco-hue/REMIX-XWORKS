import React, { useState, useRef, useEffect } from 'react';
import { CanvasBoard, CanvasTheme } from '../../types/canvas';
import { EmployeeUser } from '../../types/auth';
import {
  Plus,
  Layout,
  Copy,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  X,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Square,
  Grid,
  FileText,
  User,
  Filter,
  Lock,
} from 'lucide-react';

interface BoardTabBarProps {
  boards: CanvasBoard[];
  activeBoardId: string;
  theme?: CanvasTheme;
  currentUser?: EmployeeUser | null;
  allEmployees?: EmployeeUser[];
  selectedEmployeeFilter?: string;
  onSelectEmployeeFilter?: (employeeId: string) => void;
  onChangeTheme?: (theme: CanvasTheme) => void;
  onSelectBoard: (boardId: string) => void;
  onAddBoard: (name?: string) => void;
  onRenameBoard: (boardId: string, newName: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onClearBoard: (boardId: string) => void;
}

export const BoardTabBar: React.FC<BoardTabBarProps> = ({
  boards,
  activeBoardId,
  theme = 'dark',
  currentUser,
  allEmployees = [],
  selectedEmployeeFilter = 'all',
  onSelectEmployeeFilter,
  onChangeTheme,
  onSelectBoard,
  onAddBoard,
  onRenameBoard,
  onDuplicateBoard,
  onDeleteBoard,
  onClearBoard,
}) => {
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingBoardId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingBoardId]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setMenuOpenId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleStartRename = (board: CanvasBoard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingBoardId(board.id);
    setEditingName(board.name);
    setMenuOpenId(null);
  };

  const handleSaveRename = (boardId: string) => {
    if (editingName.trim()) {
      onRenameBoard(boardId, editingName.trim());
    }
    setEditingBoardId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, boardId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(boardId);
    } else if (e.key === 'Escape') {
      setEditingBoardId(null);
    }
  };

  return (
    <div
      ref={tabBarRef}
      id="board-tab-bar"
      className="relative h-10 bg-[#0A0D18] border-b border-white/5 flex items-center justify-between px-3 z-40 select-none shrink-0"
    >
      {/* Scrollable Tabs List */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1.5 flex items-center gap-1 shrink-0">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Lousas:</span>
        </span>

        {boards.map((board) => {
          const isActive = board.id === activeBoardId;
          const isEditing = editingBoardId === board.id;

          return (
            <div
              key={board.id}
              className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                isActive
                  ? 'bg-blue-600/20 text-blue-200 border-blue-500/40 shadow-sm shadow-blue-500/10 font-bold'
                  : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
              onClick={() => {
                if (!isEditing) onSelectBoard(board.id);
              }}
              onDoubleClick={(e) => handleStartRename(board, e)}
              title="Clique para alternar • Duplo clique para renomear"
            >
              <Layout className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, board.id)}
                    className="bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28 sm:w-36 font-sans"
                  />
                  <button
                    onClick={() => handleSaveRename(board.id)}
                    className="p-0.5 hover:bg-blue-500/20 rounded text-emerald-400"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingBoardId(null)}
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="truncate max-w-[120px] sm:max-w-[180px] font-medium">
                  {board.name}
                </span>
              )}

              {/* Node count pill */}
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-400 border border-white/5">
                {board.nodes.length}
              </span>

              {/* Owner tag */}
              {board.ownerName && (
                <span
                  className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-white/5 truncate max-w-[80px]"
                  title={`Criado por: ${board.ownerName}`}
                >
                  {board.ownerName}
                </span>
              )}

              {/* Board Menu Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuOpenId === board.id) {
                    setMenuOpenId(null);
                    setMenuPosition(null);
                  } else {
                    setMenuOpenId(board.id);
                    if (tabBarRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = tabBarRef.current.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom - parentRect.top + 4,
                        left: Math.min(
                          parentRect.width - 180,
                          rect.left - parentRect.left - 130
                        ),
                      });
                    }
                  }
                }}
                className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
                title="Opções da Lousa"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* PROMINENT ADD BOARD '+' BUTTON (Respects Ueliton's permissions) */}
        {(!currentUser || currentUser.role === 'admin' || (currentUser.permissions?.canCreateBoards ?? true)) ? (
          <button
            id="btn-add-new-board"
            onClick={() => onAddBoard()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 transition-all shadow-md shrink-0 ml-1 active:scale-95 group"
            title="Criar Nova Lousa / Novo Quadro (+)"
          >
            <Plus className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">Nova Lousa</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-900/60 text-slate-500 border border-slate-800/80 shrink-0 ml-1 cursor-not-allowed opacity-75"
            title="Criação de lousas bloqueada pela Administração (Ueliton)"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Nova Lousa</span>
          </div>
        )}
      </div>

      {/* Dropdown Menu - rendered on top-level to prevent scrollbar clipping */}
      {menuOpenId && menuPosition && (() => {
        const board = boards.find((b) => b.id === menuOpenId);
        if (!board) return null;
        const canDeleteThisBoard =
          !currentUser ||
          currentUser.role === 'admin' ||
          (currentUser.permissions?.canDeleteBoards ?? false);

        return (
          <div
            className="absolute bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-normal text-slate-200"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: '170px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleStartRename(board);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
              Renomear Lousa
            </button>
            <button
              onClick={() => {
                onDuplicateBoard(board.id);
                setMenuOpenId(null);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-300"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              Duplicar Lousa
            </button>
            <button
              onClick={() => {
                onClearBoard(board.id);
                setMenuOpenId(null);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-amber-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Limpar Objetos
            </button>
            {boards.length > 1 && canDeleteThisBoard && (
              <button
                onClick={() => {
                  onDeleteBoard(board.id);
                  setMenuOpenId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 border-t border-slate-800 mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Lousa
              </button>
            )}
          </div>
        );
      })()}

      {/* Board Summary Info & Theme Selector */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
        {/* Admin Filter by Employee */}
        {currentUser?.role === 'admin' && allEmployees.length > 0 && onSelectEmployeeFilter && (
          <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-emerald-500/30 rounded-lg px-2 py-0.5 text-[11px]">
            <Filter className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400">Filtro:</span>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => onSelectEmployeeFilter(e.target.value)}
              className="bg-transparent text-emerald-300 text-[10px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todos os Quadros</option>
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                  {emp.name} {emp.username === 'ueliton' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <span className="hidden lg:inline text-slate-500">Total: {boards.length} Lousas</span>

        {onChangeTheme && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-lg p-0.5">
            <button
              id="theme-btn-white"
              onClick={() => onChangeTheme('white')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                theme === 'white' || theme === 'light'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Fundo Branco"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Branco</span>
            </button>

            <button
              id="theme-btn-black"
              onClick={() => onChangeTheme('black')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                theme === 'black' || theme === 'dark'
                  ? 'bg-slate-950 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Fundo Preto"
            >
              <Moon className="w-3 h-3 text-slate-300" />
              <span>Preto</span>
            </button>

            <button
              id="theme-btn-gray"
              onClick={() => onChangeTheme('gray')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                theme === 'gray'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Fundo Cinza"
            >
              <Square className="w-3 h-3 text-slate-400" />
              <span>Cinza</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
