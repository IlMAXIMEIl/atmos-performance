import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { renderMarkdown, toStringArray } from "@/lib/markdown";

/**
 * Glossaire technique, lu depuis `content/glossaire/*.md` au moment du build.
 *
 * Même mécanique que le blog, à trois différences près : les fiches ne sont
 * pas datées (une définition n'est pas une actualité), elles se classent par
 * ordre alphabétique, et elles se citent entre elles par `related` — c'est ce
 * maillage qui fait l'intérêt d'un glossaire pour le référencement.
 *
 * Ce module touche au système de fichiers : à n'importer que depuis des
 * composants serveur.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "glossaire");

export type GlossaryEntry = {
  slug: string;
  /** L'entrée telle qu'elle s'affiche : « HIF-1α », « SpO₂ »… */
  term: string;
  /** Une phrase. Sert de meta description et de `DefinedTerm.description`. */
  definition: string;
  /** Synonymes et sigles développés, déclarés en `alternateName`. */
  aliases: string[];
  category?: string;
  /** Slugs d'autres fiches du glossaire. */
  related: string[];
  /** Slugs d'articles du blog qui approfondissent le terme. */
  articles: string[];
  /** Corps de la fiche converti en HTML. */
  html: string;
};

function readEntry(fileName: string): GlossaryEntry {
  const raw = readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const fallbackSlug = fileName.replace(/\.md$/, "");

  const term = typeof data.term === "string" ? data.term.trim() : "";
  const definition =
    typeof data.definition === "string" ? data.definition.trim() : "";

  // Ces deux champs portent tout le poids SEO de la fiche — titre, meta
  // description et `DefinedTerm`. Mieux vaut un build qui casse net qu'une
  // fiche publiée sans définition.
  if (!term) {
    throw new Error(
      `Fiche de glossaire « ${fileName} » : champ \`term\` manquant.`,
    );
  }
  if (!definition) {
    throw new Error(
      `Fiche de glossaire « ${fileName} » : champ \`definition\` manquant.`,
    );
  }

  return {
    slug: typeof data.slug === "string" && data.slug ? data.slug : fallbackSlug,
    term,
    definition,
    aliases: toStringArray(data.aliases),
    category: typeof data.category === "string" ? data.category : undefined,
    related: toStringArray(data.related),
    articles: toStringArray(data.articles),
    html: renderMarkdown(content),
  };
}

/** Fiches classées alphabétiquement, accents ignorés comme il se doit. */
export function getAllGlossaryEntries(): GlossaryEntry[] {
  const files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".md"));
  const entries = files.map(readEntry);

  const slugs = new Set<string>();
  for (const entry of entries) {
    if (slugs.has(entry.slug)) {
      throw new Error(`Deux fiches partagent le slug « ${entry.slug} ».`);
    }
    slugs.add(entry.slug);
  }

  return entries.sort((a, b) => a.term.localeCompare(b.term, "fr"));
}

export function getGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return getAllGlossaryEntries().find((entry) => entry.slug === slug);
}
