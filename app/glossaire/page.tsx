import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { getAllGlossaryEntries } from "@/lib/glossary";
import { breadcrumbSchema } from "@/lib/structured-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const GLOSSARY_PATH = "/glossaire";
const PAGE_URL = `${SITE_URL}${GLOSSARY_PATH}`;

const TITLE = "Glossaire de l'hypoxie et de l'entraînement en altitude";
const DESCRIPTION =
  "Les termes techniques de l'entraînement en altitude définis simplement : HIF-1α, SpO₂, VFC, biogenèse mitochondriale, hypoxie normobare.";

/** Nom du recueil, cité par chaque fiche dans son `inDefinedTermSet`. */
export const GLOSSARY_SET_NAME = "Glossaire ATMOS de l'hypoxie";

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

export default function GlossaireIndexPage() {
  const entries = getAllGlossaryEntries();

  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "Glossaire" },
    ]),
    // Le recueil auquel chaque fiche se rattache par `inDefinedTermSet`.
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": PAGE_URL,
      name: GLOSSARY_SET_NAME,
      description: DESCRIPTION,
      url: PAGE_URL,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      hasDefinedTerm: entries.map((entry) => ({
        "@type": "DefinedTerm",
        "@id": `${PAGE_URL}/${entry.slug}`,
        name: entry.term,
        description: entry.definition,
        url: `${PAGE_URL}/${entry.slug}`,
      })),
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

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <span className="mt-10 block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase">
          Le glossaire
        </span>

        <h1 className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Le vocabulaire de
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            l&apos;hypoxie, au clair.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty">
          {
            "Les termes qui reviennent dans la littérature sur l'altitude, définis sans jargon et sans raccourci. Une fiche par notion, à lire en deux minutes."
          }
        </p>

        <div className="mt-16 flex flex-col gap-4">
          {entries.map((entry) => (
            <article key={entry.slug}>
              <Link
                href={`${GLOSSARY_PATH}/${entry.slug}`}
                className="group block rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 backdrop-blur-xl transition-colors duration-500 hover:border-cyan-300/25 sm:p-9"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {entry.category && (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[0.62rem] font-medium tracking-[0.16em] text-white/45 uppercase">
                      {entry.category}
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-xl font-medium tracking-[-0.02em] text-balance text-white transition-colors group-hover:text-cyan-100 sm:text-2xl">
                  {entry.term}
                </h2>

                {entry.aliases.length > 0 && (
                  <p className="mt-2 text-[0.8rem] font-light text-white/35 text-pretty">
                    {entry.aliases.join(" · ")}
                  </p>
                )}

                <p className="mt-3.5 text-[0.92rem] leading-relaxed font-light text-white/50 text-pretty">
                  {entry.definition}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-medium text-cyan-200/80">
                  Lire la fiche
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
