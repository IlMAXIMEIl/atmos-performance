import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Gauge } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getAllGlossaryEntries,
  getGlossaryEntry,
  type GlossaryEntry,
  GLOSSARY_PATH,
  GLOSSARY_SET_NAME,
} from "@/lib/glossary";
import { getPost } from "@/lib/posts";
import { breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const GLOSSARY_URL = `${SITE_URL}${GLOSSARY_PATH}`;

type Props = { params: Promise<{ slug: string }> };

/** Prérend les fiches au build : leur contenu est statique. */
export function generateStaticParams() {
  return getAllGlossaryEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getGlossaryEntry(slug);

  if (!entry) return { title: "Définition introuvable" };

  const url = `${GLOSSARY_URL}/${entry.slug}`;
  const title = `${entry.term} — définition`;

  return {
    title: `${title} | Glossaire ATMOS`,
    description: entry.definition,
    keywords: [entry.term, ...entry.aliases],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: entry.definition,
      siteName: SITE_NAME,
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: entry.definition,
    },
  };
}

/** Fiches voisines citées par le frontmatter, celles qui manquent ignorées. */
function resolveRelated(entry: GlossaryEntry) {
  return entry.related
    .map((slug) => getGlossaryEntry(slug))
    .filter((item) => item !== undefined);
}

export default async function GlossaryTermPage({ params }: Props) {
  const { slug } = await params;
  const entry = getGlossaryEntry(slug);

  if (!entry) notFound();

  const url = `${GLOSSARY_URL}/${entry.slug}`;
  const related = resolveRelated(entry);
  // Renommer un article ne doit pas faire tomber la fiche qui le citait.
  const articles = entry.articles
    .map((articleSlug) => getPost(articleSlug))
    .filter((post) => post !== undefined);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      "@id": url,
      name: entry.term,
      ...(entry.aliases.length > 0 ? { alternateName: entry.aliases } : {}),
      description: entry.definition,
      url,
      inLanguage: "fr-FR",
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        "@id": GLOSSARY_URL,
        name: GLOSSARY_SET_NAME,
        url: GLOSSARY_URL,
      },
    },
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "Glossaire", url: GLOSSARY_URL },
      { name: entry.term },
    ]),
  ];

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-2xl" />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28 lg:px-10">
        <Link
          href={GLOSSARY_PATH}
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Tout le glossaire
        </Link>

        <article className="mt-10">
          {entry.category && (
            <span className="font-mono inline-flex rounded-full border border-accent/40 bg-accent/[0.07] px-3 py-1 text-[0.62rem] tracking-[0.16em] text-accent uppercase">
              {entry.category}
            </span>
          )}

          <h1 className="mt-6 text-[1.9rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
            <span className="text-ink">
              {entry.term}
            </span>
          </h1>

          {entry.aliases.length > 0 && (
            <p className="mt-3 text-[0.85rem] font-light text-dimmer text-pretty">
              Aussi appelé {entry.aliases.join(", ")}
            </p>
          )}

          {/* La définition courte, celle que reprend `DefinedTerm`. */}
          <p className="mt-8 border-l-2 border-accent/40 pl-5 text-[1rem] leading-relaxed font-light text-dim text-pretty">
            {entry.definition}
          </p>

          <div
            className="article-body mt-12"
            // Contenu de première main : nos propres fichiers Markdown,
            // versionnés dans le dépôt.
            dangerouslySetInnerHTML={{ __html: entry.html }}
          />
        </article>

        {/* ── Passage à l'acte ─────────────────────────────────────────── */}
        <aside className="relative mt-16 overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-b from-accent/[0.06] to-white/[0.015] p-7 backdrop-blur-xl sm:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]"
          />

          <div className="relative">
            <h2 className="text-lg font-medium tracking-[-0.02em] text-balance text-ink sm:text-xl">
              De la théorie au réglage
            </h2>

            <p className="mt-3 max-w-lg text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
              {
                "Le simulateur traduit ces notions en paramètres concrets : palier d'altitude, structure de cycles et plage de SpO₂ à tenir. Gratuit, sans inscription."
              }
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`${TOOLS_PATH}/simulateur-altitude`}
                className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-accent px-7 py-3.5 text-sm font-semibold tracking-[0.04em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)] sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                <span className="relative">Ouvrir le simulateur</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/#produit"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] px-7 py-3.5 text-sm font-medium tracking-[0.04em] text-ink backdrop-blur-md transition-all duration-300 hover:border-line-strong hover:bg-white/[0.07] hover:text-ink sm:w-auto"
              >
                <Gauge className="h-4 w-4 text-accent" strokeWidth={1.6} />
                Découvrir ATMOS ONE
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Maillage : fiches voisines ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
              Notions liées
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`${GLOSSARY_PATH}/${item.slug}`}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-line px-5 py-4 transition-colors duration-300 hover:border-accent/40"
                >
                  <span className="text-[0.9rem] font-light text-dim text-pretty group-hover:text-ink">
                    {item.term}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Maillage : articles de fond ──────────────────────────────── */}
        {articles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
              Pour approfondir
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {articles.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-6 rounded-2xl border border-line px-5 py-4 transition-colors duration-300 hover:border-accent/40"
                >
                  <span className="text-[0.9rem] leading-relaxed font-light text-dim text-pretty group-hover:text-ink">
                    {post.title}
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
