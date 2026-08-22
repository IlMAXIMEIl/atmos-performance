"use client";

import { useId, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

import { WaitlistConsent } from "@/components/waitlist-consent";
import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  useWaitlistSignup,
} from "@/components/waitlist/use-signup";
import { DROP_NAME, DROP_SCARCITY, WAITLIST_CTA } from "@/lib/offering";
import { EASE } from "@/lib/motion";
import type { WaitlistSource } from "@/lib/waitlist";

/**
 * Capture de la liste prioritaire, sur la page produit.
 *
 * Tant que `ORDERS_OPEN` vaut `false`, c'est la seule conversion que le site
 * sache tenir : rien n'est encaissé, et un bouton « Précommander » promettrait
 * une action qui n'existe pas. Le panneau dit donc exactement ce qui se passe
 * au clic, et le prénom est demandé parce qu'une relance nominative sur un
 * appareil à quatre chiffres ne se joue pas au même niveau qu'un envoi groupé.
 *
 * ## Parti pris de forme
 *
 * Pas de champs en gélule, pas de cadre autour de chaque saisie. Un filet bas
 * en `--line`, et un trait d'accent qui se trace de gauche à droite à la prise
 * de focus : c'est le seul mouvement du bloc. Sur une page sombre, le chrome
 * autour d'un champ est ce qui fait basculer un formulaire du côté du
 * formulaire administratif — l'espace fait le travail à sa place.
 *
 * Le trait de focus est un élément à part, en `scale-x`, plutôt qu'un
 * `border-b-2` : une bordure qui s'épaissit décale la ligne de base d'un pixel
 * à chaque focus, et ce tremblement se voit. Il reste doublé d'un changement
 * de couleur de la bordure elle-même, pour que l'indication de focus survive à
 * `prefers-reduced-motion` comme aux préférences de contraste.
 *
 * ## Pas d'`AnimatePresence` sur la bascule de succès
 *
 * Le passage formulaire → confirmation est à sens unique : une fois inscrit,
 * on ne revient pas au formulaire. `AnimatePresence mode="wait"` y ajoutait
 * une animation de sortie dont l'achèvement conditionne le montage de la
 * confirmation — et quand cette sortie ne se déclenche pas, le formulaire
 * sortant reste affiché *tel qu'il était à l'instant du clic*, c'est-à-dire
 * bloqué sur « Envoi… », alors que l'inscription a réussi. Un tourniquet
 * perpétuel sur une capture de leads, sans la moindre erreur en console.
 *
 * La confirmation entre donc seule, en `initial`/`animate`. Rien à faire
 * disparaître, rien qui puisse rester coincé.
 */
