"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  changerMotDePasse,
  type EtatCompte,
} from "@/app/compte/connexion/actions";

const RIEN: EtatCompte = { message: null };

export function NouveauMotDePasseForm() {
  const [etat, changer, enCours] = useActionState(changerMotDePasse, RIEN);

  return (
    <form action={changer} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="mot_de_passe"
          className="text-[0.78rem] font-light text-dim"
        >
          Nouveau mot de passe — 8 caractères minimum
        </label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] text-ink focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        />
      </div>

      {etat.message && (
        <p role="status" className="text-[0.83rem] text-amber-200/90">
          {etat.message}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold tracking-[0.04em] text-void transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-60"
      >
        {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {enCours ? "Enregistrement…" : "Enregistrer et continuer"}
      </button>
    </form>
  );
}
