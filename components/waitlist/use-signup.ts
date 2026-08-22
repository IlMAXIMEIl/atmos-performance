"use client";

import { useCallback, useState } from "react";

import type { WaitlistSource } from "@/lib/waitlist";

/**
 * L'inscription à la liste, sans son habillage.
 *
 * Trois surfaces capturent la même adresse — la modale du Drop n°1, le
 * formulaire de la location, et désormais le panneau de la page produit — et
 * chacune portait sa propre copie du motif d'email, de l'appel réseau et de la
 * machine à états. Trois copies d'une validation, c'est trois occasions de
 * diverger de celle du serveur, qui est la seule qui compte.
 *
 * Ce module ne rend rien. Il tient l'état et parle à `/api/waitlist` ; la mise
 * en forme reste entièrement au composant appelant, qui n'a pas les mêmes
 * contraintes selon qu'il occupe une modale ou une pleine largeur.
 */

/**
 * Motif volontairement plus permissif que celui du serveur.
 *
 * Le contrôle côté navigateur n'existe que pour éviter un aller-retour sur une
 * faute de frappe évidente. Le refus qui fait autorité est celui de
 * `/api/waitlist`, plus strict — et c'est le bon sens de l'écart : un
 * formulaire qui refuse une adresse que le serveur aurait acceptée perd un
 * inscrit sans que personne ne le sache jamais.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Bornes de `/api/waitlist`. Dépassées, le serveur répond 400. */
export const MAX_EMAIL_LENGTH = 200;
export const MAX_NAME_LENGTH = 100;

export type SignupStatus = "idle" | "envoi" | "ok";

/** Champ à mettre en cause quand la saisie est refusée avant l'envoi. */
export type SignupField = "firstName" | "email" | null;

export function useWaitlistSignup({
  source,
  requireFirstName = false,
  onDone,
}: {
  source: WaitlistSource;
  /** Le panneau de la page produit l'exige ; la ligne de la location non. */
  requireFirstName?: boolean;
  onDone?: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<SignupField>(null);

  function fail(field: SignupField, message: string) {
    setInvalidField(field);
    setError(message);
  }

  /** Efface le refus dès que le visiteur reprend sa saisie. */
  function clearError() {
    if (error) {
      setError(null);
      setInvalidField(null);
    }
  }

  async function submit() {
    setError(null);
    setInvalidField(null);

    const cleanName = firstName.trim();
    const cleanEmail = email.trim();

    if (requireFirstName && cleanName.length < 2) {
      fail("firstName", "Indiquez votre prénom.");
      return;
    }
    if (cleanName.length > MAX_NAME_LENGTH) {
      fail("firstName", "Prénom trop long.");
      return;
    }
    if (
      !EMAIL_PATTERN.test(cleanEmail) ||
      cleanEmail.length > MAX_EMAIL_LENGTH
    ) {
      fail("email", "Cette adresse email semble incomplète.");
      return;
    }

    setStatus("envoi");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: cleanName,
          source,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        // Le serveur sait des choses que le navigateur ignore — quota atteint,
        // Brevo injoignable. Son message passe tel quel plutôt qu'un « une
        // erreur est survenue » qui n'aide personne à décider quoi faire.
        fail(null, data.error ?? "Inscription impossible.");
        setStatus("idle");
        return;
      }

      setStatus("ok");
      onDone?.();
    } catch {
      fail(null, "Connexion impossible. Vérifiez votre réseau.");
      setStatus("idle");
    }
  }

  /**
   * Remet le formulaire à neuf.
   *
   * La modale s'en sert au terme de sa fermeture, jamais à l'ouverture :
   * vidée trop tôt, le visiteur verrait ses champs s'effacer pendant que le
   * panneau s'en va. Stable par `useCallback`, parce qu'elle sert de
   * dépendance à l'effet de fermeture — recréée à chaque rendu, elle en
   * relancerait le minuteur indéfiniment.
   */
  const reset = useCallback(() => {
    setFirstName("");
    setEmail("");
    setStatus("idle");
    setError(null);
    setInvalidField(null);
  }, []);

  return {
    firstName,
    email,
    status,
    error,
    invalidField,
    setFirstName: (value: string) => {
      setFirstName(value);
      clearError();
    },
    setEmail: (value: string) => {
      setEmail(value);
      clearError();
    },
    submit,
    reset,
  };
}
