import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ConnexionForm } from "@/app/compte/connexion/connexion-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { espaceClientConfigure } from "@/lib/supabase/env";
import { clientConnecte } from "@/lib/supabase/server";

/**
 * L'écran d'entrée de l'espace client.
 *
 * `noindex` : une page de connexion n'a rien à faire dans les résultats de
 * recherche. Elle ne porte aucun contenu utile à un visiteur venu de Google,
 * et son indexation diluerait le maillage de la vitrine.
 */
export const metadata: Metadata = {
  title: "Connexion à votre espace — ATMOS",
  description:
    "Accédez à votre espace ATMOS : suivi de vos nuits d'exposition et de votre protocole.",
  robots: { index: false, follow: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ lien?: string }>;
}) {
  if (!espaceClientConfigure()) redirect("/");

  // Déjà connecté : on ne fait pas repasser par la case connexion.
  if (await clientConnecte()) redirect("/compte");

  const { lien } = await searchParams;

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.13),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-6xl" />

      <main className="relative z-10 mx-auto w-full max-w-md px-6 pt-16 pb-24">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour au site
        </Link>

        <span className="font-mono mt-10 block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
          Votre espace
        </span>

        <h1 className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          <span className="text-ink">Suivez vos nuits,</span>{" "}
          <span className="text-accent">et votre dose.</span>
        </h1>

        <p className="mt-5 text-[0.95rem] leading-relaxed font-light text-dim text-pretty">
          Un bouton le soir, un bouton au réveil. Vos heures d&apos;exposition
          s&apos;accumulent, vos commandes se rattachent, et vous savez où
          vous en êtes de votre protocole.
        </p>

        <div className="mt-10 rounded-2xl border border-line bg-white/[0.02] p-6 backdrop-blur-xl sm:p-7">
          <ConnexionForm lienExpire={lien === "expire"} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
