import { getAllGlossaryEntries, getGlossaryEntry } from "@/lib/glossary";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/** Une carte par fiche, prérendue au build comme les fiches elles-mêmes. */
export function generateStaticParams() {
  return getAllGlossaryEntries().map((entry) => ({ slug: entry.slug }));
}

export const alt = "Définition du glossaire ATMOS de l'hypoxie";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const entry = getGlossaryEntry(slug);

  if (!entry) {
    return ogCard({ eyebrow: "Glossaire", title: "Glossaire ATMOS" });
  }

  return ogCard({
    eyebrow: "Glossaire",
    title: entry.term,
    footer: entry.definition,
  });
}
