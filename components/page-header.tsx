import Link from "next/link";

import { WAITLIST_CTA_SHORT } from "@/lib/offering";

/**
 * En-tête des pages secondaires — outils, glossaire, index.
 *
 * Factorisé au moment de l'ajout du glossaire à la navigation : la même barre
 * était recopiée sur `/outils` et sur la page du simulateur, et une entrée de
 * plus signifiait la modifier partout. La page d'accueil garde la sienne :
 * elle porte des ancres de section et un menu mobile dépliant.
 */

const LINKS = [
  { label: "Simulateur", href: "/outils/simulateur-altitude" },
  { label: "Blog", href: "/blog" },
  { label: "Glossaire", href: "/glossaire" },
  { label: "À propos", href: "/a-propos" },
];

export function PageHeader({ maxWidth = "max-w-4xl" }: { maxWidth?: string }) {
  return (
    <header
      className={`relative z-30 mx-auto w-full ${maxWidth} px-6 py-6 lg:px-10`}
    >
      <nav className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[1.05rem] font-medium tracking-[0.42em] text-white/95 transition-colors hover:text-white"
        >
          ATMOS
        </Link>

        <div className="flex items-center gap-5 md:gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden text-[0.8rem] font-light tracking-[0.16em] text-white/55 uppercase transition-colors hover:text-white md:inline-block"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/#offres"
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[0.78rem] font-medium tracking-[0.14em] text-white/90 uppercase backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white"
          >
            {WAITLIST_CTA_SHORT}
          </Link>
        </div>
      </nav>
    </header>
  );
}
