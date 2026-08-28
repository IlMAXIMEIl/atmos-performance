"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Moon } from "lucide-react";

/**
 * Le pont entre le QR du générateur et le suivi des nuits.
 *
 * Un client qui scanne le QR gravé sur son ATMOS ONE arrive ici pour régler
 * sa machine. C'est exactement le moment où il va se coucher : lui proposer
 * de démarrer sa nuit à cet instant précis vaut mieux que n'importe quel
 * rappel envoyé plus tard.
 *
 * ## Pourquoi lire l'URL depuis le navigateur, et pas `searchParams`
 *
 * `useSearchParams` — ou le `searchParams` d'une page — ferait basculer le
 * simulateur en rendu dynamique. C'est la deuxième page du site en trafic de
 * recherche : elle doit rester prérendue. On lit donc l'URL comme un état
 * extérieur à React, le même patron que l'invitation d'achat de
 * `offers-section.tsx`. Côté serveur il n'y a pas d'URL : le rendu initial
 * n'affiche rien, et le bandeau apparaît après l'hydratation, chez les seuls
 * visiteurs venus du générateur.
 */

function souscrire(auChangement: () => void) {
  window.addEventListener("popstate", auChangement);
  return () => window.removeEventListener("popstate", auChangement);
}

function lireSource() {
  return new URLSearchParams(window.location.search).get("utm_source");
}

/** Côté serveur, aucune URL à lire : le bandeau reste absent du HTML. */
function lireRien() {
  return null;
}

export function TrackerInvitation() {
  const source = useSyncExternalStore(souscrire, lireSource, lireRien);

  if (source !== "generateur") return null;

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08]">
            <Moon className="h-4 w-4 text-accent" strokeWidth={1.7} />
          </span>
          <div>
            <p className="text-[0.95rem] font-medium tracking-tight text-ink">
              Vous réglez votre générateur ?
            </p>
            <p className="mt-1 text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
              Enregistrez cette nuit dans votre espace : vos heures
              d&apos;exposition s&apos;accumulent, votre dose avance.
            </p>
          </div>
        </div>

        <Link
          href="/compte"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-[0.85rem] font-semibold tracking-[0.02em] text-void transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Démarrer ma nuit
        </Link>
      </div>
    </aside>
  );
}
