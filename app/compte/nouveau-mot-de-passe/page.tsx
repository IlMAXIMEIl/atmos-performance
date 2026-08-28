import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NouveauMotDePasseForm } from "@/app/compte/nouveau-mot-de-passe/form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { espaceClientConfigure } from "@/lib/supabase/env";
import { clientConnecte } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — ATMOS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * L'écran d'après le lien de réinitialisation.
 *
 * On y arrive avec une session déjà ouverte : la route `/compte/confirmation`
 * a échangé le code du lien contre des cookies. Sans session, il n'y a rien
 * à faire ici — le lien a expiré, ou quelqu'un est arrivé par hasard.
 */
export default async function NouveauMotDePassePage() {
  if (!espaceClientConfigure()) redirect("/");
  if (!(await clientConnecte())) redirect("/compte/connexion?lien=expire");

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-6xl" />

      <main className="relative z-10 mx-auto w-full max-w-md px-6 pt-16 pb-24">
        <span className="font-mono block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
          Votre espace
        </span>

        <h1 className="mt-5 text-[1.8rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-3xl">
          Choisissez un nouveau mot de passe.
        </h1>

        <div className="mt-9 rounded-2xl border border-line bg-white/[0.02] p-6 backdrop-blur-xl sm:p-7">
          <NouveauMotDePasseForm />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
