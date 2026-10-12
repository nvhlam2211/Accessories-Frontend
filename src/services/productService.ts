import { api } from "./api";
import type { ApiList, Category, Product } from "../types";

export const productService = {
  list: (query = "") => api<ApiList<Product>>(`/api/products${query}`).then(result => result.data),
  search: (search: string, limit = 5) => {
    const params = new URLSearchParams({ search, limit: String(limit) });
    return api<ApiList<Product>>(`/api/products?${params}`).then(result => result.data);
  },
  listSale: () => api<ApiList<Product>>("/api/products?category=sale&limit=100").then(result => result.data),
  listBestSellers: () => api<{ data: Product[] }>("/api/products/best-sellers").then(result => result.data),
  get: (id: number) => api<{ data: Product }>(`/api/products/${id}`).then(result => result.data),
  listAdmin: () => api<ApiList<Product>>("/api/products?includeInactive=true").then(result => result.data),
  create: (form: FormData) => api<{ data: Product; productRemoved?: boolean }>("/api/products", { method: "POST", body: form }),
  update: (id: number, form: FormData) => api<{ data: Product | null; productRemoved?: boolean }>(`/api/products/${id}`, { method: "PATCH", body: form }),
  remove: (id: number) => api<void>(`/api/products/${id}`, { method: "DELETE" }),
};

export const categoryService = {
  list: () => api<{ data: Category[] }>("/api/categories").then(result => result.data),
  listAdmin: () => api<{ data: Category[] }>("/api/categories?admin=true").then(result => result.data),
  create: (category: Pick<Category, "name" | "slug"> & Partial<Pick<Category, "description" | "active">>) =>
    api<{ data: Category }>("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    }),
  update: (id: number, category: Partial<Category>) =>
    api<{ data: Category }>(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    }),
  remove: (id: number) => api<void>(`/api/categories/${id}`, { method: "DELETE" }),
};
