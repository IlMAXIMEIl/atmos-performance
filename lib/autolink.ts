import type { GlossaryEntry } from "@/lib/glossary";

/**
 * Maillage automatique des articles vers le glossaire.
 *
 * Le Markdown est rendu par `marked`, pas par remark/rehype : il n'y a donc
 * pas d'arbre syntaxique à visiter. On travaille sur le HTML produit, en
 * n'écrivant que dans les segments de texte et jamais à l'intérieur d'une
 * balise — ce qui suppose de traverser le flux plutôt que d'y lâcher un
 * `String.replace`, lequel irait volontiers corrompre un `href`.
 *
 * Deux règles gouvernent le résultat :
 *
 * 1. **Un seul lien par notion et par article**, sur la première occurrence.
 *    Lier les onze « VFC » d'un article n'apporte rien au lecteur et ressemble
 *    à de la sur-optimisation.
 * 2. **Le texte de l'article n'est jamais réécrit.** On enveloppe la forme
 *    exacte rencontrée, casse comprise : « biogenèse » en milieu de phrase ne
 *    doit pas se retrouver capitalisé.
 */

/**
 * Balises dont le contenu ne reçoit aucun lien : un `<a>` imbriqué est du HTML
 * invalide, un titre lié fait tache, et du code doit rester du code.
 */
const SKIP_TAGS = new Set([
  "a",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

/** Indices et exposants Unicode vers leur équivalent ASCII. */
const ASCII_DIGITS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
};

/** « SpO₂ » s'écrit aussi « SpO2 » : les deux doivent être reconnues. */
function toAsciiDigits(value: string) {
  return [...value].map((char) => ASCII_DIGITS[char] ?? char).join("");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type GlossaryLink = {
  slug: string;
  href: string;
  /** Formes de surface reconnues, de la plus longue à la plus courte. */
  patterns: RegExp[];
};

/**
 * Construit la table de correspondance à partir des fiches.
 *
 * Les bornes de mot ne peuvent pas s'écrire `\b` : ni « α » ni « ₂ » ne sont
 * des caractères de mot au sens ASCII, et « HIF-1α » se ferait tronquer. On
 * pose donc explicitement qu'un terme ne doit être ni précédé ni suivi d'une
 * lettre ou d'un chiffre Unicode.
 */
export function buildGlossaryLinks(entries: GlossaryEntry[]): GlossaryLink[] {
  return entries.map((entry) => {
    const surfaces = new Set<string>();

    for (const form of [entry.term, ...entry.aliases]) {
      const trimmed = form.trim();
      if (!trimmed) continue;
      surfaces.add(trimmed);
      surfaces.add(toAsciiDigits(trimmed));
    }

    // La forme la plus longue d'abord : « Hypoxie normobare » doit gagner sur
    // un hypothétique « Hypoxie » qui la masquerait.
    const patterns = [...surfaces]
      .sort((a, b) => b.length - a.length)
      .map(
        (surface) =>
          new RegExp(
            `(?<![\\p{L}\\p{N}])${escapeRegExp(surface)}(?![\\p{L}\\p{N}])`,
            "iu",
          ),
      );

    return { slug: entry.slug, href: `/glossaire/${entry.slug}`, patterns };
  });
}

/** Enveloppe la première occurrence encore disponible dans un segment de texte. */
function linkInText(
  text: string,
  links: GlossaryLink[],
  used: Set<string>,
): string {
  let result = "";
  let rest = text;

  while (rest && used.size < links.length) {
    let best: { index: number; matched: string; link: GlossaryLink } | null =
      null;

    for (const link of links) {
      if (used.has(link.slug)) continue;

      for (const pattern of link.patterns) {
        const match = pattern.exec(rest);
        if (!match) continue;

        // La correspondance la plus à gauche l'emporte ; à égalité, la plus
        // longue, pour ne pas s'arrêter à un préfixe.
        const better =
          !best ||
          match.index < best.index ||
          (match.index === best.index && match[0].length > best.matched.length);

        if (better) best = { index: match.index, matched: match[0], link };
      }
    }

    if (!best) break;

    result += rest.slice(0, best.index);
    result += `<a class="glossary-link" href="${best.link.href}">${best.matched}</a>`;
    used.add(best.link.slug);
    // Le suffixe est sûr : la correspondance ne peut être suivie d'une lettre
    // ni d'un chiffre, la borne gauche du tour suivant reste donc valide.
    rest = rest.slice(best.index + best.matched.length);
  }

  return result + rest;
}

/**
 * Parcourt le HTML rendu et lie les termes du glossaire qu'il rencontre.
 *
 * Le découpage alterne balises et texte ; un compteur de profondeur suit les
 * zones interdites. Les balises sont recopiées telles quelles : le HTML de
 * l'article ressort intact, à l'ajout des ancres près.
 */
export function linkGlossaryTerms(html: string, links: GlossaryLink[]): string {
  if (links.length === 0) return html;

  const used = new Set<string>();
  const out: string[] = [];
  let skipDepth = 0;

  for (const token of html.split(/(<[^>]+>)/)) {
    if (!token) continue;

    if (token.startsWith("<")) {
      const name = /^<\/?([a-zA-Z][a-zA-Z0-9]*)/.exec(token)?.[1]?.toLowerCase();

      if (name && SKIP_TAGS.has(name) && !token.endsWith("/>")) {
        if (token.startsWith("</")) {
          skipDepth = Math.max(0, skipDepth - 1);
        } else {
          skipDepth += 1;
        }
      }

      out.push(token);
      continue;
    }

    out.push(
      skipDepth > 0 || used.size === links.length
        ? token
        : linkInText(token, links, used),
    );
  }

  return out.join("");
}
