import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { formatPostDate, getAllPosts } from "@/lib/posts";
import { breadcrumbSchema } from "@/lib/structured-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog — Altitude, oxygénation et performance",
  description:
    "Articles de fond sur la récupération athlétique, les protocoles d'altitude et la technologie des générateurs hypoxiques ATMOS ONE.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Blog ATMOS — Altitude, oxygénation et performance",
    description:
      "Articles de fond sur la récupération athlétique, les protocoles d'altitude et la technologie des générateurs hypoxiques.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog ATMOS — Altitude, oxygénation et performance",
    description:
      "Articles de fond sur la récupération athlétique, les protocoles d'altitude et la technologie des générateurs hypoxiques.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Accueil", url: SITE_URL },
          { name: "Blog" },
        ])}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-4xl" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <span className="font-mono mt-10 block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
          Le blog
        </span>

        <h1 className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
          <span className="text-ink">
            Altitude, oxygénation
          </span>{" "}
          <span className="text-accent">
            et performance.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty">
          Ce que la physiologie dit de la récupération et de l&apos;entraînement
          en altitude, et comment nos appareils s&apos;y inscrivent.
        </p>

        <div className="mt-16 flex flex-col gap-4">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-line bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 backdrop-blur-xl transition-colors duration-500 hover:border-accent/40 sm:p-9"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono rounded-full border border-line px-3 py-1 text-[0.62rem] tracking-[0.16em] text-dim uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-light text-dimmer">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-medium tracking-[-0.02em] text-balance text-ink transition-colors group-hover:text-accent sm:text-2xl">
                  {post.title}
                </h2>

                <p className="mt-3.5 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
                  {post.description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <time
                    dateTime={post.publishedAt}
                    className="text-[0.75rem] font-light text-dimmer"
                  >
                    {formatPostDate(post.publishedAt)}
                  </time>
                  <span className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-accent">
                    Lire
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
