import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Police unique du site, servie depuis notre domaine par `next/font`.
 *
 * `display: "swap"` et la métrique de repli ajustée sont les valeurs par
 * défaut : le texte reste lisible pendant le chargement et la substitution
 * ne décale pas la mise en page (CLS). Une seule famille est chargée — la
 * variante monospace du gabarit de départ ne servait nulle part et coûtait
 * un préchargement de police sur chaque page.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Sert de base aux URL relatives des balises OpenGraph.
  metadataBase: new URL(SITE_URL),
  title: "ATMOS ONE — Générateur d'altitude hypoxique",
  description:
    "ATMOS ONE simule jusqu'à 6 500 mètres d'altitude chez vous, de 20,9 % à 9 % d'oxygène. VO2max, acclimatation, protocoles Live High et Train High. Édition de lancement en série limitée, paiement en 3x ou 4x.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "ATMOS ONE — Générateur d'altitude hypoxique",
    description:
      "Simulez jusqu'à 6 500 mètres d'altitude chez vous. VO2max, acclimatation, protocoles Live High et Train High.",
  },
  /**
   * Carte Twitter par défaut. Les pages qui déclarent leur propre bloc
   * `twitter` le remplacent ; celles qui n'en déclarent pas héritent de
   * celui-ci. L'image, elle, vient du fichier `opengraph-image` du segment.
   */
  twitter: {
    card: "summary_large_image",
    title: "ATMOS ONE — Générateur d'altitude hypoxique",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Entités valables pour tout le site : les schémas de page y renvoient
            par `@id` plutôt que de redécrire la marque à chaque fois. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {/* Au-dessus de la navigation, sur toutes les pages : le site est en
            phase de teasing, l'information vaut pour chaque point d'entrée —
            un article de blog en vaut un autre. */}
        <AnnouncementBanner />
        {children}
      </body>
    </html>
  );
}
