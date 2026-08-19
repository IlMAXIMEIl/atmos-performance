"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

import { WaitlistConsent } from "@/components/waitlist-consent";
import type { WaitlistSource } from "@/lib/waitlist";

/**
 * Inscription à une liste d'attente.
 *
 * La liste de destination se choisit à l'appel : les deux intentions ne se
 * relancent pas de la même façon et ne partagent pas la même liste Brevo. Par
 * défaut la location, l'usage historique de ce formulaire — le seul appel qui
 * l'omet reste ainsi inchangé.
 */
export function WaitlistForm({
  source = "location",
}: {
  source?: WaitlistSource;
} = {}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "envoi" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Cette adresse email semble incomplète.");
      return;
    }

    setState("envoi");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Inscription impossible.");
        setState("idle");
        return;
      }
      setState("ok");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
      setState("idle");
    }
  }

  if (state === "ok") {
    return (
      <div className="mt-11 flex items-center justify-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/[0.07] px-6 py-4">
        <Check className="h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2} />
        <span className="text-[0.88rem] font-light text-cyan-100/90">
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
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "waitlist-erreur" : undefined}
          className="w-full rounded-full border border-white/12 bg-white/[0.03] px-6 py-4 text-[0.9rem] font-light text-white placeholder:text-white/25 transition-colors duration-300 focus:border-cyan-300/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
        />

        <button
          type="submit"
          disabled={state === "envoi"}
          className="group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-7 py-4 text-[0.85rem] font-medium tracking-[0.03em] text-white/90 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/[0.09] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none disabled:opacity-60"
        >
          {state === "envoi" ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              Être notifié
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      <WaitlistConsent className="mt-4 text-center" />

      {error && (
        <p
          id="waitlist-erreur"
          role="alert"
          className="mt-3 text-center text-[0.78rem] font-light text-rose-300/90"
        >
          {error}
        </p>
      )}
    </form>
  );
}
