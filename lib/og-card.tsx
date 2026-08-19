import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site";

/**
 * Carte de partage social, commune à toutes les pages.
 *
 * Un seul gabarit ici plutôt qu'un par segment : l'accueil, les articles et
 * les fiches du glossaire partagent la même image de marque, seul le texte
 * change. Les pages déclarent le fichier `opengraph-image` que Next attend et
 * délèguent le rendu à cette fonction.
 *
 * Contraintes de Satori, le moteur derrière `ImageResponse` : pas de classes
 * Tailwind, tout est en style en ligne, et tout élément à plusieurs enfants
 * doit porter un `display` explicite.
 */

/** Format attendu par Facebook, LinkedIn et la carte Twitter `summary_large_image`. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const CYAN = "#67e8f9";

/**
 * Coupe au dernier mot entier avant la limite.
 *
 * Une carte ne défile pas : un texte trop long déborderait du cadre, et
 * `overflow: hidden` trancherait au milieu d'une ligne. Mieux vaut couper
 * nous-mêmes, proprement, et le signaler par une ellipse.
 */
function clamp(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

type Card = {
  /** Surtitre en capitales : la rubrique dont relève la page. */
  eyebrow: string;
  title: string;
  /** Ligne de pied, en retrait : précision, date ou résumé court. */
  footer?: string;
};

/** Limites tenant dans le cadre au corps de texte retenu plus bas. */
const MAX_TITLE = 120;
const MAX_FOOTER = 150;

export function ogCard({ eyebrow, title, footer }: Card) {
  const headline = clamp(title, MAX_TITLE);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0b0c10",
          // Le halo cyan du site, repris pour que la carte partagée soit
          // reconnaissable à côté du site lui-même.
          backgroundImage:
            "radial-gradient(1000px 620px at 50% -20%, rgba(56,189,248,0.28), rgba(11,12,16,0) 70%)",
        }}
      >
        {/* Bandeau : marque + rubrique */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 30,
              letterSpacing: 14,
              color: "#ffffff",
            }}
          >
            {SITE_NAME.split(" ")[0]}
          </div>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: CYAN,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Titre de la page */}
        <div
          style={{
            display: "flex",
            fontSize: headline.length > 70 ? 58 : 72,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            color: "#ffffff",
            maxHeight: 300,
            overflow: "hidden",
          }}
        >
          {headline}
        </div>

        {/* Pied : filet cyan puis précision */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              width: 120,
              height: 4,
              backgroundColor: CYAN,
              marginBottom: 24,
            }}
          />
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>
            {footer
              ? clamp(footer, MAX_FOOTER)
              : "Générateur d'hypoxie normobare — jusqu'à 6 500 m"}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
