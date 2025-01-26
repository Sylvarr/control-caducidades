export interface User {
  _id: string;
  username: string;
  role: "admin" | "supervisor" | "user";
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthStore extends AuthState {
  // Getters
  getToken: () => string | null;

  // Acciones
  setAuthenticated: (status: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;

  // Operaciones
  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
}
