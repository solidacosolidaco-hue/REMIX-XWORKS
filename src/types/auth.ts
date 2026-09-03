export type UserRole = 'admin' | 'employee';

export interface EmployeePermissions {
  canCreateBoards: boolean; // Permissão para criar novas lousas/quadros
  canDeleteBoards: boolean; // Permissão para excluir lousas/quadros
  canEditNodes: boolean; // Permissão para adicionar/editar processos e nós na lousa
  canExport: boolean; // Permissão para exportar projetos e relatórios
  canManageOEE: boolean; // Permissão para gerenciar OEE e apontar paradas
}

export interface EmployeeUser {
  id: string;
  username: string; // Identificador único de login (ex: "ueliton")
  name: string; // Nome atribuído/nomeado pelo Administrador Geral
  password: string; // Senha de acesso (ex: "29101994")
  role: UserRole; // 'admin' apenas para o Administrador Geral (Ueliton)
  department: string; // Setor/Departamento/Cargo nomeado pelo admin
  avatarColor?: string;
  permissions?: EmployeePermissions; // Permissões atribuídas exclusivamente por Ueliton
  createdAt: string;
}
