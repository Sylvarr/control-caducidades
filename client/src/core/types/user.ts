export type UserRole = "admin" | "manager" | "employee";

export type UserPermission =
  | "users:manage"
  | "users:view"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "products:move"
  | "products:view"
  | "sync:manage"
  | "sync:view";

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserState extends User {
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export interface UserFilters {
  searchTerm?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: "username" | "email" | "role" | "lastLogin" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface UserMutation {
  id: string;
  changes: Partial<User>;
  optimisticUpdate?: boolean;
}

export interface UserStore {
  // Estado
  users: UserState[];
  selectedUser: UserState | null;
  loading: boolean;
  error: string | null;
  filters: UserFilters;

  // Getters
  getUser: (id: string) => UserState | null;
  getFilteredUsers: () => UserState[];
  getSelectedUser: () => UserState | null;

  // Acciones
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: UserState | null) => void;
  createUser: (
    user: Omit<User, "_id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateUser: (mutation: UserMutation) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setFilters: (filters: Partial<UserFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export interface RoleConfig {
  [key: string]: {
    name: string;
    description: string;
    permissions: UserPermission[];
  };
}

export const ROLE_CONFIG: RoleConfig = {
  admin: {
    name: "Administrador",
    description: "Acceso completo al sistema",
    permissions: [
      "users:manage",
      "users:view",
      "products:create",
      "products:edit",
      "products:delete",
      "products:move",
      "products:view",
      "sync:manage",
      "sync:view",
    ],
  },
  manager: {
    name: "Gerente",
    description: "Gestión de productos y usuarios",
    permissions: [
      "users:view",
      "products:create",
      "products:edit",
      "products:delete",
      "products:move",
      "products:view",
      "sync:view",
    ],
  },
  employee: {
    name: "Empleado",
    description: "Operaciones básicas de productos",
    permissions: ["products:view", "products:move", "sync:view"],
  },
};
