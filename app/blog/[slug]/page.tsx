import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { formatPostDate, getAllPosts, getPost, POSTS } from "@/lib/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** Prérend les articles au build : leur contenu est statique. */
export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) return { title: "Article introuvable" };

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: SITE_NAME,
      locale: "fr_FR",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) notFound();

  const others = getAllPosts().filter((item) => item.slug !== post.slug);

  // Schema.org Article : donne aux moteurs l'auteur, les dates et le sujet.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "fr-FR",
    keywords: post.tags.join(", "),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <script
        type="application/ld+json"
        // Contenu maîtrisé, sérialisé depuis nos propres données.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 py-20 sm:py-28 lg:px-10">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Tous les articles
        </Link>

        <article className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-300/25 bg-cyan-400/[0.07] px-3 py-1 text-[0.62rem] font-medium tracking-[0.16em] text-cyan-100/90 uppercase"
              >
                {tag}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-light text-white/30">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {post.readingMinutes} min de lecture
            </span>
          </div>

          <h1 className="mt-6 text-[1.9rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
            <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              {post.title}
            </span>
          </h1>

          <time
            dateTime={post.publishedAt}
            className="mt-5 block text-[0.78rem] font-light text-white/35"
          >
            Publié le {formatPostDate(post.publishedAt)}
          </time>

          <p className="mt-8 border-l-2 border-cyan-300/30 pl-5 text-[1rem] leading-relaxed font-light text-white/65 text-pretty">
            {post.description}
          </p>

          <div className="mt-12 flex flex-col gap-6">
            {post.body.map((block, index) => {
              if (block.type === "heading") {
                return (
                  <h2
                    key={index}
                    className="mt-6 text-xl font-medium tracking-[-0.02em] text-balance text-white sm:text-2xl"
                  >
                    {block.text}
                  </h2>
                );
              }

              if (block.type === "list") {
                return (
                  <ul key={index} className="flex flex-col gap-3">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-3.5">
                        <span
                          aria-hidden
                          className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-cyan-300/70"
                        />
                        <span className="text-[0.98rem] leading-relaxed font-light text-white/60 text-pretty">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p
                  key={index}
                  className="text-[0.98rem] leading-[1.75] font-light text-white/60 text-pretty"
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        </article>

        {others.length > 0 && (
          <aside className="mt-20 border-t border-white/[0.07] pt-10">
            <h2 className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              À lire ensuite
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-white/[0.07] px-5 py-4 transition-colors duration-300 hover:border-cyan-300/25"
                >
                  <span className="text-[0.9rem] font-light text-white/70 text-pretty group-hover:text-white">
                    {item.title}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300/60 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
