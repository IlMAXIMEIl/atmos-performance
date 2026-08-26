import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Eye } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { formatPostDate, getApercu } from "@/lib/posts";

type Props = { params: Promise<{ jeton: string }> };

/**
 * L'aperçu d'un brouillon, contre jeton.
 *
 * ## Pourquoi cette page vit sur la vitrine, et pas dans Nexus
 *
 * Une relecture juge l'article tel que le monde le verra : la vraie
 * typographie, la vraie largeur de colonne, les liens du glossaire posés
 * par l'auto-liaison. Nexus montre le texte ; cette page montre la page.
 *
 * ## Ce qu'elle refuse de faire
 *
 * Être indexée (`robots: noindex` et l'URL n'apparaît nulle part), être
 * mise en cache (`dynamic`), et confirmer quoi que ce soit : jeton inconnu
 * et jeton expiré rendent le même 404 — un lien périmé ne prouve pas qu'un
 * brouillon existe.
 */

// Un aperçu montre l'état du texte à l'instant où on le regarde.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aperçu",
  robots: { index: false, follow: false },
};

export default async function ApercuPage({ params }: Props) {
  const { jeton } = await params;
  const post = await getApercu(jeton);

  if (!post) notFound();

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-2xl" />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28 lg:px-10">
        {/*
          Le bandeau dit ce que cette page est — et surtout ce qu'elle n'est
          pas. Un relecteur qui partagerait ce lien croyant partager
          l'article doit pouvoir s'en rendre compte d'un coup d'œil.
        */}
        <p className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/[0.07] px-5 py-4 text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
          <Eye className="mt-0.5 h-4 w-4 flex-none text-accent" strokeWidth={1.5} />
          <span>
            <span className="font-normal text-ink">Aperçu de relecture.</span>{" "}
            Cette version n&apos;est pas publiée : le texte peut encore changer,
            le lien expirera de lui-même, et les moteurs de recherche ne voient
            pas cette page.
          </span>
        </p>

        <article className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono rounded-full border border-accent/40 bg-accent/[0.07] px-3 py-1 text-[0.62rem] tracking-[0.16em] text-accent uppercase"
              >
                {tag}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-light text-dimmer">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {post.readTime} de lecture
            </span>
          </div>

          <h1 className="mt-6 text-[1.9rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
            <span className="text-ink">{post.title}</span>
          </h1>

          <time
            dateTime={post.publishedAt}
            className="mt-5 block text-[0.78rem] font-light text-dimmer"
          >
            État du {formatPostDate(post.publishedAt)}
          </time>

          {post.description && (
            <p className="mt-8 border-l-2 border-accent/40 pl-5 text-[1rem] leading-relaxed font-light text-dim text-pretty">
              {post.description}
            </p>
          )}

          <div
            className="article-body mt-12"
            // Contenu de première main : rédigé et relu dans le tableau de
            // bord interne. Aucune saisie de visiteur n'atteint cette page.
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
    </div>
  );
}
