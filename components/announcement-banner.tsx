import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BATCH_NAME } from "@/lib/offering";

/**
 * Bandeau de teasing, posé au-dessus de la navigation sur toutes les pages.
 *
 * Rendu côté serveur et sans état : pas de bouton de fermeture, donc aucun
 * JavaScript ni hydratation à sa charge. Le bandeau tient dans le flux —
 * il pousse le contenu vers le bas plutôt que de le recouvrir, ce qui évite
 * de masquer le début des pages et tout décalage à l'affichage.
 *
 * Tout est dans un seul flux de texte, sans conteneur `flex` intermédiaire :
 * sur mobile la phrase passe à la ligne, et la flèche doit rester collée au
 * dernier mot plutôt que de se retrouver seule en bout de bandeau.
 */
export function AnnouncementBanner() {
  return (
    <Link
      href="/#offres"
      className="group relative z-40 block border-b border-cyan-300/15 bg-[linear-gradient(90deg,rgba(8,47,73,0.55),rgba(14,116,144,0.35),rgba(8,47,73,0.55))] px-4 py-2 text-center transition-colors duration-300 hover:bg-[linear-gradient(90deg,rgba(8,47,73,0.75),rgba(14,116,144,0.5),rgba(8,47,73,0.75))] focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none focus-visible:ring-inset sm:py-2.5"
    >
      <span className="text-[0.72rem] leading-relaxed text-pretty sm:text-[0.8rem]">
        {/* Point clignotant : signale une annonce en cours, pas une alerte. */}
        <span
          aria-hidden
          className="relative mr-2 inline-flex h-1.5 w-1.5 align-middle"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
        </span>

        <span className="font-medium tracking-[0.01em] text-white/90">
          {`Lancement officiel du ${BATCH_NAME} à venir.`}
        </span>{" "}
        <span className="font-light text-cyan-100/80 underline decoration-cyan-300/40 underline-offset-4 transition-colors duration-300 group-hover:text-cyan-50 group-hover:decoration-cyan-300/80">
          Inscrivez-vous sur la liste d&apos;attente pour un accès prioritaire.
        </span>
        <ArrowRight
          aria-hidden
          className="ml-1.5 inline-block h-3 w-3 align-[-0.1em] text-cyan-200/70 transition-transform duration-300 group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </span>
    </Link>
  );
}
