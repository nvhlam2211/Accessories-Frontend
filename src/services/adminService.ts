import { api } from "./api";
import type { PageAdminAccount, RevenueReport, SaleHistoryPage, SaleRecord } from "../types";

export const adminService = {
  pageAdmins: () => api<{ data: PageAdminAccount[] }>("/api/admin/accounts").then(result => result.data),
  createPageAdmin: (account: { name: string; email: string; password: string; ownerNote: string }) =>
    api<{ data: PageAdminAccount }>("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    }).then(result => result.data),
  updatePageAdminNote: (id: string, ownerNote: string) =>
    api<{ data: PageAdminAccount }>(`/api/admin/accounts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerNote }),
    }).then(result => result.data),
  deletePageAdmin: (id: string) =>
    api<{ data: { id: string } }>(`/api/admin/accounts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(result => result.data),
  reports: () => api<{ data: RevenueReport }>("/api/admin/reports").then(result => result.data),
  recordSale: (productId: number, quantity: number, unitPrice?: number) =>
    api<{ data: unknown; productRemoved: boolean; remainingStock: number }>("/api/admin/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, unitPrice }),
    }),
  sales: (page = 1) => api<SaleHistoryPage>(`/api/admin/sales?page=${page}&limit=100`),
  updateSale: (id: number, quantity: number, unitPrice: number, reason: string) =>
    api<{ data: SaleRecord }>(`/api/admin/sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, unitPrice, reason }),
    }),
  voidSale: (id: number, reason: string) =>
    api<{ data: SaleRecord }>(`/api/admin/sales/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),
  resetSales: (reason: string) =>
    api<{ data: { voidedSales: number; inventoryRestored: number; inventoryNotRestored: number } }>("/api/admin/sales/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).then(result => result.data),
};
