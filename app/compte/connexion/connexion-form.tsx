"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import {
  creerCompte,
  demanderReinitialisation,
  seConnecter,
  type EtatCompte,
} from "@/app/compte/connexion/actions";

/**
 * L'entrée du compte, en trois volets sur un seul écran : se connecter,
 * créer un compte, mot de passe oublié. Le parcours de tous les sites —
 * c'est le point : personne ne doit apprendre quoi que ce soit ici.
 */

type Volet = "connexion" | "creation" | "oubli";

const RIEN: EtatCompte = { message: null };

const CHAMP =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] text-ink " +
  "placeholder:text-dimmer focus:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const LIBELLE = "text-[0.78rem] font-light text-dim";

const BOUTON =
  "group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-3.5 " +
  "text-sm font-semibold tracking-[0.04em] text-void transition-all duration-300 " +
  "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const LIEN_DISCRET =
  "text-[0.78rem] font-light text-dimmer underline-offset-4 transition-colors hover:text-ink hover:underline";

function Message({ etat }: { etat: EtatCompte }) {
  if (!etat.message) return null;
  return (
    <p
      role="status"
      className={`text-[0.83rem] leading-relaxed text-pretty ${
        etat.attenteEmail ? "text-accent" : "text-amber-200/90"
      }`}
    >
      {etat.message}
    </p>
  );
}

export function ConnexionForm({ lienExpire }: { lienExpire?: boolean }) {
  const [volet, setVolet] = useState<Volet>("connexion");

  const [etatConnexion, connecter, connexionEnCours] = useActionState(
    seConnecter,
    RIEN,
  );
  const [etatCreation, creer, creationEnCours] = useActionState(
    creerCompte,
    RIEN,
  );
  const [etatOubli, reinitialiser, oubliEnCours] = useActionState(
    demanderReinitialisation,
    RIEN,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* La bascule connexion / création — l'oubli est un chemin de sortie,
          pas un troisième onglet. */}
      {volet !== "oubli" && (
        <div
          role="tablist"
          aria-label="Connexion ou création de compte"
          className="grid grid-cols-2 rounded-full border border-line bg-white/[0.02] p-1"
        >
          {(
            [
              ["connexion", "Se connecter"],
              ["creation", "Créer un compte"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={volet === id}
              onClick={() => setVolet(id)}
              className={`rounded-full py-2.5 text-[0.82rem] font-medium transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                volet === id
                  ? "bg-accent/[0.12] text-accent"
                  : "text-dim hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {lienExpire && volet === "connexion" && (
        <p role="status" className="text-[0.83rem] text-amber-200/90">
          Ce lien a expiré ou a déjà servi. Connectez-vous, ou demandez un
          nouveau lien ci-dessous.
        </p>
      )}

      {volet === "connexion" && (
        <form action={connecter} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email-connexion" className={LIBELLE}>
              Adresse email
            </label>
            <input
              id="email-connexion"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.fr"
              className={`${CHAMP} mt-1.5`}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="mdp-connexion" className={LIBELLE}>
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setVolet("oubli")}
                className={LIEN_DISCRET}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input
              id="mdp-connexion"
              name="mot_de_passe"
              type="password"
              autoComplete="current-password"
              required
              className={`${CHAMP} mt-1.5`}
            />
          </div>

          <Message etat={etatConnexion} />

          <button type="submit" disabled={connexionEnCours} className={BOUTON}>
            {connexionEnCours ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {connexionEnCours ? "Connexion…" : "Ouvrir mon espace"}
            {!connexionEnCours && (
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </button>
        </form>
      )}

      {volet === "creation" && (
        <form action={creer} className="flex flex-col gap-4">
          <div>
            <label htmlFor="prenom" className={LIBELLE}>
              Prénom
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              autoComplete="given-name"
              placeholder="Camille"
              className={`${CHAMP} mt-1.5`}
            />
          </div>
          <div>
            <label htmlFor="email-creation" className={LIBELLE}>
              Adresse email
            </label>
            <input
              id="email-creation"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.fr"
              className={`${CHAMP} mt-1.5`}
            />
            <p className="mt-1.5 text-[0.72rem] leading-relaxed font-light text-dimmer">
              Utilisez l&apos;adresse de vos commandes ATMOS : elles se
              rattachent toutes seules.
            </p>
          </div>
          <div>
            <label htmlFor="mdp-creation" className={LIBELLE}>
              Mot de passe — 8 caractères minimum
            </label>
            <input
              id="mdp-creation"
              name="mot_de_passe"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={`${CHAMP} mt-1.5`}
            />
          </div>

          <Message etat={etatCreation} />

          <button type="submit" disabled={creationEnCours} className={BOUTON}>
            {creationEnCours ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {creationEnCours ? "Création…" : "Créer mon compte"}
            {!creationEnCours && (
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </button>

          <p className="text-[0.72rem] leading-relaxed font-light text-dimmer text-pretty">
            Gratuit, sans engagement — aucun achat requis. Vos données de
            suivi restent les vôtres : consultables, exportables et
            supprimables à tout moment.
          </p>
        </form>
      )}

      {volet === "oubli" && (
        <form action={reinitialiser} className="flex flex-col gap-4">
          <p className="text-[0.85rem] leading-relaxed font-light text-dim">
            Indiquez votre adresse : vous recevrez un lien pour choisir un
            nouveau mot de passe.
          </p>
          <div>
            <label htmlFor="email-oubli" className={LIBELLE}>
              Adresse email
            </label>
            <input
              id="email-oubli"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.fr"
              className={`${CHAMP} mt-1.5`}
            />
          </div>

          <Message etat={etatOubli} />

          <button type="submit" disabled={oubliEnCours} className={BOUTON}>
            {oubliEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {oubliEnCours ? "Envoi…" : "Recevoir le lien"}
          </button>

          <button
            type="button"
            onClick={() => setVolet("connexion")}
            className={LIEN_DISCRET}
          >
            Retour à la connexion
          </button>
        </form>
      )}
    </div>
  );
}
