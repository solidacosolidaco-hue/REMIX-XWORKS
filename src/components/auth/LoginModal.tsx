import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';
import { EmployeeUser } from '../../types/auth';
import { authenticateEmployee, getRegisteredEmployees } from '../../data/userRegistry';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: EmployeeUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const employees = getRegisteredEmployees();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, informe o usuário e a senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const user = authenticateEmployee(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
      setIsLoading(false);
    }, 200);
  };

  const handleQuickLogin = (quickUser: string, quickPass: string) => {
    setUsername(quickUser);
    setPassword(quickPass);
    setError(null);
    const user = authenticateEmployee(quickUser, quickPass);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div
      id="auth-login-overlay"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#070913]/90 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#0F1424] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header Background Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-500" />
        
        <div className="p-7 sm:p-8 space-y-6">
          {/* Brand & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-800 to-blue-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10 mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              XWorks • Controle Operacional
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Acesso exclusivo para funcionários aos quadros e fluxos de produção
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Usuário / Login */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Usuário / Login</span>
              </label>
              <div className="relative">
                <input
                  id="login-input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: ueliton ou nome do funcionário"
                  autoCapitalize="none"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Senha de Acesso</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-btn-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Autenticando...' : 'Acessar Meus Quadros'}</span>
            </button>
          </form>

          {/* Quick Access for Easy Testing */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-500">
                <KeyRound className="w-3 h-3 text-emerald-400" />
                Acesso Rápido de Teste
              </span>
              <span className="text-[10px] text-slate-500">Clique para entrar</span>
            </div>

            <div className="space-y-1.5">
              {/* Administrador Geral: Ueliton */}
              <button
                type="button"
                onClick={() => handleQuickLogin('ueliton', '29101994')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
                    UE
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Ueliton
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Admin Geral
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      login: ueliton • senha: ••••••••
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  Entrar &rarr;
                </span>
              </button>

              {/* Funcionário Carlos */}
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos', '123')}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-300">
                    CS
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200">Carlos Silva</span>
                      <span className="text-[10px] text-slate-400">Produção</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-blue-400 transition-colors">
                  Entrar &rarr;
                </span>
              </button>

              {/* Funcionária Mariana */}
              <button
                type="button"
                onClick={() => handleQuickLogin('mariana', '123')}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-xs text-purple-300">
                    MS
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200">Mariana Souza</span>
                      <span className="text-[10px] text-slate-400">PCP</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-purple-400 transition-colors">
                  Entrar &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>XWorks Industrial Systems</span>
          </div>
          <span>v2.8 Enterprise</span>
        </div>
      </div>
    </div>
  );
};
