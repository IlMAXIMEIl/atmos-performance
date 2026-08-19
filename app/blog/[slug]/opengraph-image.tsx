import { getAllPosts, getPost } from "@/lib/posts";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/** Une carte par article, prérendue au build comme les articles eux-mêmes. */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const alt = "Article du blog ATMOS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  // Un slug inconnu rend la page 404 ; la carte reste sur le message de
  // marque plutôt que d'échouer au build.
  if (!post) {
    return ogCard({ eyebrow: "Blog", title: "Blog ATMOS" });
  }

  return ogCard({
    eyebrow: "Blog",
    title: post.title,
    footer: `${post.readTime} · ${post.author}`,
  });
}
