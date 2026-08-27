"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Moon, Sunrise, TriangleAlert, X } from "lucide-react";

import {
  annulerNuit,
  cloreNuit,
  demarrerNuit,
  type Resultat,
} from "@/app/compte/actions";
import { DUREE_NUIT_PROPOSEE_H, type Nuit } from "@/lib/nuit";
import { formatDecimal, formatNumber } from "@/lib/format";

/**
 * Les deux boutons, et rien d'autre à l'écran.
 *
 * ## Pensé pour une main, dans le noir
 *
 * Un seul geste possible à la fois : tant qu'aucune nuit n'est ouverte, il
 * n'y a que « Démarrer ma nuit » ; dès qu'elle l'est, il n'y a plus que
 * « Réveil ». Les champs du matin arrivent après, jamais avant — personne ne
 * saisit une SpO₂ à 23 h.
 *
 * ## L'état vrai est en base, pas ici
 *
 * `nuitEnCours` vient du serveur. Le compteur ci-dessous est purement
 * décoratif : il affiche le temps écoulé pour rassurer, mais c'est
 * `now()` de Postgres qui datera la clôture. L'horloge d'un téléphone se
 * règle à la main ; celle du serveur, non.
 */

const ETAT_INITIAL: Resultat = { erreur: null };

const CHAMP =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] text-ink " +
  "placeholder:text-dimmer focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/** Temps écoulé, rafraîchi chaque minute — la seconde n'apporte rien ici. */
