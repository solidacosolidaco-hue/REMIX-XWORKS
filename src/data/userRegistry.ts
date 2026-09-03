import { EmployeeUser, EmployeePermissions } from '../types/auth';

const STORAGE_KEY_EMPLOYEES = 'xworks_employees_registry';
const STORAGE_KEY_SESSION = 'xworks_current_session_user';

export const DEFAULT_ADMIN_PERMISSIONS: EmployeePermissions = {
  canCreateBoards: true,
  canDeleteBoards: true,
  canEditNodes: true,
  canExport: true,
  canManageOEE: true,
};

export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  canCreateBoards: true,
  canDeleteBoards: false, // Por padrão, apenas Ueliton exclui quadros, a menos que ele conceda permissão
  canEditNodes: true,
  canExport: true,
  canManageOEE: false,
};

// Administrador Geral Obrigatório e Permanente
export const GENERAL_ADMIN_USER: EmployeeUser = {
  id: 'user-ueliton',
  username: 'ueliton',
  name: 'Ueliton',
  password: '29101994',
  role: 'admin',
  department: 'Administração Geral & Direção',
  avatarColor: '#10b981', // Verde esmeralda executivo
  permissions: DEFAULT_ADMIN_PERMISSIONS,
  createdAt: '2026-09-01T00:00:00.000Z',
};

// Funcionários Iniciais Padrão para Demonstração
export const INITIAL_EMPLOYEES: EmployeeUser[] = [
  GENERAL_ADMIN_USER,
  {
    id: 'user-carlos',
    username: 'carlos',
    name: 'Carlos Silva',
    password: '123',
    role: 'employee',
    department: 'Produção Industrial',
    avatarColor: '#3b82f6',
    permissions: {
      canCreateBoards: true,
      canDeleteBoards: false,
      canEditNodes: true,
      canExport: true,
      canManageOEE: true,
    },
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'user-mariana',
    username: 'mariana',
    name: 'Mariana Souza',
    password: '123',
    role: 'employee',
    department: 'Planejamento & PCP',
    avatarColor: '#8b5cf6',
    permissions: {
      canCreateBoards: true,
      canDeleteBoards: false,
      canEditNodes: true,
      canExport: true,
      canManageOEE: false,
    },
    createdAt: '2026-09-02T11:30:00.000Z',
  },
  {
    id: 'user-roberto',
    username: 'roberto',
    name: 'Roberto Mendes',
    password: '123',
    role: 'employee',
    department: 'Engenharia & Qualidade',
    avatarColor: '#f59e0b',
    permissions: {
      canCreateBoards: false,
      canDeleteBoards: false,
      canEditNodes: true,
      canExport: false,
      canManageOEE: false,
    },
    createdAt: '2026-09-02T14:00:00.000Z',
  },
];

/**
 * Retorna todos os funcionários cadastrados
 */
export function getRegisteredEmployees(): EmployeeUser[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }

    const list: EmployeeUser[] = JSON.parse(raw);

    // Garantia absoluta: Ueliton é SEMPRE o Administrador Geral e sempre existe
    const hasAdmin = list.some((u) => u.username.toLowerCase() === 'ueliton');
    if (!hasAdmin) {
      list.unshift(GENERAL_ADMIN_USER);
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(list));
    } else {
      // Garante que o usuário Ueliton mantenha senha e privilégios corretos
      const adminIndex = list.findIndex((u) => u.username.toLowerCase() === 'ueliton');
      list[adminIndex] = {
        ...list[adminIndex],
        id: 'user-ueliton',
        username: 'ueliton',
        name: list[adminIndex].name || 'Ueliton',
        password: list[adminIndex].password || '29101994',
        role: 'admin',
        department: 'Administração Geral & Direção',
        permissions: DEFAULT_ADMIN_PERMISSIONS,
      };
    }

    // Regra mandatória: O ÚNICO administrador geral com permissões totais é o Ueliton
    return list.map((user) => {
      if (user.username.toLowerCase() === 'ueliton') {
        return {
          ...user,
          role: 'admin' as const,
          permissions: DEFAULT_ADMIN_PERMISSIONS,
        };
      }
      return {
        ...user,
        role: 'employee' as const,
        permissions: user.permissions || DEFAULT_EMPLOYEE_PERMISSIONS,
      };
    });
  } catch (err) {
    console.error('Erro ao ler funcionários do localStorage:', err);
    return INITIAL_EMPLOYEES;
  }
}

/**
 * Cadastra, nomeia ou atualiza um funcionário.
 * Regra ESTRITA: Apenas o Administrador Geral (Ueliton) tem autorização para criar, nomear ou dar permissões.
 */
