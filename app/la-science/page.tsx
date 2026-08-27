import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { ScienceSection } from "@/components/science-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { WAITLIST_CTA } from "@/lib/offering";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/structured-data";

const PAGE_URL = `${SITE_URL}/la-science`;

const TITLE = "La science de l'hypoxie intermittente";
const DESCRIPTION =
  "Ce que la littérature dit de l'exposition intermittente en hypoxie normobarique : trente ans d'études, la condition préalable du fer, et pourquoi la dose d'altitude se règle individuellement.";

export const metadata: Metadata = {
  title: `${TITLE} — ATMOS`,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: `${TITLE} — ATMOS`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — ATMOS`,
    description: DESCRIPTION,
  },
};

/**
 * La science, sortie de la page d'accueil.
 *
 * Le bloc y occupait l'écran juste avant les questions fréquentes, c'est-à-dire
 * juste avant l'endroit où se lèvent les dernières objections. Le visiteur
 * décidé le traversait sans le lire ; le visiteur hésitant y arrivait fatigué.
 * Il retrouve ici toute sa place, et l'accueil enchaîne la gamme sur la FAQ.
 *
 * Rien n'est perdu au passage : c'est le même composant, la page lui ajoute
 * seulement un titre, un contexte et une sortie.
 */
export default function LaSciencePage() {
  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "La science" },
    ]),
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-void text-ink">
      <JsonLd data={jsonLd} />

      <SiteHeader maxWidth="max-w-5xl" />

      <main className="relative z-20">
        <div className="mx-auto w-full max-w-5xl px-6 pt-8 lg:px-10">
          <Eyebrow>La science</Eyebrow>

          <h1 className="mt-6 text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.03] font-semibold tracking-[-0.035em] text-balance">
            <span className="text-ink">Rien de magique.</span>{" "}
            <span className="text-accent">De la physiologie.</span>
          </h1>

          <p className="mt-7 max-w-2xl leading-[1.7] text-dim text-pretty">
            {
              "L'exposition intermittente en hypoxie normobarique est étudiée depuis les années 1990, du laboratoire au sport de haut niveau. Ce qui suit résume ce que cette littérature établit — et ce qu'elle n'établit pas."
            }
          </p>
        </div>

        <ScienceSection heading={false} />

        <div className="mx-auto w-full max-w-5xl px-6 pb-24 lg:px-10">
          <aside className="rounded-xl border border-accent/40 bg-accent/[0.06] p-8 sm:p-10">
            <Eyebrow as="h2">Passer à la pratique</Eyebrow>

            <p className="mt-5 max-w-2xl text-[1.05rem] leading-[1.6] text-ink text-pretty">
              La théorie ne règle pas un appareil. Le simulateur, si.
            </p>

            <p className="mt-4 max-w-2xl leading-[1.7] text-dim text-pretty">
              {
                "Deux questions — l'utilisation de l'appareil, votre niveau — et vous repartez avec un palier d'altitude, une durée de séance et une fréquence hebdomadaire à confronter à votre oxymètre."
              }
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/outils/simulateur-altitude"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Ouvrir le simulateur
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </Link>

              <Link
                href="/#offres"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line-strong px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                {WAITLIST_CTA}
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
