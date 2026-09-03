import React, { useState } from 'react';
import { CanvasNode, AttachmentItem } from '../../types/canvas';
import { 
  Paperclip, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileCode, 
  FileCheck 
} from 'lucide-react';
import { NodeProgressBar } from '../common/NodeProgressBar';
import { NodeTimeFrame } from '../common/NodeTimeFrame';
import { getNodeColorTheme } from '../../utils/nodeTheme';

interface AttachmentNodeProps {
  node: CanvasNode;
  onUpdateData: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
}

export const AttachmentNode: React.FC<AttachmentNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [typeInput, setTypeInput] = useState<'link' | 'pdf' | 'image' | 'cad' | 'doc' | 'other'>('link');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Anexos & URLs');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const attachments: AttachmentItem[] = node.data.attachments || [];
  const verifiedCount = attachments.filter((a) => a.checked).length;
  const totalCount = attachments.length;

  const theme = getNodeColorTheme(node.color);

  const toggleAttachment = (id: string) => {
    const updated = attachments.map((att) =>
      att.id === id ? { ...att, checked: !att.checked } : att
    );
    const verified = updated.filter((a) => a.checked).length;
    const newPct = updated.length > 0 ? Math.round((verified / updated.length) * 100) : 0;
    onUpdateData(node.id, { attachments: updated, progressPercent: newPct, currentValue: newPct });
  };

  const addAttachment = () => {
    if (!nameInput.trim() || !urlInput.trim()) return;
    
    // Normalize URL if needed
    let formattedUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(formattedUrl) && !/^file:\/\/\//i.test(formattedUrl) && !formattedUrl.startsWith('/')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newItem: AttachmentItem = {
      id: `att-${Date.now()}`,
      name: nameInput.trim(),
      url: formattedUrl,
      type: typeInput,
      checked: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...attachments, newItem];
    const verified = updated.filter((a) => a.checked).length;
    const newPct = updated.length > 0 ? Math.round((verified / updated.length) * 100) : 0;

    onUpdateData(node.id, { attachments: updated, progressPercent: newPct, currentValue: newPct });
    setNameInput('');
    setUrlInput('');
    setIsAdding(false);
  };

  const removeAttachment = (id: string) => {
    const updated = attachments.filter((att) => att.id !== id);
    const verified = updated.filter((a) => a.checked).length;
    const newPct = updated.length > 0 ? Math.round((verified / updated.length) * 100) : 0;
    onUpdateData(node.id, { attachments: updated, progressPercent: newPct, currentValue: newPct });
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
  };

  const copyToClipboard = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const openUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderTypeIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'cad':
        return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'doc':
        return <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      default:
        return <LinkIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div
      id={`attachment-node-${node.id}`}
      className={`p-4 bg-gradient-to-br ${theme.bgGradient} border ${theme.borderNormal} rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg ${theme.iconBg} ${theme.iconText} border ${theme.iconBorder} shrink-0`}>
              <Paperclip className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${theme.textAccent} block`}>
                ANEXOS & URLS
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
                  className="bg-slate-950 border border-cyan-500/50 rounded px-1 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="font-semibold text-sm text-slate-100 leading-tight truncate cursor-pointer hover:underline transition-colors"
                  title="Clique para editar o nome da central de anexos"
                >
                  {node.name}
                </h3>
              )}
            </div>
          </div>

          <span className={`text-xs font-mono font-bold ${theme.badgeText} ${theme.badgeBg} border ${theme.badgeBorder} px-2 py-0.5 rounded-full shrink-0 ml-2`}>
            {verifiedCount}/{totalCount}
          </span>
        </div>

        {/* Datas do Quadro */}
        <NodeTimeFrame node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Barra de Progresso */}
        <NodeProgressBar node={node} onUpdateData={onUpdateData} className="my-2" />

        {/* Lista de Anexos */}
        <div className="space-y-1.5 my-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {attachments.length === 0 ? (
            <div className="p-3 text-center rounded-lg border border-dashed border-white/10 bg-slate-950/30 text-slate-400 text-xs">
              Nenhum anexo ou URL cadastrada.
            </div>
          ) : (
            attachments.map((att) => (
              <div
                key={att.id}
                className={`group/item flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                  att.checked
                    ? 'bg-slate-900/60 border-slate-700/60 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <input
                    type="checkbox"
                    checked={!!att.checked}
                    onChange={() => toggleAttachment(att.id)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer shrink-0"
                    title={att.checked ? 'Marcado como Validade/Anexado' : 'Marcar como Validade/Anexado'}
                  />
                  
                  {renderTypeIcon(att.type)}

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`font-medium truncate ${att.checked ? 'text-slate-100' : 'text-slate-400 line-through'}`}>
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate hover:text-cyan-300" title={att.url}>
                      {att.url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 group-hover/item:opacity-100 shrink-0">
                  <button
                    onClick={(e) => copyToClipboard(att.id, att.url, e)}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copiar Link / URL"
                  >
                    {copiedId === att.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => openUrl(att.url, e)}
                    className="p-1 hover:bg-cyan-500/20 rounded text-cyan-400 hover:text-cyan-300 transition-colors"
                    title="Abrir URL / Endereço em nova guia"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(att.id);
                    }}
                    className="p-1 hover:bg-rose-500/20 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form para Adicionar Anexo / URL */}
        {isAdding ? (
          <div className="p-2.5 bg-slate-950/80 border border-cyan-500/30 rounded-lg space-y-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Nome / Rótulo do Anexo</label>
              <input
                type="text"
                placeholder="Ex: Desenho Técnico CAD v2, Contrato, Link Drive"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">URL / Endereço Web ou Caminho</label>
              <input
                type="text"
                placeholder="https://drive.google.com/... ou file://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={typeInput}
                onChange={(e: any) => setTypeInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 font-mono focus:outline-none"
              >
                <option value="link">🌐 Web Link / Drive</option>
                <option value="pdf">📄 Documento PDF</option>
                <option value="cad">📐 Desenho CAD</option>
                <option value="image">🖼️ Imagem / Foto</option>
                <option value="doc">📝 Texto / Planilha</option>
                <option value="other">📦 Outro Tipo</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Anexo / URL
          </button>
        )}
      </div>
    </div>
  );
};
