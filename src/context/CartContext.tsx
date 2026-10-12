import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";
import type { CartItem, Product } from "../types";

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (product: Product, quantity?: number) => Promise<void>;
  setQuantity: (item: CartItem, quantity: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setError("");
      return;
    }
    try {
      setItems(await cartService.list());
      setError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không tải được giỏ hàng.";
      setError(message);
      throw cause;
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [authLoading, refresh]);

  async function add(product: Product, quantity = 1) {
    await cartService.add(product.id, quantity);
    await refresh();
  }

  async function setQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) {
      await remove(item.id);
      return;
    }
    await cartService.setQuantity(item.id, quantity);
    await refresh();
  }

  async function remove(id: string) {
    await cartService.remove(id);
    await refresh();
  }

  const value = useMemo(() => ({ items, loading, error, refresh, add, setQuantity, remove }), [items, loading, error, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart phải được dùng bên trong CartProvider.");
  return context;
}
