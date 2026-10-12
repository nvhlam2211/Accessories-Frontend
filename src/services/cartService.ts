import { api } from "./api";
import type { CartItem } from "../types";

export const cartService = {
  list: () => api<{ data: CartItem[] }>("/api/cart").then(result => result.data),
  add: (productId: number, quantity = 1) =>
    api<{ data: CartItem }>("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    }),
  setQuantity: (id: string, quantity: number) =>
    api<{ data: CartItem }>(`/api/cart/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    }),
  remove: (id: string) => api<void>(`/api/cart/items/${id}`, { method: "DELETE" }),
};
