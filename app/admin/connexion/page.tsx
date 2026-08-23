import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Eyebrow } from "@/components/ui/eyebrow";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin-session";

/**
 * Le titre d'onglet, hérité de la racine, annonçait « ATMOS ONE —
 * Générateur d'altitude hypoxique » : la page marketing d'accueil. Sur un
 * poste où l'espace reste ouvert toute la journée à côté d'autres onglets du
 * site, l'onglet doit se distinguer d'un coup d'œil.
 *
 * Le blocage de l'indexation, lui, vient de `app/admin/layout.tsx` et couvre
 * déjà tout le segment.
 */
export const metadata: Metadata = { title: "Connexion — Administration" };

/**
 * Porte d'entrée de l'espace.
 *
 * Une session déjà valide n'a rien à faire ici : la laisser voir le
 * formulaire donnerait l'impression d'être déconnecté et pousserait à
 * ressaisir le mot de passe pour rien.
 */
export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");

  const configured = isAdminConfigured();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-clip bg-void px-6 py-16 text-ink">
      {/* Même halo que le pied du hero : l'espace appartient au site. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_-15%,rgba(59,158,255,0.14),transparent_65%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <p className="font-mono text-[0.9rem] tracking-[0.28em] text-ink">
          ATMOS
        </p>

        <Eyebrow className="mt-7">Administration</Eyebrow>

        <h1 className="mt-5 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">Espace</span>{" "}
          <span className="text-accent">commandes.</span>
        </h1>

        {configured ? (
          <>
            <p className="mt-5 text-[0.9rem] leading-relaxed text-dim text-pretty">
              Réservé au traitement des commandes. Le tableau de bord
              financier, c&apos;est Stripe.
            </p>
            <LoginForm />
          </>
        ) : (
          /*
            Configuration absente : la page le dit clairement plutôt que de
            présenter un formulaire qui refusera tout. Le message ne fuite
            rien — il nomme deux variables d'environnement, et un attaquant
            qui atteint cet écran sait déjà qu'il y a une administration.
          */
          <div className="mt-7 rounded-xl border border-warm/30 bg-warm/[0.06] px-5 py-4">
            <p className="text-[0.88rem] leading-relaxed text-warm text-pretty">
              L&apos;administration n&apos;est pas configurée sur ce serveur. Renseignez{" "}
              <code className="font-mono text-[0.8rem]">ADMIN_PASSWORD</code> et{" "}
              <code className="font-mono text-[0.8rem]">
                ADMIN_SESSION_SECRET
              </code>{" "}
              dans les variables d&apos;environnement, puis redémarrez
              l&apos;application. Aucune reconstruction n&apos;est nécessaire.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
