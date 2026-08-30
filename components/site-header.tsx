"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CircleUserRound, Menu, X } from "lucide-react";

import { EASE } from "@/lib/motion";
import { NAV_GROUPS, PRIMARY_LINKS } from "@/lib/navigation";
import { CartButton } from "@/components/cart/cart-button";
import { DROP_NAME, DROP_UNITS, WAITLIST_CTA_SHORT } from "@/lib/offering";

/**
 * En-tête unique du site, volet de navigation compris.
 *
 * Le site compte une soixantaine de pages dont une dizaine sont réellement
 * utiles à un visiteur — elles n'étaient jusqu'ici atteignables que depuis le
 * pied de page. La barre en garde trois en clair et range le reste dans un
 * volet : l'accès est en haut, en un geste, sans charger la barre.
 *
 * Le volet ne dépend pas de la largeur d'écran : c'est le même geste au
 * téléphone et sur grand écran, donc un seul comportement à tenir. Il remplace
 * l'ancien menu dépliant de l'accueil et la barre allégée des pages
 * secondaires, qui divergeaient.
 */
export function SiteHeader({ maxWidth = "max-w-7xl" }: { maxWidth?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);

  // Échappe ferme, et le focus revient sur le bouton : sans ce retour, la
  // tabulation reprendrait au début du document.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={`relative z-40 mx-auto w-full ${maxWidth} px-6 py-6 lg:px-10`}
    >
      <nav className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-mono text-[0.95rem] tracking-[0.28em] text-ink transition-colors hover:text-accent"
        >
          ATMOS
        </Link>

        <div className="flex items-center gap-5 md:gap-8">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="group relative hidden font-mono text-[0.72rem] tracking-[0.16em] text-dim uppercase transition-colors duration-300 hover:text-ink lg:inline-block"
            >
              {link.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}

          <Link
            href="/#offres"
            className="hidden rounded-full border border-line-strong bg-white/[0.04] px-5 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] text-ink uppercase backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.08] sm:inline-block"
          >
            {WAITLIST_CTA_SHORT}
          </Link>

          {/*
            L'accès au compte, toujours visible — pas seulement dans le volet.

            Un seul lien pour les deux états : connecté, `/compte` ouvre le
            tableau de bord ; sinon le middleware renvoie à la connexion. La
            barre n'a ainsi pas besoin de connaître la session, et les pages
            qui la portent restent prérendues.
          */}
          <Link
            href="/compte"
            onClick={close}
            aria-label="Mon espace client"
            title="Mon espace"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-dim transition-colors duration-300 hover:border-line-strong hover:text-ink"
          >
            <CircleUserRound className="h-4 w-4" strokeWidth={1.7} />
          </Link>

          <CartButton />

          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 font-mono text-[0.7rem] tracking-[0.14em] text-dim uppercase transition-colors duration-300 hover:border-line-strong hover:text-ink"
          >
            {open ? (
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
            ) : (
              <Menu className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            <span className="hidden sm:inline">{open ? "Fermer" : "Menu"}</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            {/* Le voile ferme au clic et empêche d'agir sur la page derrière,
                sans bloquer le défilement — verrouiller le corps décale la
                mise en page de la largeur de la barre de défilement. */}
            <motion.button
              type="button"
              tabIndex={-1}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
              className="fixed inset-0 -z-10 cursor-default bg-void/70 backdrop-blur-[2px]"
            />

            <motion.div
              id={panelId}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute inset-x-0 top-full z-40 px-6 lg:px-10"
            >
              <div className="mx-auto max-h-[calc(100svh-10rem)] w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-deep/95 p-7 backdrop-blur-xl sm:p-10">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.title}>
                      <h2 className="font-mono text-[0.66rem] tracking-[0.22em] text-accent uppercase">
                        {group.title}
                      </h2>

                      <ul className="mt-5 flex flex-col gap-4">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={close}
                              className="group block"
                            >
                              <span className="flex items-center gap-1.5 text-[0.95rem] font-medium tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
                                {link.label}
                                <ArrowUpRight
                                  aria-hidden
                                  className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                                  strokeWidth={1.8}
                                />
                              </span>
                              {link.detail && (
                                <span className="mt-0.5 block text-[0.82rem] leading-snug text-dim">
                                  {link.detail}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/*
                  Le compte d'unités, en clair et en bas du volet.

                  Pas de jauge de remplissage : sur un achat à quatre chiffres,
                  un compteur qui monte se lit comme une pression de vente et
                  fait exactement l'inverse de rassurer. Le nombre disponible
                  suffit — il est vrai, il est vérifiable, il n'insiste pas.
                */}
                <div className="mt-9 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[0.7rem] tracking-[0.16em] text-dimmer uppercase">
                    {`${DROP_NAME} · ${DROP_UNITS} unités`}
                  </p>

                  <Link
                    href="/#offres"
                    onClick={close}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    {WAITLIST_CTA_SHORT}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
