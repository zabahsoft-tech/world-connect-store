import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

export interface CartItem {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  price: number;
  image_url: string | null;
  quantity: number;
  variantId?: string;
  variantName_en?: string;
  variantName_fa?: string;
  variantName_ps?: string;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "app_cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const COOKIE_BYTE_LIMIT = 3500; // stay well below the ~4 KB per-cookie limit

function readPersistedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  // Cookie is the source of truth (works in Safari Private + survives storage clears).
  const fromCookie = getCookie(STORAGE_KEY);
  if (fromCookie) {
    try {
      const parsed = JSON.parse(fromCookie);
      if (Array.isArray(parsed)) return parsed as CartItem[];
    } catch {
      // fall through to legacy localStorage
    }
  }
  // Legacy migration: pull from localStorage one last time, then clear it.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      localStorage.removeItem(STORAGE_KEY);
      if (Array.isArray(parsed)) return parsed as CartItem[];
    }
  } catch {
    // ignore
  }
  return [];
}

function persistCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    deleteCookie(STORAGE_KEY);
    return;
  }
  let payload = JSON.stringify(items);
  // If the full cart blows the cookie size budget, store a slim version
  // (id + qty + variant) and let the rest re-hydrate from product data on use.
  if (payload.length > COOKIE_BYTE_LIMIT) {
    const slim = items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name_en: i.name_en,
      name_fa: i.name_fa,
      name_ps: i.name_ps,
      price: i.price,
      image_url: null,
      quantity: i.quantity,
      variantId: i.variantId,
    }));
    payload = JSON.stringify(slim);
  }
  setCookie(STORAGE_KEY, payload, { maxAge: COOKIE_MAX_AGE, sameSite: "Lax" });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setItems(readPersistedCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    persistCart(items);
  }, [items, loaded]);

  const lineKey = (i: { id: string; variantId?: string }) => `${i.id}::${i.variantId ?? ""}`;

  const add: CartContextValue["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const key = lineKey(item);
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) {
        return prev.map((i) => (lineKey(i) === key ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * Number(i.price), 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
