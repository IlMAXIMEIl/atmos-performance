"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import {
  demanderCode,
  verifierCode,
  type EtatConnexion,
} from "@/app/compte/connexion/actions";

/**
 * L'écran de connexion, en deux temps sur un seul formulaire.
 *
 * L'état renvoyé par l'action porte l'étape : tant qu'il vaut « email », on
 * demande l'adresse ; ensuite le code. Pas de `useState` en parallèle — deux
 * sources pour un même état finissent toujours par diverger.
 */

const DEPART: EtatConnexion = { etape: "email", email: "", message: null };

const CHAMP =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] text-ink " +
  "placeholder:text-dimmer focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const BOUTON =
  "group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-3.5 " +
  "text-sm font-semibold tracking-[0.04em] text-void transition-all duration-300 " +
  "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function ConnexionForm() {
  const [etatEmail, envoyerEmail, envoiEnCours] = useActionState(
    demanderCode,
    DEPART,
  );
  const [etatCode, envoyerCode, verificationEnCours] = useActionState(
    verifierCode,
    DEPART,
  );

  // L'étape vient de la dernière action jouée : une vérification ratée doit
  // laisser le visiteur sur l'écran du code, pas le renvoyer à l'adresse.
  const surCode = etatCode.etape === "code" || etatEmail.etape === "code";
  const email = etatCode.email || etatEmail.email;
  const message = etatCode.message ?? etatEmail.message;

  if (!surCode) {
    return (
      <form action={envoyerEmail} className="flex flex-col gap-4">
        <label htmlFor="email" className="text-[0.8rem] font-light text-dim">
          Votre adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={etatEmail.email}
          placeholder="vous@exemple.fr"
          className={CHAMP}
        />

        {message && (
          <p role="status" className="text-[0.82rem] text-amber-200/90">
            {message}
          </p>
        )}

        <button type="submit" disabled={envoiEnCours} className={BOUTON}>
          {envoiEnCours ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" strokeWidth={1.8} />
          )}
          {envoiEnCours ? "Envoi…" : "Recevoir mon code"}
        </button>

        <p className="text-[0.78rem] leading-relaxed font-light text-dimmer">
          Pas de mot de passe : un code à six chiffres, valable quelques
          minutes. Aucun achat n&apos;est nécessaire pour ouvrir un espace.
        </p>
      </form>
    );
  }

  return (
    <form action={envoyerCode} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

      <label htmlFor="code" className="text-[0.8rem] font-light text-dim">
        Le code envoyé à <span className="text-ink">{email}</span>
      </label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={8}
        required
        autoFocus
        placeholder="000000"
        className={`${CHAMP} text-center font-mono text-2xl tracking-[0.5em]`}
      />

      {message && (
        <p role="status" className="text-[0.82rem] text-amber-200/90">
          {message}
        </p>
      )}

      <button type="submit" disabled={verificationEnCours} className={BOUTON}>
        {verificationEnCours ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {verificationEnCours ? "Vérification…" : "Ouvrir mon espace"}
        {!verificationEnCours && (
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </button>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-[0.78rem] font-light text-dimmer underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Changer d&apos;adresse
      </button>
    </form>
  );
}
