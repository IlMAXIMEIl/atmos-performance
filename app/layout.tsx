import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { JsonLd } from "@/components/json-ld";
import { PublicOnly } from "@/components/public-only";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Polices du site, servies depuis notre domaine par `next/font`.
 *
 * `display: "swap"` et la métrique de repli ajustée sont les valeurs par
 * défaut : le texte reste lisible pendant le chargement et la substitution
 * ne décale pas la mise en page (CLS).
 *
 * La chasse fixe était absente jusqu'ici — la variante monospace du gabarit
 * de départ ne servait nulle part et coûtait un préchargement inutile. Elle
 * revient parce que la refonte lui donne un rôle : surtitres, relevés
 * chiffrés et fiches techniques passent tous en `font-mono`. Deux familles,
 * pas une de plus.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Sert de base aux URL relatives des balises OpenGraph.
  metadataBase: new URL(SITE_URL),
  title: "ATMOS ONE — Générateur d'altitude hypoxique",
  /*
    Aucune mention de fractionnement ici.

    Cette phrase annonçait « paiement en 3x ou 4x » : le 4x n'existe pas —
    `INSTALLMENTS_NOTE` ne promet qu'un 3x Klarna — et la mention tombait de
    toute façon au-delà des ~160 caractères que les moteurs affichent. Elle
    n'était donc pas lue, mais elle était indexée : un engagement tarifaire
    invérifiable, sans contrepartie. Ce qui reste tient dans le budget utile
    et ne parle que du produit.
  */
  description:
    "ATMOS ONE simule jusqu'à 6 500 mètres d'altitude chez vous, de 20,9 % à 9 % d'oxygène. VO2max, acclimatation, protocoles Live High et Train High. Édition de lancement en série limitée.",
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

/**
 * Repli sans JavaScript des révélations au défilement (voir `globals.css`).
 * Le `!important` est nécessaire : la règle vit dans le même calque que
 * celle qu'elle annule et arrive avant elle dans le document.
 */
const REVEAL_NOSCRIPT_CSS =
  "[data-reveal]{opacity:1!important}[data-reveal-line]>*{transform:none!important}";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Sans JavaScript, les blocs marqués `data-reveal` resteraient
            invisibles : l'état caché est posé en CSS et c'est GSAP qui le
            lève. On le lève ici aussi, faute d'exécution. */}
        <noscript>
          <style>{REVEAL_NOSCRIPT_CSS}</style>
        </noscript>
        {/* Entités valables pour tout le site : les schémas de page y renvoient
            par `@id` plutôt que de redécrire la marque à chaque fois. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {/* Au-dessus de la navigation, sur toutes les pages publiques : le
            site est en phase de teasing, l'information vaut pour chaque point
            d'entrée — un article de blog en vaut un autre.

            `PublicOnly` l'écarte de `/admin`, où l'on traite des commandes
            déjà payées et où une invitation à rejoindre la liste d'attente
            n'aurait aucun sens. */}
        <PublicOnly>
          <AnnouncementBanner />
        </PublicOnly>
        {children}
      </body>
    </html>
  );
}
