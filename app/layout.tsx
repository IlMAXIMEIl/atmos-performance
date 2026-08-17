import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATMOS ONE — Générateur d'altitude hypoxique",
  description:
    "ATMOS ONE simule jusqu'à 6 000 mètres d'altitude chez vous, de 20,9 % à 9,5 % d'oxygène. VO2max, acclimatation, protocoles Live High et Train High. Pré-vente à l'achat ou en leasing.",
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
