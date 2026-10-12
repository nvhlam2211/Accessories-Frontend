import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authService.current()
      .then(result => setUser(result.user))
      .catch(cause => {
        setUser(null);
        if (cause instanceof Error && !cause.message.includes("đăng nhập")) setError(cause.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(action: Promise<{ user: User }>) {
    const result = await action;
    setUser(result.user);
    setError("");
    return result.user;
  }

  async function login(email: string, password: string) {
    return authenticate(authService.login(email, password));
  }

  async function register(name: string, email: string, password: string) {
    return authenticate(authService.register(name, email, password));
  }

  async function loginWithGoogle(credential: string) {
    return authenticate(authService.google(credential));
  }

  async function changePassword(currentPassword: string | undefined, newPassword: string) {
    const result = await authService.changePassword(currentPassword, newPassword);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  const value = useMemo(() => ({
    user, loading, error, login, register, loginWithGoogle, changePassword, logout,
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng bên trong AuthProvider.");
  return context;
}
