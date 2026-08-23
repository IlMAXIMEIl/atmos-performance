import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/admin/actions";

/**
 * Cadre commun aux pages de l'espace.
 *
 * Volontairement pauvre : une barre, un titre, un contenu. L'en-tête public
 * (`components/site-header.tsx`) n'a rien à faire ici — son volet de
 * navigation, sa bannière d'annonce et ses animations d'entrée servent un
 * visiteur qu'on cherche à convaincre, pas un opérateur qui traite trente
 * commandes.
 *
 * `overflow-x-clip` et non `overflow-hidden` : ce dernier neutralise tout
 * `position: sticky` en dessous, et la barre d'actions en lot du tableau en
 * dépend.
 */
export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-void text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[110rem] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex items-baseline gap-3">
            <Link
              href="/admin"
              className="font-mono text-[0.9rem] tracking-[0.28em] text-ink transition-colors hover:text-accent"
            >
              ATMOS
            </Link>
            <span className="font-mono text-[0.62rem] tracking-[0.18em] text-dimmer uppercase">
              Administration
            </span>
          </div>

          {/* Un formulaire, pas un lien : la déconnexion efface un cookie,
              c'est une écriture. Un `<a href>` serait suivi par n'importe
              quel préchargeur et déconnecterait l'opérateur tout seul. */}
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 font-mono text-[0.66rem] tracking-[0.14em] text-dim uppercase transition-colors duration-300 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              Quitter
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[110rem] px-5 pt-9 pb-24 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] leading-tight font-semibold tracking-[-0.03em] text-ink">
              {title}
            </h1>
            {subtitle && (
              <div className="mt-2 text-[0.88rem] leading-relaxed text-dim">
                {subtitle}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
          )}
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
