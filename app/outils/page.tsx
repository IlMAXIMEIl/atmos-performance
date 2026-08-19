import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mountain, type LucideIcon } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS, TOOLS_PATH } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}${TOOLS_PATH}`;

const TITLE = "Outils et calculateurs d'entraînement en altitude";
const DESCRIPTION =
  "Les calculateurs ATMOS en accès libre : simulateur de protocole d'hypoxie, conversion FiO₂ ↔ altitude simulée et comparatif de coût.";

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

/** Une icône par outil, choisie à l'ajout du calculateur. */
const TOOL_ICONS: Record<string, LucideIcon> = {
  "simulateur-altitude": Mountain,
};

export default function OutilsPage() {
  const jsonLd = [
    breadcrumbSchema([{ name: "Accueil", url: SITE_URL }, { name: "Outils" }]),
    // La page est bien une liste : on la décrit comme telle, dans l'ordre où
    // elle s'affiche.
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "fr-FR",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${PAGE_URL}/${tool.slug}`,
        })),
      },
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <PageHeader maxWidth="max-w-4xl" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24 lg:px-10">
        <Link
          href="/"
          className="group mt-4 inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <span className="mt-10 block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase">
          Les outils
        </span>

        <h1 className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Calculateurs
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            en accès libre.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty">
          {
            "De quoi poser des chiffres sur un protocole d'altitude avant d'investir dans quoi que ce soit. Sans compte, sans email."
          }
        </p>

        <div className="mt-14 flex flex-col gap-4">
          {TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.slug] ?? Mountain;

            return (
              <Link
                key={tool.slug}
                href={`${TOOLS_PATH}/${tool.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 backdrop-blur-xl transition-colors duration-500 hover:border-cyan-300/25 sm:p-9"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.14),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <Icon className="h-4 w-4 text-cyan-300" strokeWidth={1.6} />
                  </span>

                  <h2 className="mt-6 text-xl font-medium tracking-[-0.02em] text-balance text-white transition-colors group-hover:text-cyan-100 sm:text-2xl">
                    {tool.name}
                  </h2>

                  <p className="mt-3.5 max-w-2xl text-[0.92rem] leading-relaxed font-light text-white/50 text-pretty">
                    {tool.tagline}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                    <ul className="flex flex-wrap gap-2">
                      {tool.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] font-light text-white/45"
                        >
                          {highlight}
                        </li>
                      ))}
                    </ul>

                    <span className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-cyan-200/80">
                      Ouvrir l&apos;outil
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-[0.82rem] leading-relaxed font-light text-white/35 text-pretty">
          {
            "D'autres calculateurs viendront compléter cette page. Les résultats qu'ils donnent restent indicatifs : ils ne remplacent ni un oxymètre, ni un avis médical."
          }
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
