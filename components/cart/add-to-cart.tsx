"use client";

import { Plus } from "lucide-react";

import { getSku } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatEuros } from "@/lib/offering";

/**
 * Le bouton « Ajouter » d'une carte accessoire.
 *
 * Il porte le prix — première apparition d'un tarif sur la page accessoires,
 * et la seule : le montant vient du catalogue, jamais retapé. Un identifiant
 * absent du catalogue ne rend rien : la page peut décrire une pièce avant
 * qu'elle soit vendable, le bouton n'apparaît que lorsqu'elle l'est.
 */
export function AddToCart({ skuId }: { skuId: string }) {
  const { add } = useCart();
  const sku = getSku(skuId);
  if (!sku) return null;

  return (
    <button
      type="button"
      onClick={() => add(sku.id)}
      className="inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[0.88rem] font-medium tracking-[0.02em] text-ink backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <Plus className="h-4 w-4 text-accent" strokeWidth={2} />
      {`Ajouter — ${formatEuros(sku.priceEur)}`}
    </button>
  );
}
