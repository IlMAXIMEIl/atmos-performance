"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Brain,
  CalendarDays,
  Check,
  Flame,
  Gauge,
  HeartPulse,
  Leaf,
  Moon,
  Mountain,
  Plane,
  Repeat,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Target,
  Timer,
  TrendingUp,
  TriangleAlert,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  ATMOS_PRICE,
  CAMP,
  GOALS,
  LEVELS,
  MAX_ALTITUDE,
  MIN_FIO2,
  PROFILES,
  SEA_LEVEL_FIO2,
  altitudeForFio2,
  buildProtocol,
  estimateSavings,
  fio2AtAltitude,
  formatDecimal,
  formatDuration,
  formatNumber,
  landmarkFor,
  type GoalId,
  type LevelId,
  type ProfileId,
} from "@/lib/altitude";
import { EASE, container, rise } from "@/lib/motion";
import { WAITLIST_CTA } from "@/lib/offering";

const PROFILE_ICONS: Record<ProfileId, LucideIcon> = {
  endurance: Bike,
  biohacking: Brain,
  reeducation: Stethoscope,
  sante: HeartPulse,
};

const GOAL_ICONS: Record<GoalId, LucideIcon> = {
  vo2max: TrendingUp,
  affutage: Target,
  recuperation: ShieldCheck,
  stress: Moon,
};

const LEVEL_ICONS: Record<LevelId, LucideIcon> = {
  debutant: Leaf,
  intermediaire: Gauge,
  confirme: Flame,
};

/**
 * Configuration de départ.
 *
 * Le simulateur s'ouvre déjà rempli plutôt que sur trois questions vides : la
 * fiche de protocole est ainsi présente dès le rendu serveur — donc indexable —
 * et le visiteur n'a qu'à corriger ce qui ne lui correspond pas.
 */
const DEFAULTS = {
  profile: "endurance" as ProfileId,
  goal: "vo2max" as GoalId,
  level: "intermediaire" as LevelId,
  altitude: 3500,
};

/** Paliers de référence proposés sous le convertisseur. */
const PRESETS = [
  { label: "Font-Romeu", metres: 1850 },
  { label: "Sierra Nevada", metres: 2320 },
  { label: "Aiguille du Midi", metres: 3842 },
  { label: "Mont Blanc", metres: 4808 },
  { label: "Camp de base Everest", metres: 5364 },
];

