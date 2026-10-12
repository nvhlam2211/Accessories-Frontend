import { api } from "./api";
import type { User } from "../types";

type AuthResponse = { user: User };

export const authService = {
  current: () => api<AuthResponse>("/api/auth/me"),
  login: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    api<AuthResponse>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }),
  google: (credential: string) =>
    api<AuthResponse>("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    }),
  changePassword: (currentPassword: string | undefined, newPassword: string) =>
    api<AuthResponse>("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  logout: () => api<void>("/api/auth/logout", { method: "POST" }),
};
