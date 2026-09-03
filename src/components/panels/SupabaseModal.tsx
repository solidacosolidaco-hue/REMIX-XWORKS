import React, { useState, useEffect } from 'react';
import {
  Database,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Cloud,
  ArrowUpRight,
  ShieldCheck,
  Table,
  Upload,
  Download,
  X,
} from 'lucide-react';
import {
  checkSupabaseHealth,
  SupabaseHealthStatus,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA_SQL,
  syncAllBoardsToSupabase,
  fetchSupabaseBoards,
} from '../../lib/supabase';
import { CanvasBoard } from '../../types/canvas';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: CanvasBoard[];
  onBoardsLoadedFromSupabase?: (boards: CanvasBoard[]) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  boards,
  onBoardsLoadedFromSupabase,
}) => {
  const [status, setStatus] = useState<SupabaseHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const res = await checkSupabaseHealth();
      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncAllBoardsToSupabase(boards);
      if (result.saved === 0 && !status?.tables.boards) {
        setSyncMessage(
          'As tabelas ainda não existem no Supabase. Copie e execute o script SQL abaixo no Supabase SQL Editor para habilitar a gravação.'
        );
      } else {
        setSyncMessage(
          `Sincronização concluída com sucesso! ${result.saved} de ${result.total} quadros sincronizados no Supabase.`
        );
        runHealthCheck();
      }
    } catch (err: any) {
      setSyncMessage(`Erro ao sincronizar: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFromSupabase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const loadedBoards = await fetchSupabaseBoards();
      if (!loadedBoards) {
        setSyncMessage(
          'Tabela "boards" ainda não encontrada no banco. Execute o script SQL no Supabase primeiro.'
        );
      } else if (loadedBoards.length === 0) {
        setSyncMessage('Nenhum quadro gravado encontrado no Supabase ainda.');
      } else {
        if (onBoardsLoadedFromSupabase) {
          onBoardsLoadedFromSupabase(loadedBoards);
        }
        setSyncMessage(`${loadedBoards.length} quadro(s) carregados do Supabase com sucesso!`);
      }
    } catch (err: any) {
      setSyncMessage(`Erro ao carregar: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  const allTablesReady =
    status?.tables.boards && status?.tables.customers && status?.tables.orders;

  return (
    <div
      id="supabase-integration-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Integração Supabase Database
                </h2>
                {status?.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado ({status.latencyMs}ms)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Verificando...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Banco de dados PostgreSQL em tempo real via Supabase API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                SUPABASE_URL
              </span>
              <div className="font-mono text-xs text-emerald-300 truncate select-all">
                {SUPABASE_URL}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                Chave Anônima (Publishable Anon Key)
              </span>
              <div className="font-mono text-xs text-slate-400 truncate select-all">
                {SUPABASE_ANON_KEY.substring(0, 16)}...{SUPABASE_ANON_KEY.slice(-8)}
              </div>
            </div>
          </div>

          {/* Sync status alert if exists */}
          {syncMessage && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">{syncMessage}</div>
            </div>
          )}

          {/* Tables Status */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200 text-xs">
                  Estado das Tabelas no Banco de Dados
                </span>
              </div>
              <button
                onClick={runHealthCheck}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                title="Re-testar tabelas no Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  status?.tables.boards
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <span className="font-mono font-medium">public.boards</span>
                {status?.tables.boards ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                    Pendente
                  </span>
                )}
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  status?.tables.customers
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <span className="font-mono font-medium">public.customers</span>
                {status?.tables.customers ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                    Pendente
                  </span>
                )}
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  status?.tables.orders
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <span className="font-mono font-medium">public.orders</span>
                {status?.tables.orders ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                    Pendente
                  </span>
                )}
              </div>
            </div>

            {!allTablesReady && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2.5 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-100 mb-0.5">
                    Tabelas precisam ser criadas no painel do Supabase
                  </p>
                  <p className="text-amber-300/80 leading-relaxed">
                    A conexão com o servidor Supabase está ativa e autorizada. Para que o Supabase
                    possa persistir seus quadros, clientes e pedidos, execute o script SQL pronto
                    abaixo no SQL Editor do seu projeto Supabase.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sync Operations */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleSyncToSupabase}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {syncing ? 'Sincronizando...' : 'Enviar Quadros para o Supabase'}
            </button>

            <button
              onClick={handleLoadFromSupabase}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Carregar Dados do Supabase
            </button>

            <a
              href="https://supabase.com/dashboard/project/nwqbdwcvhdrjssoezftj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-700/50 transition-all ml-auto"
            >
              <span>Abrir Painel Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* SQL Script Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs text-slate-200">
                  Script SQL de Inicialização (Pronto para copiar)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  {showSqlPreview ? 'Ocultar código' : 'Ver código SQL'}
                </button>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-400">
              <p>
                <strong>Como aplicar no Supabase:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>
                  Acesse o painel do seu projeto no{' '}
                  <a
                    href="https://supabase.com/dashboard/project/nwqbdwcvhdrjssoezftj/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    SQL Editor <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li>Clique no botão verde <strong>"Copiar SQL"</strong> acima</li>
                <li>Cole no editor do Supabase e clique em <strong>Run</strong></li>
                <li>Pronto! O Supabase estará 100% pronto para leitura e gravação em tempo real.</li>
              </ol>

              {showSqlPreview && (
                <pre className="mt-3 p-3 bg-black/50 rounded-lg text-[11px] font-mono text-emerald-300/90 overflow-x-auto border border-slate-800 max-h-56 select-all">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>XWorks Cloud Sync • Supabase Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
