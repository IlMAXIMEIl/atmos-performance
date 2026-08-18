import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Contenu du blog, lu depuis `content/blog/*.md` au moment du build.
 *
 * Pour publier un article : déposer un fichier Markdown dans ce dossier avec
 * un frontmatter. Le nom du fichier fait foi pour l'URL si `slug` est absent.
 *
 * Ce module touche au système de fichiers : il ne doit être importé que depuis
 * des composants serveur (pages, sitemap), jamais depuis un composant client.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** Format ISO `YYYY-MM-DD`. */
  publishedAt: string;
  updatedAt?: string;
  category?: string;
  author: string;
  readTime: string;
  tags: string[];
  /** Corps de l'article converti en HTML. */
  html: string;
};

/**
 * Les rédactions assistées par IA truffent le texte de fragments LaTeX
 * (`$SpO_2$`, `$H^+$`, `$VO_2\\text{ max}$`). Affichés tels quels ils saliraient
 * l'article : on les convertit en indices et exposants Unicode, et on retire
 * la notation autour du reste.
 */
const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆",
  "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ",
  o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶",
  "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "(": "⁽", ")": "⁾",
  i: "ⁱ", n: "ⁿ",
};

/** Rend une suite de caractères en indice/exposant, ou telle quelle si un seul
 *  caractère n'a pas d'équivalent Unicode — mieux vaut « Hb mass » que du
 *  charabia à moitié converti. */
function toScript(text: string, table: Record<string, string>) {
  const converted = [...text].map((char) => table[char.toLowerCase()]);
  return converted.every(Boolean) ? converted.join("") : null;
}

function convertMath(expression: string) {
  let out = expression;
  out = out.replace(/\\text\{([^}]*)\}/g, "$1");
  out = out.replace(/\\,|\\;|\\ /g, " ");

  out = out.replace(/_\{([^}]*)\}|_(\w)/g, (_, braced?: string, single?: string) => {
    const raw = braced ?? single ?? "";
    return toScript(raw, SUBSCRIPTS) ?? ` ${raw}`;
  });
  out = out.replace(/\^\{([^}]*)\}|\^(\S)/g, (_, braced?: string, single?: string) => {
    const raw = braced ?? single ?? "";
    return toScript(raw, SUPERSCRIPTS) ?? raw;
  });

  // Toute commande LaTeX restante est retirée, son contenu conservé.
  out = out.replace(/\\[a-zA-Z]+/g, "");
  return out.replace(/\s+/g, " ").trim();
}

function stripLatex(markdown: string) {
  return markdown.replace(/\$([^$\n]{1,60})\$/g, (_, expression: string) =>
    convertMath(expression),
  );
}

/** Retire le H1 d'ouverture : le titre est déjà rendu par la page. */
function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\s*#\s+.*(\r?\n)+/, "");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim());
  }
  return [];
}

function readPost(fileName: string): Post {
  const raw = readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const fallbackSlug = fileName.replace(/\.md$/, "");

  const title = typeof data.title === "string" ? data.title : fallbackSlug;
  const date = data.date instanceof Date
    ? data.date.toISOString().slice(0, 10)
    : String(data.date ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      `Article « ${fileName} » : champ \`date\` manquant ou invalide (attendu AAAA-MM-JJ).`,
    );
  }

  const body = stripLeadingH1(stripLatex(content));

  return {
    slug: typeof data.slug === "string" && data.slug ? data.slug : fallbackSlug,
    title,
    description: typeof data.description === "string" ? data.description : "",
    publishedAt: date,
    updatedAt: typeof data.updated === "string" ? data.updated : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
    author:
      typeof data.author === "string" ? data.author : "Équipe ATMOS Performance",
    readTime: typeof data.readTime === "string" ? data.readTime : "5 min",
    tags: toStringArray(data.tags),
    html: marked.parse(body, { async: false }),
  };
}

/** Articles du plus récent au plus ancien. */
export function getAllPosts(): Post[] {
  const files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".md"));
  const posts = files.map(readPost);

  const slugs = new Set<string>();
  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new Error(`Deux articles partagent le slug « ${post.slug} ».`);
    }
    slugs.add(post.slug);
  }

  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Date lisible en français, calculée sans dépendre du fuseau du visiteur. */
export function formatPostDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${day} ${mois[month - 1]} ${year}`;
}
