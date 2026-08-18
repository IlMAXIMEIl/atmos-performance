import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { formatPostDate, getAllPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog — Altitude, oxygénation et performance",
  description:
    "Articles de fond sur la récupération athlétique, les protocoles d'altitude et la technologie des générateurs hypoxiques ATMOS ONE.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Blog ATMOS — Altitude, oxygénation et performance",
    description:
      "Articles de fond sur la récupération athlétique, les protocoles d'altitude et la technologie des générateurs hypoxiques.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 py-20 sm:py-28 lg:px-10">
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
          Le blog
        </span>

        <h1 className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Altitude, oxygénation
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            et performance.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty">
          Ce que la physiologie dit de la récupération et de l&apos;entraînement
          en altitude, et comment nos appareils s&apos;y inscrivent.
        </p>

        <div className="mt-16 flex flex-col gap-4">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 backdrop-blur-xl transition-colors duration-500 hover:border-cyan-300/25 sm:p-9"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 text-[0.62rem] font-medium tracking-[0.16em] text-white/45 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-light text-white/30">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {post.readingMinutes} min
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-medium tracking-[-0.02em] text-balance text-white transition-colors group-hover:text-cyan-100 sm:text-2xl">
                  {post.title}
                </h2>

                <p className="mt-3.5 text-[0.92rem] leading-relaxed font-light text-white/50 text-pretty">
                  {post.description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <time
                    dateTime={post.publishedAt}
                    className="text-[0.75rem] font-light text-white/30"
                  >
                    {formatPostDate(post.publishedAt)}
                  </time>
                  <span className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-cyan-200/80">
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
