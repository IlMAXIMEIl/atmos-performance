"use client";

import type { FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

import { WaitlistConsent } from "@/components/waitlist-consent";
import {
  MAX_EMAIL_LENGTH,
  useWaitlistSignup,
} from "@/components/waitlist/use-signup";
import type { WaitlistSource } from "@/lib/waitlist";

/**
 * Inscription à une liste d'attente, en une ligne.
 *
 * Variante compacte : elle occupe l'emplacement du bouton d'action dans la
 * carte de location, où il n'y a de place ni pour un titre ni pour un second
 * champ. Le panneau complet de la page produit est
 * `components/waitlist/lead-capture.tsx` — même appel réseau, même validation,
 * par `useWaitlistSignup` : seule la mise en forme diffère.
 *
 * La liste de destination se choisit à l'appel : les deux intentions ne se
 * relancent pas de la même façon et ne partagent pas la même liste Brevo. Par
 * défaut la location, l'usage historique de ce formulaire.
 */
export function WaitlistForm({
  source = "location",
}: {
  source?: WaitlistSource;
} = {}) {
  const { email, status, error, setEmail, submit } = useWaitlistSignup({
    source,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  if (status === "ok") {
    return (
      <div className="mt-11 flex items-center justify-center gap-3 rounded-full border border-accent/40 bg-accent/[0.07] px-6 py-4">
        <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
        <span className="text-[0.88rem] font-light text-accent">
          C&apos;est noté. Vous serez prévenu à l&apos;ouverture.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-11">
      <label htmlFor="waitlist-email" className="sr-only">
        Votre adresse email
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          maxLength={MAX_EMAIL_LENGTH}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "waitlist-erreur" : undefined}
          className="w-full rounded-full border border-line-strong bg-white/[0.03] px-6 py-4 text-[0.9rem] font-light text-ink placeholder:text-dimmer transition-colors duration-300 focus:border-accent/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-accent focus:outline-none"
        />

        <button
          type="submit"
          disabled={status === "envoi"}
          className="group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border border-line-strong bg-white/[0.05] px-7 py-4 text-[0.85rem] font-medium tracking-[0.03em] text-ink backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.09] hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60"
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
              Être notifié
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden
              />
            </>
          )}
        </button>
      </div>

      <WaitlistConsent className="mt-4 text-center" />

      {error && (
        <p
          id="waitlist-erreur"
          role="alert"
          aria-live="polite"
          className="mt-3 text-center text-[0.78rem] font-light text-danger-soft"
        >
          {error}
        </p>
      )}
    </form>
  );
}
