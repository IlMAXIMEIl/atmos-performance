import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Gauge } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getAllGlossaryEntries,
  getGlossaryEntry,
  type GlossaryEntry,
} from "@/lib/glossary";
import { getPost } from "@/lib/posts";
import { breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const GLOSSARY_PATH = "/glossaire";
const GLOSSARY_URL = `${SITE_URL}${GLOSSARY_PATH}`;
const GLOSSARY_SET_NAME = "Glossaire ATMOS de l'hypoxie";

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
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <PageHeader maxWidth="max-w-2xl" />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28 lg:px-10">
        <Link
          href={GLOSSARY_PATH}
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Tout le glossaire
        </Link>

        <article className="mt-10">
          {entry.category && (
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/[0.07] px-3 py-1 text-[0.62rem] font-medium tracking-[0.16em] text-cyan-100/90 uppercase">
              {entry.category}
            </span>
          )}

          <h1 className="mt-6 text-[1.9rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
            <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              {entry.term}
            </span>
          </h1>

          {entry.aliases.length > 0 && (
            <p className="mt-3 text-[0.85rem] font-light text-white/35 text-pretty">
              Aussi appelé {entry.aliases.join(", ")}
            </p>
          )}

          {/* La définition courte, celle que reprend `DefinedTerm`. */}
          <p className="mt-8 border-l-2 border-cyan-300/30 pl-5 text-[1rem] leading-relaxed font-light text-white/65 text-pretty">
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
        <aside className="relative mt-16 overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-gradient-to-b from-cyan-400/[0.06] to-white/[0.015] p-7 backdrop-blur-xl sm:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]"
          />

          <div className="relative">
            <h2 className="text-lg font-medium tracking-[-0.02em] text-balance text-white sm:text-xl">
              De la théorie au réglage
            </h2>

            <p className="mt-3 max-w-lg text-[0.92rem] leading-relaxed font-light text-white/55 text-pretty">
              {
                "Le simulateur traduit ces notions en paramètres concrets : palier d'altitude, structure de cycles et plage de SpO₂ à tenir. Gratuit, sans inscription."
              }
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`${TOOLS_PATH}/simulateur-altitude`}
                className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-7 py-3.5 text-sm font-semibold tracking-[0.04em] text-[#04070D] shadow-[0_0_36px_-6px_rgba(56,189,248,0.65)] transition-all duration-300 hover:shadow-[0_0_54px_-4px_rgba(56,189,248,0.9)] sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                <span className="relative">Ouvrir le simulateur</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/#produit"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium tracking-[0.04em] text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.07] hover:text-white sm:w-auto"
              >
                <Gauge className="h-4 w-4 text-cyan-300/80" strokeWidth={1.6} />
                Découvrir ATMOS ONE
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Maillage : fiches voisines ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-white/[0.07] pt-10">
            <h2 className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              Notions liées
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`${GLOSSARY_PATH}/${item.slug}`}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-white/[0.07] px-5 py-4 transition-colors duration-300 hover:border-cyan-300/25"
                >
                  <span className="text-[0.9rem] font-light text-white/70 text-pretty group-hover:text-white">
                    {item.term}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300/60 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Maillage : articles de fond ──────────────────────────────── */}
        {articles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              Pour approfondir
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {articles.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-6 rounded-2xl border border-white/[0.07] px-5 py-4 transition-colors duration-300 hover:border-cyan-300/25"
                >
                  <span className="text-[0.9rem] leading-relaxed font-light text-white/70 text-pretty group-hover:text-white">
                    {post.title}
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300/60 transition-transform duration-300 group-hover:translate-x-1" />
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
