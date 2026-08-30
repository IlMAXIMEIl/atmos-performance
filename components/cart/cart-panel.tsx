"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { WaitlistModal } from "@/components/waitlist-modal";
import { CATALOG, KIT_SKU, addOns, getSku } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import {
  DROP_NAME,
  INSTALLMENTS_NOTE,
  ORDERS_OPEN,
  formatEuros,
} from "@/lib/offering";

/**
 * Le volet de sélection — le « panier » de la maison.
 *
 * ## Pourquoi un volet, et pas une page
 *
 * Sur un catalogue d'une machine et quatre compléments, une page panier
 * ajouterait un aller-retour entre l'envie et le paiement. Le volet glisse
 * par-dessus la page en cours, se règle, et rend la main — le visiteur ne
 * perd jamais l'endroit où il était. C'est le schéma des configurateurs
 * une-machine (vélo, home-trainer), pas celui des boutiques à mille lignes.
 *
 * ## Commandes fermées : le volet dit la vérité
 *
 * Tant qu'`ORDERS_OPEN` vaut `false`, le total s'affiche mais l'action est
 * l'inscription à la liste prioritaire — le même contrat que partout sur le
 * site : aucun bouton ne promet un paiement que le serveur refuserait. La
 * sélection, elle, est conservée sur l'appareil pour le jour de l'ouverture.
 *
 * ## La règle du kit s'affiche, elle ne se contourne pas
 *
 * Une option (oxymètre, monitoring) accompagne un kit — elle pilote un
 * protocole, elle ne vit pas seule. Si la sélection contient une option sans
 * kit, le volet le dit et propose d'ajouter le kit ; le serveur applique la
 * même règle de son côté.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function Stepper({
  id,
  qty,
}: {
  id: string;
  qty: number;
}) {
  const { setQty } = useCart();
  const sku = getSku(id);
  if (!sku) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setQty(id, qty - 1)}
        aria-label={`Retirer un ${sku.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-dim transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Minus className="h-3 w-3" strokeWidth={2} />
      </button>
      <span className="w-7 text-center font-mono text-[0.85rem] text-ink tabular-nums">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty(id, qty + 1)}
        disabled={qty >= sku.maxQuantity}
        aria-label={`Ajouter un ${sku.name}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-dim transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-30"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  );
}

export function CartPanel() {
  const { lines, totalEur, needsKit, open, setOpen, add, remove, clear } =
    useCart();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const close = useCallback(() => setOpen(false), [setOpen]);

  // Échap ferme, et le fond ne défile pas sous le volet ouvert.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = previous;
    };
  }, [open, close]);

  const inCart = new Set(lines.map((l) => l.id));
  const suggestions = addOns().filter((sku) => !inCart.has(sku.id));
  const showKitSuggestion = !inCart.has(KIT_SKU);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="fond"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            aria-hidden
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          />
        )}
        {open && (
          <motion.aside
            key="volet"
            role="dialog"
            aria-modal="true"
            aria-label="Votre sélection"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-y-0 right-0 z-[71] flex w-full flex-col border-l border-line bg-void shadow-[-30px_0_90px_-20px_rgba(0,0,0,0.85)] motion-reduce:transition-none sm:w-[26.5rem]"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.2em] text-dimmer uppercase">
                  {DROP_NAME}
                </p>
                <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">
                  Votre sélection
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer la sélection"
                className="rounded-full border border-line p-2 text-dim transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* Corps défilant */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {lines.length === 0 ? (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-line bg-white/[0.02] px-5 py-6">
                  <ShoppingBag
                    className="h-5 w-5 text-dimmer"
                    strokeWidth={1.6}
                  />
                  <p className="text-[0.95rem] font-light text-dim">
                    Votre sélection est vide. Composez-la ci-dessous — elle
                    reste enregistrée sur cet appareil.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lines.map((line) => {
                    const sku = CATALOG[line.id];
                    if (!sku) return null;
                    return (
                      <li
                        key={line.id}
                        className="rounded-xl border border-line bg-white/[0.02] px-4 py-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.95rem] font-medium text-ink">
                              {sku.name}
                            </p>
                            <p className="mt-0.5 text-[0.78rem] leading-relaxed font-light text-dimmer">
                              {sku.blurb}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.id)}
                            aria-label={`Retirer ${sku.name}`}
                            className="mt-0.5 shrink-0 rounded-full p-1.5 text-dimmer transition-colors hover:text-danger-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Stepper id={line.id} qty={line.qty} />
                          <p className="font-mono text-[0.9rem] text-ink tabular-nums">
                            {formatEuros(sku.priceEur * line.qty)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Règle du kit */}
              {needsKit && (
                <div className="mt-4 rounded-xl border border-line-strong bg-accent/[0.06] px-4 py-3.5">
                  <p className="text-[0.85rem] leading-relaxed font-light text-ink">
                    L&apos;oxymètre et le monitoring accompagnent le kit — ils
                    pilotent un protocole, ils ne s&apos;utilisent pas seuls.
                  </p>
                  <button
                    type="button"
                    onClick={() => add(KIT_SKU)}
                    className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-[0.82rem] font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    {`Ajouter le kit — ${formatEuros(CATALOG[KIT_SKU].priceEur)}`}
                  </button>
                </div>
              )}

              {/* Compléter la sélection */}
              {(showKitSuggestion || suggestions.length > 0) && (
                <div className="mt-7">
                  <p className="font-mono text-[0.62rem] tracking-[0.2em] text-dimmer uppercase">
                    Compléter
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {showKitSuggestion && !needsKit && (
                      <SuggestionRow id={KIT_SKU} />
                    )}
                    {suggestions.map((sku) => (
                      <SuggestionRow key={sku.id} id={sku.id} />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pied : total et action */}
            <div className="border-t border-line px-6 py-5">
              {lines.length > 0 && (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[0.9rem] font-light text-dim">
                      Total TTC, livraison comprise
                    </p>
                    <p className="font-mono text-[1.25rem] font-medium text-ink tabular-nums">
                      {formatEuros(totalEur)}
                    </p>
                  </div>
                  <p className="mt-1 text-[0.75rem] font-light text-dimmer">
                    {INSTALLMENTS_NOTE}.
                  </p>
                </>
              )}

              {ORDERS_OPEN ? (
                <a
                  href="/#offres"
                  onClick={close}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-4 text-sm font-semibold tracking-[0.04em] text-void transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  Passer à la précommande
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setWaitlistOpen(true)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-4 text-sm font-semibold tracking-[0.04em] text-void transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    {`Être averti du ${DROP_NAME}`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-2.5 text-center text-[0.75rem] leading-relaxed font-light text-dimmer">
                    Les commandes ne sont pas encore ouvertes. Votre sélection
                    est conservée sur cet appareil pour l&apos;ouverture.
                  </p>
                </>
              )}

              {lines.length > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="mt-3 w-full text-center text-[0.75rem] font-light text-dimmer transition-colors hover:text-dim focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  Vider la sélection
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
    </>
  );
}

function SuggestionRow({ id }: { id: string }) {
  const { add } = useCart();
  const sku = getSku(id);
  if (!sku) return null;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
      <div>
        <p className="text-[0.88rem] font-light text-ink">{sku.name}</p>
        <p className="font-mono text-[0.78rem] text-dimmer tabular-nums">
          {formatEuros(sku.priceEur)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => add(sku.id)}
        aria-label={`Ajouter ${sku.name} à la sélection`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-dim transition-colors hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </li>
  );
}
