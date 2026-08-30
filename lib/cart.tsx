"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CATALOG, KIT_SKU, getSku } from "@/lib/catalog";

/**
 * La sélection du visiteur — l'état client du panier.
 *
 * ## Ce que ce fichier est, et n'est pas
 *
 * Il retient ce que le visiteur a choisi et l'affiche ; il ne fixe aucun
 * prix. Les montants montrés viennent du catalogue, et le serveur recalcule
 * tout au paiement : ce module pourrait mentir sans conséquence financière.
 *
 * ## Persistance : localStorage, et rien de plus
 *
 * Une sélection à quatre chiffres se construit en plusieurs visites. Elle
 * survit donc au rechargement — mais elle reste sur l'appareil : pas de
 * compte, pas de synchronisation, pas de cookie. Le stockage peut être
 * refusé (navigation privée stricte) : tout accès est enveloppé, et le
 * panier fonctionne alors en mémoire, le temps de la page.
 *
 * ## Les lignes sont validées à la lecture
 *
 * Ce qui sort du stockage est traité comme ce qu'il est : une chaîne écrite
 * par n'importe qui. Identifiants inconnus écartés, quantités bornées par le
 * catalogue — la même méfiance que le serveur, pour la même raison.
 */

const STORAGE_KEY = "atmos:selection";

export type CartLine = { id: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  /** Nombre total d'articles, badge du header. */
  count: number;
  /** Total TTC affiché — le serveur reste seul maître du montant débité. */
  totalEur: number;
  /** Une option est présente sans kit : le volet l'affiche, le CTA se bloque. */
  needsKit: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const lines: CartLine[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const { id, qty } = entry as { id?: unknown; qty?: unknown };
      if (typeof id !== "string") continue;
      const sku = getSku(id);
      if (!sku) continue;
      const n = Number(qty);
      if (!Number.isInteger(n) || n < 1) continue;
      if (lines.some((l) => l.id === id)) continue;
      lines.push({ id, qty: Math.min(n, sku.maxQuantity) });
    }
    return lines;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);

  // Lecture après montage : le rendu serveur ne connaît pas le stockage, et
  // un état initial qui en dépendrait casserait l'hydratation.
  useEffect(() => {
    setLines(readStorage());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* Stockage refusé : la sélection vit en mémoire, c'est déjà bien. */
    }
  }, [lines]);

  const add = useCallback((id: string) => {
    const sku = getSku(id);
    if (!sku) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) =>
          l.id === id ? { ...l, qty: Math.min(l.qty + 1, sku.maxQuantity) } : l,
        );
      }
      return [...prev, { id, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const sku = getSku(id);
    if (!sku) return;
    setLines((prev) =>
      qty < 1
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) =>
            l.id === id ? { ...l, qty: Math.min(qty, sku.maxQuantity) } : l,
          ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const totalEur = lines.reduce(
      (sum, l) => sum + (CATALOG[l.id]?.priceEur ?? 0) * l.qty,
      0,
    );
    const hasKit = lines.some((l) => l.id === KIT_SKU);
    const needsKit =
      !hasKit && lines.some((l) => CATALOG[l.id]?.requiresKit === true);
    return {
      lines,
      count,
      totalEur,
      needsKit,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, open, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart s'utilise sous <CartProvider>.");
  return ctx;
}
