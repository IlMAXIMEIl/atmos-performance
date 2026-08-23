"use client";

import { useActionState } from "react";
import { ArrowRight, Lock } from "lucide-react";

import { signIn, type ActionState } from "@/app/admin/actions";

/**
 * Formulaire de connexion.
 *
 * `useActionState` plutôt qu'un `useState` et un `fetch` : le formulaire
 * fonctionne avant l'hydratation — un POST natif, traité par l'action — et
 * `isPending` vient du même mécanisme, sans drapeau à tenir à jour à la main.
 *
 * Le message d'erreur est toujours le même, quelle que soit la cause. Il ne
 * dit ni que le mot de passe est trop court, ni qu'il n'y en a pas de
 * configuré : les deux renseigneraient qui frappe à la porte.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={formAction} className="mt-9 flex flex-col gap-4">
      <label
        htmlFor="admin-password"
        className="font-mono text-[0.66rem] tracking-[0.18em] text-dimmer uppercase"
      >
        Mot de passe
      </label>

      <div className="relative">
        <Lock
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-dimmer"
          strokeWidth={1.8}
          aria-hidden
        />
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          // Le gestionnaire de mots de passe doit pouvoir remplir ce champ :
          // c'est ce qui permet à l'opérateur d'employer un mot de passe long
          // sans avoir à le retaper trente fois par semaine.
          className="w-full rounded-xl border border-line-strong bg-deep py-3.5 pr-4 pl-11 text-[0.95rem] text-ink placeholder:text-dimmer focus:border-accent/50 focus:outline-none"
          placeholder="••••••••••••"
          aria-describedby={state.error ? "admin-password-error" : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </div>

      {state.error && (
        <p
          id="admin-password-error"
          role="alert"
          className="rounded-lg border border-danger/35 bg-danger/10 px-4 py-3 text-[0.85rem] leading-relaxed text-danger-soft"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="group mt-2 inline-flex items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? "Vérification…" : "Entrer"}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          strokeWidth={1.8}
        />
      </button>
    </form>
  );
}