export function LeadCapture({
  source = "drop-1",
  className = "",
}: {
  source?: WaitlistSource;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const uid = useId();
  const nameId = `${uid}-prenom`;
  const mailId = `${uid}-email`;
  const errorId = `${uid}-erreur`;
  const titleId = `${uid}-titre`;

  const {
    firstName,
    email,
    status,
    error,
    invalidField,
    setFirstName,
    setEmail,
    submit,
  } = useWaitlistSignup({ source, requireFirstName: true });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  /** Entrée seule : la confirmation n'a rien à faire sortir. */
  const enter = {
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.5, ease: EASE },
  };

  return (
    <section
      aria-labelledby={titleId}
      className={`relative mt-8 overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.06] to-white/[0.01] backdrop-blur-xl ${className}`}
    >
      {/* Halo repris du jeton, jamais d'un triplet retapé. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,var(--accent-soft),transparent_70%)]"
      />

      <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:p-14">
        {/* ── Ce qu'on demande, et pourquoi ───────────────────────────── */}
        <div>
          <span className="font-mono flex items-center gap-3 text-[0.64rem] tracking-[0.24em] text-accent uppercase">
            <span aria-hidden className="h-px w-6 flex-none bg-accent" />
            Liste prioritaire
          </span>

          <h3
            id={titleId}
            className="mt-6 text-[1.6rem] leading-[1.12] font-medium tracking-[-0.03em] text-balance sm:text-[1.9rem]"
          >
            <span className="text-ink">
              Les commandes ne sont pas ouvertes.
            </span>{" "}
            <span className="text-accent">
              Vous saurez avant tout le monde.
            </span>
          </h3>

          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed font-light text-dim text-pretty">
            {`Aucun paiement aujourd'hui. Vous rejoignez la liste du ${DROP_NAME} et recevez un accès réservé pendant 48 heures à l'ouverture, avant l'annonce publique.`}
          </p>

          {/*
            Le nombre d'unités, jamais une jauge de remplissage. Sur un achat à
            quatre chiffres, un compteur qui monte se lit comme une pression de
            vente — le fait brut se lit comme une contrainte de production.
          */}
          <p className="font-mono mt-8 border-t border-line pt-5 text-[0.68rem] leading-[1.6] tracking-[0.16em] text-dimmer uppercase">
            {DROP_SCARCITY}
          </p>
        </div>

        {/* ── La saisie ───────────────────────────────────────────────── */}
        <div className="lg:border-l lg:border-line lg:pl-16">
          {status === "ok" ? (
            <motion.div
              {...enter}
              className="flex h-full flex-col justify-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-accent/[0.07]">
                <Check className="h-4 w-4 text-accent" strokeWidth={2} />
              </span>

              <p className="mt-6 text-[1.05rem] leading-snug font-medium tracking-tight text-ink">
                {firstName.trim()
                  ? `C'est noté, ${firstName.trim()}.`
                  : "C'est noté."}
              </p>

              <p className="mt-3 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
                {`Votre place sur la liste du ${DROP_NAME} est enregistrée. Nous écrivons une fois, à l'ouverture — pas avant.`}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Field
                id={nameId}
                label="Prénom"
                type="text"
                autoComplete="given-name"
                placeholder="Camille"
                value={firstName}
                maxLength={MAX_NAME_LENGTH}
                invalid={invalidField === "firstName"}
                describedBy={error ? errorId : undefined}
                onChange={setFirstName}
              />

              <Field
                id={mailId}
                label="Adresse email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                maxLength={MAX_EMAIL_LENGTH}
                invalid={invalidField === "email"}
                describedBy={error ? errorId : undefined}
                onChange={setEmail}
                className="mt-8"
              />

              <button
                type="submit"
                disabled={status === "envoi"}
                className="group relative mt-10 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold tracking-[0.04em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none"
              >
                {status === "envoi" ? (
                  <>
                    <LoaderCircle
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden
                    />
                    Envoi…
                  </>
                ) : (
                  <>
                    {/* Reflet au survol, comme le bouton de la carte
                          d'offre : les deux appels à l'action de la section
                          doivent se ressembler. */}
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full motion-reduce:hidden"
                    />
                    <span className="relative">{WAITLIST_CTA}</span>
                    <ArrowRight
                      className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                      aria-hidden
                    />
                  </>
                )}
              </button>

              {/* `aria-live` : le refus arrive après coup, sans changement de
                    page — sans région vivante, un lecteur d'écran ne l'annonce
                    jamais et l'utilisateur croit son envoi parti. */}
              <p
                id={errorId}
                role="alert"
                aria-live="polite"
                className={`mt-4 text-[0.78rem] leading-relaxed font-light text-danger-soft transition-opacity duration-200 ${
                  error ? "opacity-100" : "h-0 opacity-0"
                }`}
              >
                {error}
              </p>

              <WaitlistConsent className="mt-4" />
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Un champ : étiquette en chasse fixe, filet bas, trait d'accent au focus.
 *
 * L'étiquette est visible et ne se replie pas dans le champ. Une étiquette
 * flottante disparaît au moment précis où l'on saisit, c'est-à-dire au moment
 * où l'on vérifie qu'on remplit la bonne case ; et un `placeholder` seul ne
 * survit pas à la première frappe. Sur deux champs, l'économie de place ne
 * vaut pas cette perte.
 */
function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  maxLength,
  invalid,
  describedBy,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  type: "text" | "email";
  autoComplete: string;
  placeholder: string;
  value: string;
  maxLength: number;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="font-mono block text-[0.62rem] tracking-[0.22em] text-dimmer uppercase"
      >
        {label}
      </label>

      <div className="relative mt-2.5">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`peer w-full appearance-none border-0 border-b bg-transparent px-0 pb-3 text-[1.02rem] font-light text-ink transition-colors duration-300 outline-none placeholder:text-dimmer/50 focus:border-accent ${
            invalid ? "border-danger" : "border-line-strong"
          }`}
        />

        {/* Le trait qui se trace. Doublé par le changement de couleur de la
            bordure ci-dessus : le focus reste visible sans lui. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out peer-focus:scale-x-100 motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}