function useChrono(depuis: string | null) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!depuis) return;
    const timer = setInterval(() => setMaintenant(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [depuis]);

  if (!depuis) return null;

  const minutes = Math.max(
    0,
    Math.floor((maintenant - new Date(depuis).getTime()) / 60_000),
  );
  return { heures: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Horodatage local au format attendu par un `datetime-local`. */
function pourChampLocal(date: Date): string {
  const decale = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return decale.toISOString().slice(0, 16);
}

export function Tracker({
  nuitEnCours,
  palierPropose,
  fio2Proposee,
  aCorriger,
}: {
  nuitEnCours: Nuit | null;
  palierPropose: number;
  fio2Proposee: number;
  aCorriger: boolean;
}) {
  const [etatDemarrage, demarrer, demarrageEnCours] = useActionState(
    demarrerNuit,
    ETAT_INITIAL,
  );
  const [etatCloture, clore, clotureEnCours] = useActionState(
    cloreNuit,
    ETAT_INITIAL,
  );
  const [palier, setPalier] = useState(palierPropose);
  const chrono = useChrono(nuitEnCours?.debut ?? null);

  // ── Aucune nuit ouverte : le geste du soir ────────────────────────────
  if (!nuitEnCours) {
    return (
      <form
        action={demarrer}
        className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.14),transparent_70%)]"
        />

        <div className="relative">
          <span className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
            Ce soir
          </span>

          <div className="mt-5">
            <label
              htmlFor="altitude_m"
              className="flex items-baseline justify-between gap-3"
            >
              <span className="text-[0.8rem] font-light text-dim">
                Palier de la nuit
              </span>
              <span className="text-2xl font-medium tracking-tight text-ink tabular-nums">
                {formatNumber(palier)}
                <span className="ml-1 text-sm font-light text-dim">m</span>
              </span>
            </label>

            <input
              id="altitude_m"
              name="altitude_m"
              type="range"
              min={0}
              max={4000}
              step={100}
              value={palier}
              onChange={(event) => setPalier(Number(event.target.value))}
              className="mt-4 h-6 w-full cursor-pointer accent-[var(--accent)]"
            />

            <p className="mt-1 text-[0.75rem] font-light text-dimmer tabular-nums">
              {formatDecimal(fio2Proposee)} % d&apos;O₂ au palier proposé ·
              réglez votre générateur avant de vous coucher
            </p>
          </div>

          {etatDemarrage.erreur && (
            <p role="alert" className="mt-4 text-[0.82rem] text-amber-200/90">
              {etatDemarrage.erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={demarrageEnCours}
            className="group mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-accent px-8 py-5 text-base font-semibold tracking-[0.02em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60"
          >
            {demarrageEnCours ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.8} />
            )}
            {demarrageEnCours ? "Enregistrement…" : "Démarrer ma nuit"}
          </button>

          <p className="mt-4 text-center text-[0.75rem] font-light text-dimmer">
            Vous pouvez éteindre votre téléphone : le décompte tourne côté
            serveur.
          </p>
        </div>
      </form>
    );
  }

  // ── Nuit ouverte : le geste du matin ──────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-b from-accent/[0.08] to-white/[0.015] p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.2),transparent_70%)]"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[0.64rem] tracking-[0.24em] text-accent uppercase">
            Nuit en cours
          </span>
          <span className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-[0.7rem] font-light text-dim tabular-nums">
            {formatNumber(nuitEnCours.altitude_m)} m
          </span>
        </div>

        {chrono && (
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-5xl font-medium tracking-[-0.04em] text-ink tabular-nums">
              {chrono.heures}
            </span>
            <span className="text-lg font-light text-dim">h</span>
            <span className="text-3xl font-medium tracking-[-0.03em] text-ink tabular-nums">
              {String(chrono.minutes).padStart(2, "0")}
            </span>
            <span className="text-base font-light text-dim">min</span>
          </div>
        )}

        {aCorriger && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-200"
              strokeWidth={1.7}
            />
            <p className="text-[0.83rem] leading-relaxed font-light text-dim">
              Cette nuit dépasse le plafond de durée : indiquez l&apos;heure
              réelle de votre réveil pour qu&apos;elle rejoigne votre cumul.
            </p>
          </div>
        )}

        <form action={clore} className="mt-7 flex flex-col gap-4">
          {aCorriger && (
            <div>
              <label
                htmlFor="fin_corrigee"
                className="text-[0.78rem] font-light text-dim"
              >
                Heure réelle du réveil
              </label>
              <input
                id="fin_corrigee"
                name="fin_corrigee"
                type="datetime-local"
                required
                defaultValue={pourChampLocal(
                  new Date(
                    new Date(nuitEnCours.debut).getTime() +
                      DUREE_NUIT_PROPOSEE_H * 3_600_000,
                  ),
                )}
                className={`${CHAMP} mt-2`}
              />
            </div>
          )}

          <details className="group rounded-2xl border border-line bg-white/[0.02] px-4 py-3">
            <summary className="cursor-pointer list-none text-[0.83rem] font-light text-dim [&::-webkit-details-marker]:hidden">
              Ajouter mes mesures du réveil
              <span className="ml-2 text-dimmer">— facultatif</span>
            </summary>

            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="spo2_reveil"
                    className="text-[0.75rem] font-light text-dimmer"
                  >
                    SpO₂ au réveil (%)
                  </label>
                  <input
                    id="spo2_reveil"
                    name="spo2_reveil"
                    type="number"
                    inputMode="numeric"
                    min={50}
                    max={100}
                    placeholder="94"
                    className={`${CHAMP} mt-1.5`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="fc_reveil"
                    className="text-[0.75rem] font-light text-dimmer"
                  >
                    FC de repos (bpm)
                  </label>
                  <input
                    id="fc_reveil"
                    name="fc_reveil"
                    type="number"
                    inputMode="numeric"
                    min={25}
                    max={220}
                    placeholder="52"
                    className={`${CHAMP} mt-1.5`}
                  />
                </div>
              </div>

              <fieldset>
                <legend className="text-[0.75rem] font-light text-dimmer">
                  Ressenti au réveil
                </legend>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((note) => (
                    <label
                      key={note}
                      className="flex-1 cursor-pointer rounded-xl border border-line bg-white/[0.02] py-2.5 text-center text-[0.85rem] text-dim transition-colors has-[:checked]:border-accent/50 has-[:checked]:bg-accent/[0.1] has-[:checked]:text-accent"
                    >
                      <input
                        type="radio"
                        name="ressenti"
                        value={note}
                        className="sr-only"
                      />
                      {note}
                    </label>
                  ))}
                </div>
              </fieldset>

              <p className="text-[0.72rem] leading-relaxed font-light text-dimmer">
                Ces mesures sont des données de santé. Elles restent les
                vôtres : consultables, modifiables et supprimables à tout
                moment, et jamais transmises à un tiers.
              </p>
            </div>
          </details>

          {etatCloture.erreur && (
            <p role="alert" className="text-[0.82rem] text-amber-200/90">
              {etatCloture.erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={clotureEnCours}
            className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-accent px-8 py-5 text-base font-semibold tracking-[0.02em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60"
          >
            {clotureEnCours ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sunrise className="h-5 w-5" strokeWidth={1.8} />
            )}
            {clotureEnCours ? "Enregistrement…" : "Réveil"}
          </button>
        </form>

        <form action={annulerNuit} className="mt-4">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 text-[0.76rem] font-light text-dimmer transition-colors hover:text-ink"
          >
            <X className="h-3 w-3" strokeWidth={1.8} />
            Annuler cette nuit
          </button>
        </form>
      </div>
    </div>
  );
}
