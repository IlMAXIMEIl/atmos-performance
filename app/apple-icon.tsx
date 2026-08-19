import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * Icône d'écran d'accueil iOS.
 *
 * Reprend `app/icon.svg` plutôt que de redessiner le Λ : une seule source,
 * donc pas de dérive entre l'onglet et l'écran d'accueil. Les coins arrondis
 * sont remis à plat — iOS applique son propre masque, et un arrondi dans
 * l'arrondi se voit.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "ATMOS";

export default function AppleIcon() {
  const svg = readFileSync(
    path.join(process.cwd(), "app", "icon.svg"),
    "utf8",
  ).replace('rx="24"', 'rx="0"');

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <img
          src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
          alt=""
          width={size.width}
          height={size.height}
        />
      </div>
    ),
    size,
  );
}
