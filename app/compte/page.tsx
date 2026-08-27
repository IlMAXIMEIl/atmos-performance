import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, LogOut, Moon } from "lucide-react";

import { seDeconnecter } from "@/app/compte/connexion/actions";
import { Tracker } from "@/app/compte/tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { chargerEspace } from "@/lib/espace-client";
import { dureeHeures, etapesAutour, fio2Pour } from "@/lib/nuit";
import { formatDecimal, formatNumber } from "@/lib/format";
import { espaceClientConfigure } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Mon protocole — ATMOS",
  description: "Votre suivi d'exposition à l'hypoxie.",
  robots: { index: false, follow: false },
};

/**
 * L'espace privé n'est jamais mis en cache.
 *
 * Sans cette ligne, Next pourrait servir à un client le rendu d'un autre :
 * la page est dynamique par nature, et le dire explicitement vaut mieux que
 * de dépendre d'une inférence qui change avec les versions.
 */
export const dynamic = "force-dynamic";

/** Date courte et lisible, en français, sans dépendre d'`Intl` côté client. */
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function dateCourte(iso: string): string {
  const date = new Date(iso);
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}`;
}

export default async function ComptePage() {
  if (!espaceClientConfigure()) redirect("/");

  const espace = await chargerEspace();
  if (!espace) redirect("/compte/connexion");

  const { bloc, progression, nuitEnCours, dernieresNuits, etapes } = espace;
  const objectif = bloc?.objectif_heures ?? 300;
  const heures = progression.heures_cumulees;
  const avancement = Math.min(100, Math.round((heures / objectif) * 1000) / 10);
  const { courante, prochaine } = etapesAutour(etapes, heures);

  const palierPropose = bloc?.altitude_cible_m ?? 2500;

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="font-mono block text-[0.66rem] tracking-[0.26em] text-accent uppercase">
              Mon protocole
            </span>
            <h1 className="mt-3 text-[1.9rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
              {espace.prenom ? `Bonsoir ${espace.prenom}.` : "Votre suivi."}
            </h1>
          </div>

          <form action={seDeconnecter}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-[0.76rem] font-light text-dimmer transition-colors hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
              Se déconnecter
            </button>
          </form>
        </div>

        {/* ── Le tracker, en premier : c'est ce pour quoi on vient ────── */}
        <div className="mt-8">
          <Tracker
            nuitEnCours={nuitEnCours}
            palierPropose={palierPropose}
            fio2Proposee={fio2Pour(palierPropose)}
            aCorriger={espace.nuitADemesure}
          />
        </div>

        {/* ── La dose ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="dose-titre"
          className="mt-6 rounded-3xl border border-line bg-white/[0.02] p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="dose-titre"
              className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase"
            >
              Votre dose
            </h2>
            <span className="text-[0.76rem] font-light text-dimmer tabular-nums">
              {progression.nuits_closes} nuit
              {progression.nuits_closes > 1 ? "s" : ""} enregistrée
              {progression.nuits_closes > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[3rem] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums sm:text-6xl">
              {formatDecimal(heures)}
            </span>
            <span className="text-xl font-light text-dim">h</span>
            <span className="ml-auto text-[0.85rem] font-light text-dim tabular-nums">
              sur {formatNumber(objectif)} h visées
            </span>
          </div>

          <div className="mt-6">
            <div
              className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
              role="progressbar"
              aria-valuenow={avancement}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression de la dose"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${avancement}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[0.68rem] font-light text-dimmer tabular-nums">
              <span>{formatDecimal(avancement)} %</span>
              <span>{formatNumber(objectif)} h</span>
            </div>
          </div>

          {/* L'étape en cours : ce que la littérature décrit à cette dose. */}
          {courante && (
            <div className="mt-7 rounded-2xl border border-accent/30 bg-accent/[0.05] p-5">
              <div className="font-mono text-[0.6rem] tracking-[0.2em] text-accent uppercase">
                Où vous en êtes
              </div>
              <p className="mt-2 text-[1rem] font-medium tracking-tight text-ink">
                {courante.titre}
              </p>
              <p className="mt-2 text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
                {courante.litterature}
              </p>
              {courante.article_slug && (
                <Link
                  href={`/blog/${courante.article_slug}`}
                  className="group mt-3 inline-flex items-center gap-2 text-[0.8rem] font-medium text-accent"
                >
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.6} />
                  Lire ce que dit la littérature
                </Link>
              )}
            </div>
          )}

          {prochaine && (
            <p className="mt-4 text-[0.82rem] font-light text-dimmer text-pretty">
              Prochaine étape à {formatNumber(prochaine.seuil_heures)} h —{" "}
              {prochaine.titre.toLowerCase()}. Encore{" "}
              {formatDecimal(Math.round((prochaine.seuil_heures - heures) * 10) / 10)} h.
            </p>
          )}

          <p className="mt-6 border-t border-line pt-5 text-[0.75rem] leading-relaxed font-light text-dimmer text-pretty">
            Ces repères décrivent ce que la littérature observe en moyenne à
            ces doses d&apos;exposition. Ils ne mesurent pas votre sang et ne
            constituent pas un avis médical : seule une prise de sang mesure
            une masse d&apos;hémoglobine.
          </p>
        </section>

        {/* ── L'historique ────────────────────────────────────────────── */}
        {dernieresNuits.length > 0 && (
          <section
            aria-labelledby="nuits-titre"
            className="mt-6 rounded-3xl border border-line bg-white/[0.02] p-6 sm:p-8"
          >
            <h2
              id="nuits-titre"
              className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase"
            >
              Vos dernières nuits
            </h2>

            <ul className="mt-5 flex flex-col">
              {dernieresNuits.map((nuit) => (
                <li
                  key={nuit.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-3.5 first:border-t-0 first:pt-0"
                >
                  <span className="text-[0.88rem] font-light text-dim">
                    {dateCourte(nuit.debut)}
                  </span>
                  <span className="text-[0.88rem] text-ink tabular-nums">
                    {formatDecimal(dureeHeures(nuit.debut, nuit.fin ?? undefined))} h
                    <span className="ml-3 text-dimmer">
                      {formatNumber(nuit.altitude_m)} m
                    </span>
                    {nuit.spo2_reveil !== null && (
                      <span className="ml-3 text-accent">
                        {nuit.spo2_reveil} %
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {progression.spo2_moyenne !== null && (
              <p className="mt-5 border-t border-line pt-5 text-[0.8rem] font-light text-dimmer">
                SpO₂ moyenne au réveil sur ce bloc :{" "}
                <span className="text-dim tabular-nums">
                  {formatDecimal(progression.spo2_moyenne)} %
                </span>
                {progression.fc_moyenne !== null && (
                  <>
                    {" · FC de repos : "}
                    <span className="text-dim tabular-nums">
                      {formatDecimal(progression.fc_moyenne)} bpm
                    </span>
                  </>
                )}
              </p>
            )}
          </section>
        )}

        {dernieresNuits.length === 0 && !nuitEnCours && (
          <p className="mt-6 flex items-center justify-center gap-2.5 rounded-3xl border border-dashed border-line px-6 py-8 text-center text-[0.85rem] font-light text-dimmer">
            <Moon className="h-4 w-4" strokeWidth={1.6} />
            Votre première nuit apparaîtra ici.
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
