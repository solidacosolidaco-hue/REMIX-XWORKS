import React, { useState, useMemo } from 'react';
import { TEMPLATES, WorkspaceTemplate } from '../../data/templates';
import { CanvasNode, Connection } from '../../types/canvas';
import {
  FolderOpen,
  X,
  Factory,
  Settings,
  ShieldCheck,
  Layers,
  FileDown,
  FileUp,
  Kanban,
  BarChart3,
  Users,
  Code,
  Target,
  Truck,
  Calendar,
  Save,
  Trash2,
  Check,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  nodes: CanvasNode[];
  connections: Connection[];
  onClose: () => void;
  onLoadTemplate: (nodes: CanvasNode[], connections: Connection[]) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  nodes,
  connections,
  onClose,
  onLoadTemplate,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<WorkspaceTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('xcanvas_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deletedSystemTemplates, setDeletedSystemTemplates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xcanvas_deleted_system_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string;
    name: string;
    isSystem: boolean;
  } | null>(null);

  const [showDeletedList, setShowDeletedList] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [newTemplateName, setNewTemplateName] = useState('Modelo de Pedido');
  const [newTemplateDescription, setNewTemplateDescription] = useState('Estrutura de pedido comercial com fluxos vinculados.');
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  // Filter out system templates that the user has deleted
  const activeSystemTemplates = useMemo(() => {
    return Object.entries(TEMPLATES).filter(([name]) => !deletedSystemTemplates.includes(name));
  }, [deletedSystemTemplates]);

  if (!isOpen) return null;

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTemplate: WorkspaceTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || 'Modelo personalizado salvo pelo usuário.',
      category: 'Meus Modelos',
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
    };

    const updated = [newTemplate, ...customTemplates];
    setCustomTemplates(updated);
    localStorage.setItem('xcanvas_custom_templates', JSON.stringify(updated));
    setIsSaveSuccess(true);
    setFeedbackMessage(`Modelo "${newTemplate.name}" salvo com sucesso!`);
    setTimeout(() => {
      setIsSaveSuccess(false);
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleConfirmDelete = () => {
    if (!templateToDelete) return;

    const { id, name, isSystem } = templateToDelete;

    if (isSystem) {
      const updated = [...deletedSystemTemplates, name];
      setDeletedSystemTemplates(updated);
      localStorage.setItem('xcanvas_deleted_system_templates', JSON.stringify(updated));
      setFeedbackMessage(`Modelo do sistema "${name}" removido.`);
    } else {
      const updated = customTemplates.filter(t => t.id !== id);
      setCustomTemplates(updated);
      localStorage.setItem('xcanvas_custom_templates', JSON.stringify(updated));
      setFeedbackMessage(`Modelo personalizado "${name}" excluído.`);
    }

    setTemplateToDelete(null);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleRestoreSystemTemplate = (name: string) => {
    const updated = deletedSystemTemplates.filter(n => n !== name);
    setDeletedSystemTemplates(updated);
    localStorage.setItem('xcanvas_deleted_system_templates', JSON.stringify(updated));
    setFeedbackMessage(`Modelo "${name}" restaurado com sucesso.`);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleRestoreAllSystemTemplates = () => {
    setDeletedSystemTemplates([]);
    localStorage.removeItem('xcanvas_deleted_system_templates');
    setShowDeletedList(false);
    setFeedbackMessage('Todos os modelos padrão do sistema foram restaurados.');
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ nodes, connections }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `xcanvas-workspace-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.nodes && parsed.connections) {
            onLoadTemplate(parsed.nodes, parsed.connections);
            onClose();
          } else {
            setImportError('Estrutura JSON incompatível.');
          }
        } catch (err) {
          setImportError('Arquivo JSON inválido para o XCanvas.');
        }
      };
    }
  };

  const getIconForTemplate = (name: string) => {
    if (name.includes('Pedido') || name.includes('Venda')) return <BarChart3 className="w-4 h-4" />;
    if (name.includes('Máquina')) return <Factory className="w-4 h-4" />;
    if (name.includes('Manutenção')) return <Settings className="w-4 h-4" />;
    if (name.includes('Qualidade')) return <ShieldCheck className="w-4 h-4" />;
    if (name.includes('Ágeis')) return <Kanban className="w-4 h-4" />;
    if (name.includes('Vendas')) return <BarChart3 className="w-4 h-4" />;
    if (name.includes('Humanos')) return <Users className="w-4 h-4" />;
    if (name.includes('Software')) return <Code className="w-4 h-4" />;
    if (name.includes('Estratégico')) return <Target className="w-4 h-4" />;
    if (name.includes('Logística')) return <Truck className="w-4 h-4" />;
    if (name.includes('Eventos')) return <Calendar className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
  };

  const getColorForTemplate = (name: string) => {
    if (name.includes('Pedido') || name.includes('Venda')) return 'emerald';
    if (name.includes('Máquina')) return 'amber';
    if (name.includes('Manutenção')) return 'blue';
    if (name.includes('Qualidade')) return 'cyan';
    if (name.includes('Ágeis')) return 'blue';
    if (name.includes('Vendas')) return 'emerald';
    if (name.includes('Humanos')) return 'rose';
    if (name.includes('Software')) return 'indigo';
    if (name.includes('Estratégico')) return 'amber';
    if (name.includes('Logística')) return 'slate';
    if (name.includes('Eventos')) return 'rose';
    return 'slate';
  };

  return (
    <div
      id="templates-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl p-5 text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Modelos de Workspace & Dados</h3>
              <p className="text-[11px] text-slate-400">
                Carregue cenários prontos de manufatura, engenharia ou salve a estrutura atual da lousa
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

        {/* Save Current Board Form */}
        <form onSubmit={handleSaveCurrentAsTemplate} className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Salvar Estrutura Atual como Modelo
            </span>
            {isSaveSuccess && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3" /> Modelo Salvo com Sucesso!
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nome do Modelo (ex: Modelo de Pedido)"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex-[1.5]">
              <input
                type="text"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Descrição curta do modelo"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Modelo
            </button>
          </div>
        </form>

        {/* Import Error Message */}
        {importError && (
          <div className="mb-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {importError}
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="mb-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in duration-150">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              {feedbackMessage}
            </span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Container with List */}
        <div className="flex-1 overflow-y-auto pr-1 my-1">
          {/* Custom Templates Section */}
          {customTemplates.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-1">
                ★ Meus Modelos Salvos ({customTemplates.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customTemplates.map((template) => {
                  const color = 'emerald';
                  const icon = <BarChart3 className="w-4 h-4" />;
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        onLoadTemplate(template.nodes, template.connections);
                        onClose();
                      }}
                      className="p-4 rounded-xl bg-slate-950/90 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all flex flex-col justify-between group relative"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                            {icon}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-${color}-950/60 border border-${color}-500/30 text-${color}-300`}>
                              {template.nodes.length} Blocos
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateToDelete({
                                  id: template.id,
                                  name: template.name,
                                  isSystem: false,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Excluir este modelo personalizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className={`font-bold text-xs text-slate-200 group-hover:text-${color}-300`}>
                          {template.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                      <div className={`mt-3 text-[10px] font-mono text-${color}-400 font-semibold flex items-center justify-between`}>
                        <span>Carregar Modelo Personalizado →</span>
                        <span className="text-[9px] text-slate-500 font-normal">Salvo em LocalStorage</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Templates Section */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Modelos Disponíveis do Sistema {activeSystemTemplates.length > 0 && `(${activeSystemTemplates.length})`}
            </h4>
            {deletedSystemTemplates.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeletedList(!showDeletedList)}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline decoration-dotted transition-colors"
                >
                  {showDeletedList ? 'Ocultar excluídos' : `Ver excluídos (${deletedSystemTemplates.length})`}
                </button>
                <button
                  type="button"
                  onClick={handleRestoreAllSystemTemplates}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded transition-colors"
                  title="Restaurar todos os modelos padrão do sistema que foram excluídos"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar Modelos Padrão
                </button>
              </div>
            )}
          </div>

          {/* Collapsible list of deleted system templates */}
          {showDeletedList && deletedSystemTemplates.length > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Modelos excluídos/ocultos ({deletedSystemTemplates.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {deletedSystemTemplates.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="truncate max-w-[200px]">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRestoreSystemTemplate(name)}
                      className="text-amber-400 hover:text-amber-300 font-semibold text-[10px] flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                      title={`Restaurar "${name}"`}
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Restaurar
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeSystemTemplates.length === 0 && (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2 mb-3">
              <p className="text-xs text-slate-400">Você removeu todos os modelos padrão do sistema.</p>
              <button
                type="button"
                onClick={handleRestoreAllSystemTemplates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Todos os Modelos Padrão
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            {activeSystemTemplates.map(([name, template]) => {
              const color = getColorForTemplate(name);
              const icon = getIconForTemplate(name);
              const description = template.nodes.find(n => n.type === 'group')?.data?.description || 'Modelo operacional completo para este setor.';

              return (
                <div
                  key={name}
                  onClick={() => {
                    onLoadTemplate(template.nodes, template.connections);
                    onClose();
                  }}
                  className={`p-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-${color}-500/60 cursor-pointer transition-all flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                        {icon}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-${color}-950/60 border border-${color}-500/30 text-${color}-300`}>
                          {template.nodes.length} Blocos
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplateToDelete({
                              id: name,
                              name: name,
                              isSystem: true,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Excluir este modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className={`font-bold text-xs text-slate-200 group-hover:text-${color}-300`}>
                      {name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <div className={`mt-3 text-[10px] font-mono text-${color}-400 font-semibold`}>
                    Carregar Modelo →
                  </div>
                </div>
              );
            })}

            {/* Blank Canvas */}
            <div
              onClick={() => {
                onLoadTemplate([], []);
                onClose();
              }}
              className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/60 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Lousa Vazia
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-200 group-hover:text-sky-300">
                  Canvas Infinito em Branco
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Comece do zero criando objetos, notas, conexões e fluxogramas livres.
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-sky-400 font-semibold">
                Iniciar em Branco →
              </div>
            </div>
          </div>
        </div>

        {/* Import / Export JSON */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Exportar Workspace (JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition-colors cursor-pointer">
            <FileUp className="w-4 h-4 text-sky-400" />
            <span>Importar Arquivo JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Confirmation Modal for deleting any template */}
      {templateToDelete && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setTemplateToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Excluir Modelo</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirma a exclusão deste modelo?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Você está prestes a excluir o modelo:
              </p>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-white font-semibold text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">{templateToDelete.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {templateToDelete.isSystem
                  ? 'Este modelo padrão do sistema será removido da sua lista de opções. Se você precisar dele novamente no futuro, poderá restaurá-lo com um clique.'
                  : 'Este modelo personalizado será excluído permanentemente da sua lousa.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
