import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Key,
  X,
  Check,
  Briefcase,
  Layers,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Edit3,
  Sliders,
  PlusCircle,
  FileDown,
  Activity,
  Lock,
  Sparkles,
} from 'lucide-react';
import { EmployeeUser, EmployeePermissions } from '../../types/auth';
import { CanvasBoard } from '../../types/canvas';
import {
  getRegisteredEmployees,
  saveEmployee,
  deleteEmployee,
  DEFAULT_EMPLOYEE_PERMISSIONS,
} from '../../data/userRegistry';

interface EmployeeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: EmployeeUser;
  boards: CanvasBoard[];
  onRefreshEmployees?: () => void;
}

export const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  boards,
  onRefreshEmployees,
}) => {
  const [employees, setEmployees] = useState<EmployeeUser[]>(() => getRegisteredEmployees());
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State para Novo Funcionário
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDepartment, setNewDepartment] = useState('Produção Industrial');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPermissions, setNewPermissions] = useState<EmployeePermissions>({
    ...DEFAULT_EMPLOYEE_PERMISSIONS,
  });

  // State para Edição / Nomeação / Permissões de um Funcionário Existente
  const [editingUser, setEditingUser] = useState<EmployeeUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPermissions, setEditPermissions] = useState<EmployeePermissions>({
    ...DEFAULT_EMPLOYEE_PERMISSIONS,
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  if (!isOpen) return null;

  // Verificação estrita de segurança: apenas Ueliton (Admin Geral) pode acessar
  const isUeliton = currentUser.username.trim().toLowerCase() === 'ueliton';

  if (!isUeliton) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0F1424] border border-red-500/40 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Acesso Restrito ao Administrador Geral</h2>
          <p className="text-xs text-slate-400">
            Somente o usuário <strong>Ueliton</strong> possui autorização para criar funcionários,
            nomear, conceder permissões e excluir colaboradores.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const refreshList = () => {
    const list = getRegisteredEmployees();
    setEmployees(list);
    if (onRefreshEmployees) onRefreshEmployees();
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setErrorMessage('Preencha os campos obrigatórios (Nome, Usuário e Senha).');
      return;
    }

    try {
      saveEmployee(
        {
          name: newName.trim(),
          username: newUsername.trim(),
          password: newPassword.trim(),
          department: newDepartment.trim() || 'Produção Industrial',
          role: 'employee',
          permissions: newPermissions,
        },
        currentUser
      );

      setSuccessMessage(`Funcionário "${newName}" nomeado e cadastrado com sucesso!`);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewPermissions({ ...DEFAULT_EMPLOYEE_PERMISSIONS });
      setIsAddingEmployee(false);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar funcionário.');
    }
  };

  const startEditing = (emp: EmployeeUser) => {
    setEditingUser(emp);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword(emp.password);
    setEditDepartment(emp.department);
    setEditPermissions({
      canCreateBoards: emp.permissions?.canCreateBoards ?? true,
      canDeleteBoards: emp.permissions?.canDeleteBoards ?? false,
      canEditNodes: emp.permissions?.canEditNodes ?? true,
      canExport: emp.permissions?.canExport ?? true,
      canManageOEE: emp.permissions?.canManageOEE ?? false,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!editName.trim() || !editUsername.trim() || !editPassword.trim()) {
      setErrorMessage('Nome, Usuário e Senha não podem ficar em branco.');
      return;
    }

    try {
      saveEmployee(
        {
          id: editingUser.id,
          name: editName.trim(),
          username: editUsername.trim(),
          password: editPassword.trim(),
          department: editDepartment.trim() || 'Operação',
          role: editingUser.role,
          avatarColor: editingUser.avatarColor,
          permissions: editPermissions,
        },
        currentUser
      );

      setSuccessMessage(`Dados e permissões de "${editName}" atualizados por Ueliton!`);
      setEditingUser(null);
      refreshList();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações.');
    }
  };

  const handleDelete = (user: EmployeeUser) => {
    if (user.username.toLowerCase() === 'ueliton' || user.role === 'admin') {
      alert('O Administrador Geral (Ueliton) não pode ser excluído.');
      return;
    }

    if (
      window.confirm(
        `Confirma a exclusão definitiva do funcionário "${user.name}" (${user.username})?`
      )
    ) {
      const res = deleteEmployee(user.id, currentUser);
      if (res.success) {
        setSuccessMessage(`Funcionário "${user.name}" removido.`);
        if (editingUser?.id === user.id) setEditingUser(null);
        refreshList();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.message || 'Erro ao excluir.');
      }
    }
  };

  return (
    <div
      id="employee-mgmt-overlay"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#0d121f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Exclusivo de Ueliton */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0A0D18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Central de Gestão de Funcionários & Permissões
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Painel Exclusivo de Ueliton
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Somente você (Ueliton) pode nomear funcionários, criar contas, definir senhas e
                atribuir permissões operacionais.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Funcionários sob sua gestão:{' '}
              <strong className="text-white">{employees.length}</strong>
            </div>
            {!editingUser && (
              <button
                id="btn-open-create-employee"
                onClick={() => setIsAddingEmployee(!isAddingEmployee)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAddingEmployee ? 'Fechar Formulário' : '+ Nomear / Criar Funcionário'}</span>
              </button>
            )}
          </div>

          {/* Form: Criar & Nomear Novo Funcionário (Exclusivo Ueliton) */}
          {isAddingEmployee && !editingUser && (
            <form
              onSubmit={handleCreateEmployee}
              className="p-5 rounded-xl bg-slate-900/90 border border-emerald-500/50 space-y-4 animate-fadeIn shadow-lg shadow-emerald-500/5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar e Nomear Novo Funcionário
                </h3>
                <span className="text-[11px] text-slate-400">Permissões configuráveis por Ueliton</span>
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Nome Completo do Funcionário *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: João Ferreira da Silva"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Usuário / Login de Acesso *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ex: joao.ferreira"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Senha Inicial *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Senha para o funcionário entrar"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono pr-8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Setor / Departamento / Cargo
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Produção Industrial">Produção Industrial</option>
                    <option value="Planejamento & PCP">Planejamento & PCP</option>
                    <option value="Engenharia & Projetos">Engenharia & Projetos</option>
                    <option value="Almoxarifado & Logística">Almoxarifado & Logística</option>
                    <option value="Qualidade & Metrologia">Qualidade & Metrologia</option>
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Manutenção Mecânica">Manutenção Mecânica</option>
                  </select>
                </div>
              </div>

              {/* Seção de Permissões Concedidas por Ueliton */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permissões de Acesso (Definidas pelo Admin Ueliton)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canCreateBoards}
                      onChange={(e) =>
                        setNewPermissions({ ...newPermissions, canCreateBoards: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px]">Criar Novas Lousas</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canDeleteBoards}
                      onChange={(e) =>
                        setNewPermissions({ ...newPermissions, canDeleteBoards: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px]">Excluir Lousas</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canEditNodes}
                      onChange={(e) =>
                        setNewPermissions({ ...newPermissions, canEditNodes: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px]">Editar / Adicionar Nós</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canExport}
                      onChange={(e) =>
                        setNewPermissions({ ...newPermissions, canExport: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px]">Exportar Relatórios/PDF</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canManageOEE}
                      onChange={(e) =>
                        setNewPermissions({ ...newPermissions, canManageOEE: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px]">Apontamento de Paradas/OEE</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingEmployee(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar e Nomear Funcionário
                </button>
              </div>
            </form>
          )}

          {/* Form: Editar, Nomear e Conceder Permissões para Funcionário Existente */}
          {editingUser && (
            <form
              onSubmit={handleSaveEdit}
              className="p-5 rounded-xl bg-slate-900/95 border border-amber-500/50 space-y-4 animate-fadeIn shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: editingUser.avatarColor || '#3b82f6' }}
                  >
                    {editingUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      Nomear & Definir Permissões de: {editingUser.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Alterações efetuadas pelo Administrador Geral Ueliton
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar Edição
                </button>
              </div>

              {/* Campos de Nomeação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Nome Completo (Nomear)
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Usuário / Login
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={editingUser.username.toLowerCase() === 'ueliton'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono pr-8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showEditPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Setor / Departamento / Cargo
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Administração Geral & Direção">Administração Geral & Direção</option>
                    <option value="Produção Industrial">Produção Industrial</option>
                    <option value="Planejamento & PCP">Planejamento & PCP</option>
                    <option value="Engenharia & Projetos">Engenharia & Projetos</option>
                    <option value="Almoxarifado & Logística">Almoxarifado & Logística</option>
                    <option value="Qualidade & Metrologia">Qualidade & Metrologia</option>
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Manutenção Mecânica">Manutenção Mecânica</option>
                  </select>
                </div>
              </div>

              {/* Toggles de Permissões (desabilitados para o próprio Ueliton, que tem tudo total) */}
              {editingUser.username.toLowerCase() !== 'ueliton' && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Conceder / Revogar Permissões Específicas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPermissions.canCreateBoards}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            canCreateBoards: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span className="text-slate-300 text-[11px]">Criar Novas Lousas</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPermissions.canDeleteBoards}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            canDeleteBoards: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span className="text-slate-300 text-[11px]">Excluir Lousas</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPermissions.canEditNodes}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            canEditNodes: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span className="text-slate-300 text-[11px]">Editar / Adicionar Nós</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPermissions.canExport}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            canExport: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span className="text-slate-300 text-[11px]">Exportar Relatórios/PDF</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPermissions.canManageOEE}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            canManageOEE: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span className="text-slate-300 text-[11px]">Apontamento de Paradas/OEE</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {/* Lista de Funcionários Cadastrados */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quadro de Funcionários Cadastrados
            </h3>

            {employees.map((emp) => {
              const isAdmin = emp.username.toLowerCase() === 'ueliton' || emp.role === 'admin';
              const userBoards = boards.filter((b) => b.userId === emp.id);
              const perms = emp.permissions || DEFAULT_EMPLOYEE_PERMISSIONS;

              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAdmin
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* User Profile Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner mt-0.5"
                        style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                      >
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                          {isAdmin ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-emerald-400" />
                              Administrador Geral (Ueliton)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                              Funcionário
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                          <span className="font-mono text-slate-300">
                            login: <strong className="text-slate-200">@{emp.username}</strong>
                          </span>
                          <span>•</span>
                          <span>{emp.department}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Layers className="w-3 h-3 text-blue-400" />
                            {userBoards.length} lousa{userBoards.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {/* Badges de Permissões Ativas */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Permissões:
                          </span>
                          {isAdmin ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Acesso Total e Irrestrito
                            </span>
                          ) : (
                            <>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${
                                  perms.canCreateBoards
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                }`}
                              >
                                Criar Lousas
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${
                                  perms.canDeleteBoards
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                }`}
                              >
                                Excluir Lousas
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${
                                  perms.canEditNodes
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                }`}
                              >
                                Editar Processos
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${
                                  perms.canExport
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                }`}
                              >
                                Exportar
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${
                                  perms.canManageOEE
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                                }`}
                              >
                                OEE
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações Exclusivas de Ueliton */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Botão Nomear & Editar Permissões */}
                      <button
                        onClick={() => startEditing(emp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                        title="Nomear, alterar login/senha e definir permissões"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nomear & Permissões</span>
                      </button>

                      {/* Botão Excluir (Disponível apenas para Ueliton excluir outros colaboradores) */}
                      {!isAdmin && (
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                          title="Excluir Colaborador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0A0D18] border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Apenas Ueliton possui autorização para criar, nomear, dar permissões e excluir.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