/** Piste du curseur : un rail neutre, rempli jusqu'à la valeur courante. */
const SLIDER_CLASS =
  "relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none " +
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-line-strong [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-white [&::-webkit-slider-thumb]:to-accent [&::-webkit-slider-thumb]:shadow-[0_0_18px_-2px_var(--accent)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 " +
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent " +
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-[0_0_18px_-2px_rgba(56,189,248,0.9)] " +
  "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-accent";

/** Arrondi au dixième : une largeur en pourcentage doit rester déterministe. */
function percent(value: number, min: number, max: number) {
  return Math.round(((value - min) / (max - min)) * 1000) / 10;
}

type StepProps = {
  index: number;
  title: string;
  question: string;
  children: React.ReactNode;
};

function Step({ index, title, question, children }: StepProps) {
  return (
    <motion.section variants={rise} aria-labelledby={`etape-${index}`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/[0.07] text-[0.72rem] font-medium text-accent">
          {index}
        </span>
        <h3
          id={`etape-${index}`}
          className="font-mono text-[0.66rem] tracking-[0.24em] text-dim uppercase"
        >
          {title}
        </h3>
        <p className="text-[0.9rem] font-light text-dim">{question}</p>
      </div>

      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

type OptionProps = {
  icon: LucideIcon;
  label: string;
  detail: string;
  selected: boolean;
  onSelect: () => void;
};

function Option({
  icon: Icon,
  label,
  detail,
  selected,
  onSelect,
}: OptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
        selected
          ? "border-accent/40 bg-accent/[0.07] shadow-[0_0_32px_-12px_rgba(56,189,248,0.7)]"
          : "border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.04]"
      }`}
    >
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.22),transparent_70%)]"
        />
      )}

      <span className="relative flex items-start justify-between gap-3">
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
            selected
              ? "text-accent"
              : "text-dimmer group-hover:text-dim"
          }`}
          strokeWidth={1.6}
        />
        <span
          aria-hidden
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            selected
              ? "border-accent/40 bg-accent/20"
              : "border-line-strong group-hover:border-line-strong"
          }`}
        >
          {selected && (
            <Check className="h-2.5 w-2.5 text-accent" strokeWidth={3} />
          )}
        </span>
      </span>

      <span
        className={`relative mt-4 block text-[0.92rem] font-medium tracking-tight text-balance transition-colors duration-300 ${
          selected ? "text-ink" : "text-ink"
        }`}
      >
        {label}
      </span>

      <span className="relative mt-1.5 block text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
        {detail}
      </span>
    </button>
  );
}

/** Une ligne de la fiche récapitulative. */
function Spec({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-4 border-t border-line py-5 first:border-t-0 first:pt-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03]">
        <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <div className="text-[0.66rem] font-medium tracking-[0.2em] text-dimmer uppercase">
          {label}
        </div>
        <div className="mt-1.5 text-[0.98rem] font-medium tracking-tight text-ink text-pretty">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-[0.8rem] leading-relaxed font-light text-dimmer text-pretty">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

export function AltitudeSimulator() {
  const [profile, setProfile] = useState<ProfileId>(DEFAULTS.profile);
  const [goal, setGoal] = useState<GoalId>(DEFAULTS.goal);
  const [level, setLevel] = useState<LevelId>(DEFAULTS.level);

  // Le convertisseur garde ses deux valeurs en état plutôt que d'en dériver
  // une de l'autre : la FiO₂ étant affichée au dixième, un aller-retour ferait
  // sauter la poignée du curseur d'où l'utilisateur vient de la lâcher.
  const [altitude, setAltitude] = useState(DEFAULTS.altitude);
  const [fio2, setFio2] = useState(() => fio2AtAltitude(DEFAULTS.altitude));

  const protocol = useMemo(
    () => buildProtocol(profile, goal, level),
    [profile, goal, level],
  );
  const savings = useMemo(() => estimateSavings(protocol), [protocol]);

  const profileLabel = PROFILES.find((item) => item.id === profile)!.label;
  const goalLabel = GOALS.find((item) => item.id === goal)!.label;
  const levelLabel = LEVELS.find((item) => item.id === level)!.label;

  const isDefault =
    profile === DEFAULTS.profile &&
    goal === DEFAULTS.goal &&
    level === DEFAULTS.level;

  function pickAltitude(metres: number) {
    setAltitude(metres);
    setFio2(fio2AtAltitude(metres));
  }

  function pickFio2(value: number) {
    setFio2(value);
    setAltitude(altitudeForFio2(value));
  }

  function reset() {
    setProfile(DEFAULTS.profile);
    setGoal(DEFAULTS.goal);
    setLevel(DEFAULTS.level);
  }

  // Le CTA emporte la configuration : la liste prioritaire — ou le tunnel de
  // commande une fois ouvert — s'ouvre directement, et les paramètres restent
  // lisibles dans l'URL côté acquisition.
  const reservationHref =
    `/?reserver=achat&profil=${profile}&objectif=${goal}` +
    `&niveau=${level}&palier=${protocol.targetAltitudeMeters}#offres`;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Le configurateur ─────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-6 backdrop-blur-xl sm:p-9"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
        />

        <div className="relative flex flex-col gap-10">
          <motion.div
            variants={rise}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {[profileLabel, goalLabel, levelLabel].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[0.7rem] font-light text-dim"
                >
                  {chip}
                </span>
              ))}
            </div>

            {!isDefault && (
              <button
                type="button"
                onClick={reset}
                className="group inline-flex items-center gap-2 text-[0.75rem] font-light text-dimmer transition-colors hover:text-ink"
              >
                <RotateCcw
                  className="h-3 w-3 transition-transform duration-500 group-hover:-rotate-180"
                  strokeWidth={1.6}
                />
                Réinitialiser
              </button>
            )}
          </motion.div>

          <Step index={1} title="Le profil" question="Qui va s'exposer ?">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PROFILES.map((item) => (
                <Option
                  key={item.id}
                  icon={PROFILE_ICONS[item.id]}
                  label={item.label}
                  detail={item.detail}
                  selected={profile === item.id}
                  onSelect={() => setProfile(item.id)}
                />
              ))}
            </div>
          </Step>

          <Step
            index={2}
            title="L'objectif"
            question="Que cherchez-vous à obtenir ?"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GOALS.map((item) => (
                <Option
                  key={item.id}
                  icon={GOAL_ICONS[item.id]}
                  label={item.label}
                  detail={item.detail}
                  selected={goal === item.id}
                  onSelect={() => setGoal(item.id)}
                />
              ))}
            </div>
          </Step>

          <Step
            index={3}
            title="Le niveau d'exposition"
            question="Où en êtes-vous avec l'hypoxie ?"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEVELS.map((item) => (
                <Option
                  key={item.id}
                  icon={LEVEL_ICONS[item.id]}
                  label={item.label}
                  detail={item.detail}
                  selected={level === item.id}
                  onSelect={() => setLevel(item.id)}
                />
              ))}
            </div>
          </Step>
        </div>
      </motion.div>

      {/* ── La fiche de protocole ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: EASE }}
        aria-live="polite"
        className="relative overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-b from-accent/[0.06] to-white/[0.015] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
        />

        <div className="relative p-6 sm:p-9 lg:p-11">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[0.66rem] tracking-[0.24em] text-accent uppercase">
              Votre protocole recommandé
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/[0.07] px-3.5 py-1 text-[0.68rem] font-medium tracking-[0.08em] text-accent">
              {protocol.protocolTitle}
            </span>
          </div>

          <div className="mt-9 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* Palier de croisière */}
            <div>
              <div className="text-[0.66rem] font-medium tracking-[0.2em] text-dimmer uppercase">
                Altitude simulée optimale
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="text-[3.4rem] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums sm:text-7xl">
                  {formatNumber(protocol.targetAltitudeMeters)}
                </span>
                <span className="text-2xl font-light text-dim">m</span>

                <span className="ml-auto rounded-xl border border-line bg-white/[0.03] px-4 py-2 text-center">
                  <span className="font-mono block text-[0.6rem] tracking-[0.16em] text-dimmer uppercase">
                    FiO₂
                  </span>
                  <span className="mt-0.5 block text-xl font-medium tracking-tight text-accent tabular-nums">
                    {formatDecimal(protocol.fio2EquivalentPercent)} %
                  </span>
                </span>
              </div>

              <p className="mt-4 text-[0.85rem] font-light text-dim">
                {landmarkFor(protocol.targetAltitudeMeters)}
              </p>

              {/* Situation du palier sur la course de l'appareil */}
              <div className="mt-9" aria-hidden>
                <div className="relative h-1.5 w-full rounded-full bg-white/[0.08]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent"
                    style={{
                      width: `${percent(protocol.targetAltitudeMeters, 0, MAX_ALTITUDE)}%`,
                    }}
                  />
                  <span
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white shadow-[0_0_14px_-1px_rgba(56,189,248,0.9)]"
                    style={{
                      left: `${percent(protocol.targetAltitudeMeters, 0, MAX_ALTITUDE)}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[0.65rem] font-light tracking-[0.1em] text-dimmer uppercase">
                  <span>Niveau de la mer</span>
                  <span>
                    {formatNumber(MAX_ALTITUDE)} m · plafond ATMOS ONE
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-5">
                <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                  <TrendingUp
                    className="h-3.5 w-3.5 text-accent"
                    strokeWidth={1.6}
                  />
                  Montée en charge
                </div>
                <ol className="mt-4 flex flex-col gap-3">
                  {protocol.acclimatizationProtocol.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-[0.1rem] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/[0.07] text-[0.6rem] font-medium text-accent tabular-nums"
                      >
                        {index + 1}
                      </span>
                      <span className="text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Structure de la séance */}
            <div className="lg:border-l lg:border-line lg:pl-14">
              <Spec
                icon={Repeat}
                label="Format de cycle"
                value={`${protocol.hypoxiaMinutes} min hypoxie / ${protocol.normoxiaMinutes} min air libre`}
                hint={`${protocol.cycles} cycles enchaînés par séance.`}
              />
              <Spec
                icon={Timer}
                label="Durée totale de séance"
                value={formatDuration(protocol.sessionMinutes)}
                hint={protocol.modality}
              />
              <Spec
                icon={CalendarDays}
                label="Fréquence"
                value={protocol.weeklyDose.frequency}
                hint={`Soit ${savings.sessions} séances sur l'ensemble du cycle.`}
              />
              <Spec
                icon={Mountain}
                label="Durée du cycle"
                value={`${protocol.weeklyDose.totalWeeksRecommended} semaines`}
                hint="Puis 2 à 3 semaines sans exposition avant de relancer un bloc."
              />
              {protocol.sleepAltitudeMeters > 0 &&
                protocol.sleepFio2Percent !== null && (
                  <>
                    <Spec
                      icon={Moon}
                      label="Dose nocturne"
                      value={`${protocol.sleepHoursPerDay} à ${protocol.sleepHoursPerDay + 2} h par nuit`}
                      hint={`Le palier de sommeil est le chiffre de tête de cette fiche : c'est lui qui définit le protocole. Plafond de verre à 2 600 m, figé — aucun bonus de niveau ne le franchit.`}
                    />
                    <Spec
                      icon={Bike}
                      label="Palier des séances IHT"
                      value={`${formatNumber(protocol.sessionAltitudeMeters)} m · ${formatDecimal(protocol.sessionFio2Percent)} % d'O₂`}
                      hint="Sous masque, à l'effort sous-maximal. Plus haut que le sommeil, et c'est normal : l'exposition y dure quelques dizaines de minutes, pas douze heures."
                    />
                  </>
                )}
              <Spec
                icon={HeartPulse}
                label="Plage SpO₂ cible"
                value={protocol.targetSpo2Range}
                hint="Mesurée au doigt pendant la phase hypoxique. C'est elle qui commande le réglage, pas l'inverse : si la saturation descend sous la plage, remontez la FiO₂."
              />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
              <Wind
                className="h-3.5 w-3.5 text-accent"
                strokeWidth={1.6}
              />
              Pourquoi ce protocole
            </div>
            <p className="mt-3 text-[0.88rem] leading-relaxed font-light text-dim text-pretty">
              {protocol.physiologicalRationale}
            </p>
          </div>

          {/* ── Consignes de sécurité ────────────────────────────────── */}
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5 sm:p-6">
            <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-amber-200/80 uppercase">
              <TriangleAlert className="h-3.5 w-3.5" strokeWidth={1.7} />
              Consignes de sécurité
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                protocol.clinicalSafetyNotes,
                "Séance systématiquement suivie à l'oxymètre de pouls, au doigt, pendant toute la phase hypoxique.",
                protocol.exposure === "repos"
                  ? "Sous 75 % de SpO₂, on interrompt : retour à l'air ambiant, on ne « tient » pas une saturation basse. Ce plancher plus bas ne vaut qu'au repos strict, immobile."
                  : "Sous 80 % de SpO₂, on interrompt : retour à l'air ambiant, on ne « tient » pas une saturation basse.",
                "Vertiges, céphalée, nausée ou confusion : arrêt immédiat, quelle que soit la valeur affichée.",
                "Jamais de première séance seul, ni de séance en hypoxie pendant le sommeil sans supervision préalable.",
                "Grossesse, pathologie cardiaque ou respiratoire, anémie, hypertension non contrôlée : avis médical avant toute exposition.",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-amber-200/70"
                  />
                  <span className="text-[0.86rem] leading-relaxed font-light text-dim text-pretty">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
            {protocol.disclaimerLegal}
          </p>

          {/* ── Passage à l'acte ─────────────────────────────────────── */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href={reservationHref}
              className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold tracking-[0.04em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
              <span className="relative">{WAITLIST_CTA}</span>
              <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/#produit"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] px-8 py-4 text-sm font-medium tracking-[0.04em] text-ink backdrop-blur-md transition-all duration-300 hover:border-line-strong hover:bg-white/[0.07] hover:text-ink sm:w-auto"
            >
              <Gauge className="h-4 w-4 text-accent" strokeWidth={1.6} />
              Découvrir le générateur
            </Link>
          </div>

          <p className="mt-5 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
            {`Votre configuration — ${profileLabel.toLowerCase()}, ${goalLabel.toLowerCase()}, ${levelLabel.toLowerCase()} — est transmise avec votre précommande. Paiement en 3x ou 4x disponible.`}
          </p>
        </div>
      </motion.div>

      {/* ── Convertisseur FiO₂ ↔ altitude ────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        aria-labelledby="convertisseur-titre"
        id="convertisseur"
        className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl scroll-mt-24 sm:p-9 lg:p-11"
      >
        <span className="font-mono text-[0.66rem] tracking-[0.24em] text-accent uppercase">
          Convertisseur
        </span>

        <h2
          id="convertisseur-titre"
          className="mt-4 text-2xl font-medium tracking-[-0.02em] text-balance sm:text-3xl"
        >
          <span className="text-ink">
            FiO₂ et altitude simulée,
          </span>{" "}
          <span className="text-accent">
            dans les deux sens.
          </span>
        </h2>

        <p className="mt-4 max-w-2xl text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
          {
            "Un générateur d'hypoxie ne déplace pas la pression : il abaisse la fraction d'oxygène de l'air inspiré. Les deux curseurs ci-dessous sont les deux lectures d'une même réalité — déplacez l'un, l'autre suit."
          }
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Curseur altitude */}
          <div>
            <label
              htmlFor="curseur-altitude"
              className="flex flex-wrap items-baseline justify-between gap-3"
            >
              <span className="text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                Altitude simulée
              </span>
              <span className="text-3xl font-medium tracking-[-0.03em] text-ink tabular-nums">
                {formatNumber(altitude)}
                <span className="ml-1.5 text-base font-light text-dim">
                  m
                </span>
              </span>
            </label>

            <div className="relative mt-5 h-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.08]"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${percent(altitude, 0, MAX_ALTITUDE)}%` }}
                />
              </div>
              <input
                id="curseur-altitude"
                type="range"
                min={0}
                max={MAX_ALTITUDE}
                step={50}
                value={altitude}
                onChange={(event) => pickAltitude(Number(event.target.value))}
                className={SLIDER_CLASS}
              />
            </div>

            <div className="mt-2 flex justify-between text-[0.68rem] font-light text-dimmer tabular-nums">
              <span>0 m</span>
              <span>{formatNumber(MAX_ALTITUDE)} m</span>
            </div>
          </div>

          {/* Curseur FiO₂ */}
          <div>
            <label
              htmlFor="curseur-fio2"
              className="flex flex-wrap items-baseline justify-between gap-3"
            >
              <span className="text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                Fraction d&apos;oxygène (FiO₂)
              </span>
              <span className="text-3xl font-medium tracking-[-0.03em] text-accent tabular-nums">
                {formatDecimal(fio2)}
                <span className="ml-1.5 text-base font-light text-dim">
                  %
                </span>
              </span>
            </label>

            <div className="relative mt-5 h-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.08]"
              >
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{
                    width: `${percent(fio2, MIN_FIO2, SEA_LEVEL_FIO2)}%`,
                  }}
                />
              </div>
              <input
                id="curseur-fio2"
                type="range"
                min={MIN_FIO2}
                max={SEA_LEVEL_FIO2}
                step={0.1}
                value={fio2}
                onChange={(event) => pickFio2(Number(event.target.value))}
                className={SLIDER_CLASS}
              />
            </div>

            <div className="mt-2 flex justify-between text-[0.68rem] font-light text-dimmer tabular-nums">
              <span>{formatDecimal(MIN_FIO2)} % · plafond</span>
              <span>{formatDecimal(SEA_LEVEL_FIO2)} % · air ambiant</span>
            </div>
          </div>
        </div>

        <p className="mt-9 flex items-center gap-2.5 text-[0.85rem] font-light text-dim">
          <Mountain
            className="h-3.5 w-3.5 shrink-0 text-accent"
            strokeWidth={1.6}
          />
          {landmarkFor(altitude)}
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => pickAltitude(preset.metres)}
              className={`rounded-full border px-4 py-2 text-[0.76rem] font-light transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                altitude === preset.metres
                  ? "border-accent/40 bg-accent/[0.08] text-accent"
                  : "border-line bg-white/[0.02] text-dim hover:border-line-strong hover:text-ink"
              }`}
            >
              {preset.label}
              <span className="ml-2 text-dimmer tabular-nums">
                {formatNumber(preset.metres)} m
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* ── Comparatif économique ────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        aria-labelledby="comparatif-titre"
        className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl sm:p-9 lg:p-11"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_50%_100%,rgba(56,189,248,0.1),transparent_70%)]"
        />

        <div className="relative">
          <span className="font-mono text-[0.66rem] tracking-[0.24em] text-accent uppercase">
            Le comparatif
          </span>

          <h2
            id="comparatif-titre"
            className="mt-4 text-2xl font-medium tracking-[-0.02em] text-balance sm:text-3xl"
          >
            <span className="text-ink">
              Ce que coûte
            </span>{" "}
            <span className="text-accent">
              la même dose d&apos;altitude.
            </span>
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {/* Le stage */}
            <div className="rounded-[1.5rem] border border-line bg-white/[0.02] p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <Plane
                  className="h-3.5 w-3.5 text-dimmer"
                  strokeWidth={1.6}
                />
                <span className="text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                  Stage en altitude
                </span>
              </div>

              <div className="mt-6 text-4xl font-medium tracking-[-0.03em] text-ink tabular-nums">
                {formatNumber(savings.campTotal)} €
              </div>
              <div className="mt-2 text-[0.78rem] font-light text-dimmer">
                par cycle, et autant au suivant
              </div>

              <dl className="mt-7 flex flex-col gap-3 border-t border-line pt-6 text-[0.85rem] font-light">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-dim">
                    {`Hébergement en centre d'altitude, ${CAMP.nights} nuits`}
                  </dt>
                  <dd className="shrink-0 text-dim tabular-nums">
                    {formatNumber(savings.campLodging)} €
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-dim">Transport aller-retour</dt>
                  <dd className="shrink-0 text-dim tabular-nums">
                    {formatNumber(CAMP.travel)} €
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-dim">
                    Trois semaines hors de chez vous
                  </dt>
                  <dd className="shrink-0 text-dimmer">non chiffré</dd>
                </div>
              </dl>
            </div>

            {/* ATMOS ONE */}
            <div className="relative overflow-hidden rounded-[1.5rem] border border-accent/40 bg-accent/[0.05] p-6 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
              />

              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <Wind
                    className="h-3.5 w-3.5 text-accent"
                    strokeWidth={1.6}
                  />
                  <span className="text-[0.66rem] font-medium tracking-[0.2em] text-accent uppercase">
                    ATMOS ONE
                  </span>
                </div>

                <div className="mt-6 text-4xl font-medium tracking-[-0.03em] text-ink tabular-nums">
                  {formatNumber(ATMOS_PRICE)} €
                </div>
                <div className="mt-2 text-[0.78rem] font-light text-accent">
                  une fois, puis l&apos;électricité
                </div>

                <dl className="mt-7 flex flex-col gap-3 border-t border-line pt-6 text-[0.85rem] font-light">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-dim">Générateur, achat ferme</dt>
                    <dd className="shrink-0 text-dim tabular-nums">
                      {formatNumber(ATMOS_PRICE)} €
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-dim">
                      {`Électricité du cycle, ${formatNumber(savings.hours)} h de fonctionnement`}
                    </dt>
                    <dd className="shrink-0 text-dim tabular-nums">
                      {formatDecimal(savings.energyCost)} €
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-dim">Nuits passées chez vous</dt>
                    <dd className="shrink-0 text-accent">toutes</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* L'écart */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white/[0.02] px-6 py-7">
              <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                <Zap
                  className="h-3.5 w-3.5 text-accent"
                  strokeWidth={1.6}
                />
                Dès le premier cycle
              </div>
              <div className="mt-4 text-3xl font-medium tracking-[-0.03em] text-accent tabular-nums">
                {formatNumber(savings.firstCycle)} € économisés
              </div>
              <p className="mt-2 text-[0.8rem] font-light text-dimmer text-pretty">
                Appareil compris, sur les{" "}
                {protocol.weeklyDose.totalWeeksRecommended} semaines de votre
                protocole.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-line bg-white/[0.02] px-6 py-7">
              <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-dim uppercase">
                <Repeat
                  className="h-3.5 w-3.5 text-accent"
                  strokeWidth={1.6}
                />
                À chaque cycle suivant
              </div>
              <div className="mt-4 text-3xl font-medium tracking-[-0.03em] text-accent tabular-nums">
                {formatNumber(savings.nextCycle)} € économisés
              </div>
              <p className="mt-2 text-[0.8rem] font-light text-dimmer text-pretty">
                L&apos;appareil est payé : il ne reste que la consommation
                électrique.
              </p>
            </div>
          </div>

          <p className="mt-7 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
            {`Référence de comparaison : un stage classique de ${CAMP.nights} nuits en centre d'altitude à ${CAMP.nightlyRate} € la nuit, transport compris. Électricité estimée à 0,25 € le kWh pour un appareil de 550 W. Ces montants sont des ordres de grandeur de marché, pas un devis.`}
          </p>
        </div>
      </motion.section>
    </div>
  );
}
