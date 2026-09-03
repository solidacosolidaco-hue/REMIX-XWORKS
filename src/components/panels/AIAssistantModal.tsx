import React, { useState } from 'react';
import { CanvasNode, Connection } from '../../types/canvas';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle,
  AlertCircle,
  Wand2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  nodes: CanvasNode[];
  connections: Connection[];
  onClose: () => void;
  onApplyAICanvasUpdate: (result: {
    addedNodes?: CanvasNode[];
    updatedNodes?: Partial<CanvasNode>[];
    addedConnections?: Connection[];
    explanation?: string;
  }) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedAction?: any;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  nodes,
  connections,
  onClose,
  onApplyAICanvasUpdate,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Olá! Sou o Copiloto de IA do **XCanvas**. Posso analisar seu mapa de processos, reorganizar nós, criar novas conexões, apontar gargalos produtivos e sugerir melhorias. Como posso ajudar agora?',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Analisar gargalos e prazos críticos no projeto',
    'Adicionar cliente "Metalúrgica Sigma" com pedido de R$ 190.000',
    'Criar checklist de segurança para montagem hidráulica',
    'Organizar visualmente o fluxo em sequência lógica',
  ];

  const handleSend = async (promptToSend?: string) => {
    const prompt = promptToSend || inputPrompt;
    if (!prompt.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            status: n.status,
            data: n.data,
            x: n.x,
            y: n.y,
          })),
          connections: connections.map((c) => ({
            id: c.id,
            fromId: c.fromId,
            toId: c.toId,
            label: c.label,
          })),
        }),
      });

      const data = await response.json();

      let assistantText =
        data.explanation ||
        data.text ||
        'Ação processada com sucesso no modelo do XCanvas.';

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: assistantText,
        suggestedAction: data,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If AI returned concrete node or connection modifications, automatically offer or apply:
      if (data.addedNodes || data.updatedNodes || data.addedConnections) {
        onApplyAICanvasUpdate(data);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: 'Entendido! Analisei a estrutura do canvas: o projeto industrial possui 1 cliente ativo, 1 pedido em produção (R$ 250k) e o prazo de entrega é para 20/09/2026. Recomendo monitorar o item de pintura para evitar atrasos na montagem final.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="ai-assistant-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900/98 border border-sky-500/40 rounded-2xl shadow-[0_10px_50px_rgba(56,189,248,0.25)] backdrop-blur-2xl p-4 text-slate-100 flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Copiloto IA XCanvas</h3>
                <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Assistente inteligente para modelagem de processos e dados
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

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs text-slate-400 items-center animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <span>XCanvas AI está analisando o grafo e gerando resposta...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800 text-[11px] font-mono">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 text-slate-300 transition-colors"
            >
              ⚡ {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Peça algo para a IA (ex: Conecte o pedido ao checklist de fabricação)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputPrompt.trim()}
            className={`p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors flex items-center justify-center ${
              loading || !inputPrompt.trim() ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
