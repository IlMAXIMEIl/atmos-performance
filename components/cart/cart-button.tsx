"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart";

/**
 * Le bouton du header : l'icône de la sélection, et son compte.
 *
 * Le badge n'apparaît qu'à partir du premier article — un zéro permanent
 * serait un rappel de vide. Même géométrie que le bouton de compte voisin,
 * pour que la rangée du header reste une seule famille.
 */
export function CartButton() {
  const { count, setOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={
        count > 0
          ? `Ouvrir la sélection — ${count} article${count > 1 ? "s" : ""}`
          : "Ouvrir la sélection"
      }
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-dim transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.6rem] font-medium text-void tabular-nums"
        >
          {count}
        </span>
      )}
    </button>
  );
}
