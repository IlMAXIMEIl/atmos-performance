import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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
  description:
    "ATMOS ONE simule jusqu'à 6 500 mètres d'altitude chez vous, de 20,9 % à 9 % d'oxygène. VO2max, acclimatation, protocoles Live High et Train High. Pré-vente de la série de lancement.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "ATMOS ONE — Générateur d'altitude hypoxique",
    description:
      "Simulez jusqu'à 6 500 mètres d'altitude chez vous. VO2max, acclimatation, protocoles Live High et Train High.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
