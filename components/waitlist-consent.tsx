import Link from "next/link";

/**
 * Mention de consentement affichée sous les champs des formulaires de capture.
 *
 * Le RGPD demande que la finalité soit annoncée **au point de collecte**, pas
 * seulement dans les mentions légales : c'est ce que la CNIL regarde en
 * premier sur un formulaire de prospection. La phrase dit donc les trois
 * choses utiles — ce qu'on envoie, à quelle fréquence, comment en sortir — et
 * renvoie aux mentions légales pour le reste.
 *
 * Composant partagé plutôt que dupliqué : la modale du Batch n°1 et le
 * formulaire de la location doivent afficher exactement la même chose, et deux
 * copies divergeraient au premier ajustement de formulation.
 */
export function WaitlistConsent({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[0.72rem] leading-relaxed font-light text-white/30 ${className}`}
    >
      En rejoignant la liste, vous acceptez de recevoir nos emails. Zéro spam,
      désinscription en un clic.{" "}
      <Link
        href="/mentions-legales"
        className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/55 hover:decoration-white/40"
      >
        Vos données
      </Link>
      .
    </p>
  );
}