export function saveEmployee(
  employeeData: Omit<EmployeeUser, 'id' | 'createdAt'> & {
    id?: string;
    permissions?: EmployeePermissions;
  },
  operatorUser?: EmployeeUser | null
): EmployeeUser {
  // Verificação estrita de autorização: Somente Ueliton pode criar funcionários, nomear ou alterar permissões
  const isAuthorized =
    Boolean(operatorUser && operatorUser.username.trim().toLowerCase() === 'ueliton');
  if (!isAuthorized) {
    throw new Error(
      'Acesso Negado: Somente o Administrador Geral (Ueliton) possui autorização para criar funcionários, nomear ou conceder permissões.'
    );
  }

  const currentList = getRegisteredEmployees();
  const normalizedUsername = employeeData.username.trim().toLowerCase();

  // Verifica se já existe outro funcionário com o mesmo username
  const existingWithUsername = currentList.find(
    (u) => u.username.toLowerCase() === normalizedUsername && u.id !== employeeData.id
  );
  if (existingWithUsername) {
    throw new Error(`O nome de usuário "${employeeData.username}" já está em uso.`);
  }

  // O único admin permitido é Ueliton
  const isUeliton = normalizedUsername === 'ueliton' || employeeData.id === 'user-ueliton';
  const role = isUeliton ? ('admin' as const) : ('employee' as const);

  const permissions: EmployeePermissions = isUeliton
    ? DEFAULT_ADMIN_PERMISSIONS
    : employeeData.permissions || DEFAULT_EMPLOYEE_PERMISSIONS;

  let updatedUser: EmployeeUser;

  if (employeeData.id) {
    // Edição / Renomeação / Atualização de Permissões
    const index = currentList.findIndex((u) => u.id === employeeData.id);
    if (index >= 0) {
      updatedUser = {
        ...currentList[index],
        name: employeeData.name.trim(),
        username: isUeliton ? 'ueliton' : normalizedUsername,
        password: employeeData.password.trim(),
        department: employeeData.department.trim() || 'Operação',
        avatarColor: employeeData.avatarColor || currentList[index].avatarColor,
        permissions,
        role,
      };
      currentList[index] = updatedUser;
    } else {
      updatedUser = {
        id: employeeData.id,
        name: employeeData.name.trim(),
        username: normalizedUsername,
        password: employeeData.password.trim(),
        department: employeeData.department.trim() || 'Operação',
        avatarColor: employeeData.avatarColor || '#3b82f6',
        permissions,
        role,
        createdAt: new Date().toISOString(),
      };
      currentList.push(updatedUser);
    }
  } else {
    // Criação e Nomeação de Novo Funcionário
    const newId = `user-${Date.now()}`;
    updatedUser = {
      id: newId,
      name: employeeData.name.trim(),
      username: normalizedUsername,
      password: employeeData.password.trim(),
      department: employeeData.department.trim() || 'Operação',
      avatarColor:
        employeeData.avatarColor ||
        ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6'][
          Math.floor(Math.random() * 6)
        ],
      permissions,
      role,
      createdAt: new Date().toISOString(),
    };
    currentList.push(updatedUser);
  }

  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(currentList));
  } catch (e) {
    console.error('Falha ao salvar funcionários:', e);
  }

  return updatedUser;
}

/**
 * Exclui um funcionário.
 * Regra ESTRITA: Apenas o Administrador Geral (Ueliton) pode excluir funcionários.
 * Ueliton NUNCA pode ser excluído.
 */
export function deleteEmployee(
  employeeId: string,
  operatorUser?: EmployeeUser | null
): { success: boolean; message?: string } {
  // Verificação estrita de autorização: Somente Ueliton pode excluir funcionários
  const isAuthorized =
    Boolean(operatorUser && operatorUser.username.trim().toLowerCase() === 'ueliton');
  if (!isAuthorized) {
    return {
      success: false,
      message: 'Acesso Negado: Apenas o Administrador Geral (Ueliton) tem autorização para excluir colaboradores.',
    };
  }

  const currentList = getRegisteredEmployees();
  const target = currentList.find((u) => u.id === employeeId);

  if (!target) {
    return { success: false, message: 'Funcionário não encontrado.' };
  }

  if (target.username.toLowerCase() === 'ueliton' || target.role === 'admin') {
    return {
      success: false,
      message: 'O Administrador Geral (Ueliton) é o gestor central do sistema e não pode ser excluído.',
    };
  }

  const filtered = currentList.filter((u) => u.id !== employeeId);
  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(filtered));
  } catch (e) {
    console.error('Erro ao excluir funcionário:', e);
    return { success: false, message: 'Erro ao gravar alterações.' };
  }

  return { success: true };
}

/**
 * Autentica um usuário com login e senha
 */
export function authenticateEmployee(username: string, pass: string): EmployeeUser | null {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Verificação direta prioritária para o Administrador Geral
  if (cleanUser === 'ueliton' && cleanPass === '29101994') {
    return GENERAL_ADMIN_USER;
  }

  const employees = getRegisteredEmployees();
  const match = employees.find(
    (e) => e.username.toLowerCase() === cleanUser && e.password === cleanPass
  );

  return match || null;
}

/**
 * Retorna a sessão ativa
 */
export function getActiveSession(): EmployeeUser | null {
  if (typeof window === 'undefined') return GENERAL_ADMIN_USER;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const sessionUser = JSON.parse(raw);

    // Valida se o usuário ainda existe no cadastro
    const employees = getRegisteredEmployees();
    const current = employees.find((e) => e.id === sessionUser.id);
    return current || null;
  } catch {
    return null;
  }
}

/**
 * Define a sessão ativa ou desconecta (logout)
 */
export function setActiveSession(user: EmployeeUser | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (e) {
    console.error('Erro ao alterar sessão:', e);
  }
}
