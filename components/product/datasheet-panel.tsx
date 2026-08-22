import { ChevronDown } from "lucide-react";

import { DATASHEET } from "@/lib/product";

/**
 * Fiche technique, en volet dépliant.
 *
 * `<details>` natif plutôt qu'un état React : aucun script à hydrater, le
 * contenu reste dans le DOM — donc indexé — et le volet fonctionne même si le
 * JavaScript échoue.
 *
 * Repliée par défaut : elle rassure l'acheteur technique mais ne vend rien,
 * et déployée elle coûte un écran entier de défilement entre le produit et
 * les offres. L'intitulé est en accent, à l'inverse des autres surtitres de
 * la page qui restent discrets — il faut qu'on voie qu'il y a quelque chose
 * à ouvrir.
 */
export function DatasheetPanel() {
  return (
    <section
      aria-label="Fiche technique du générateur ATMOS ONE"
      className="relative z-20 mx-auto w-full max-w-[1240px] px-6 pb-24 lg:px-10"
    >
      <details className="group border-t border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 transition-colors [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3 font-mono text-[0.78rem] tracking-[0.24em] text-accent uppercase">
            <span className="h-px w-6 flex-none bg-accent" />
            Fiche technique
          </span>

          <span className="flex shrink-0 items-center gap-2.5 font-mono text-[0.7rem] tracking-[0.14em] text-dimmer uppercase transition-colors group-hover:text-accent">
            <span className="group-open:hidden">Déplier</span>
            <span className="hidden group-open:inline">Replier</span>
            {/*
              Une icône qui pivote plutôt que deux : la rotation est portée
              par un conteneur `<span>`, car `group-open:rotate-180` ne
              produit aucune règle applicable sur le SVG lui-même dans cette
              version de Tailwind.
            */}
            <span className="inline-flex transition-transform duration-300 group-open:rotate-180">
              <ChevronDown className="h-4 w-4" strokeWidth={1.6} />
            </span>
          </span>
        </summary>

        <dl className="grid gap-x-16 pb-8 sm:grid-cols-2">
          {DATASHEET.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6 border-t border-line py-3.5 font-mono"
            >
              <dt className="shrink-0 text-[0.7rem] tracking-[0.12em] text-dim uppercase">
                {row.label}
              </dt>
              <dd className="text-right text-[0.84rem] tabular-nums text-ink text-pretty">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
