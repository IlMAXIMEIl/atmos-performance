import { marked } from "marked";

/**
 * Machinerie Markdown commune au blog et au glossaire.
 *
 * Extrait de `lib/posts.ts` au moment de l'ajout du glossaire : les fiches de
 * définitions sont truffées des mêmes notations (SpO₂, HIF-1α, VO₂ max) et
 * doivent passer par exactement le même nettoyage. Deux implémentations
 * auraient divergé au premier correctif.
 *
 * Ce module lit du texte, pas des fichiers : il reste utilisable partout.
 */

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

/** Convertit un corps Markdown en HTML, notations scientifiques comprises. */
export function renderMarkdown(content: string): string {
  return marked.parse(stripLeadingH1(stripLatex(content)), { async: false });
}

/** Frontmatter tolérant : accepte une liste YAML comme une chaîne à virgules. */
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim());
  }
  return [];
}

/** Date lisible en français, calculée sans dépendre du fuseau du visiteur. */
export function formatFrenchDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${day} ${mois[month - 1]} ${year}`;
}
