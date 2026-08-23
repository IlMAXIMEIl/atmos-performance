"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Masque son contenu sur les routes qui ne sont pas des pages publiques.
 *
 * La disposition racine pose la bannière d'annonce au-dessus de **toutes** les
 * pages, y compris l'espace d'administration — où un bandeau « Lancement du
 * Drop n°1 à venir, inscrivez-vous » n'a rien à faire : personne n'y est un
 * visiteur à convaincre.
 *
 * ## Pourquoi ce détour plutôt qu'une condition dans la disposition
 *
 * Une disposition serveur ne connaît pas le chemin de la requête. Le lui
 * faire lire par `headers()` rendrait **tout le site dynamique**, blog et
 * glossaire compris, qui sont aujourd'hui pré-rendus. Déplacer les pages
 * publiques dans un groupe de routes marcherait aussi, mais reviendrait à
 * déménager quinze dossiers pour cacher un bandeau.
 *
 * Le compromis retenu coûte quelques centaines d'octets de JavaScript et
 * laisse l'essentiel intact : la bannière reste un composant **serveur**,
 * passée en `children`. Son balisage n'est jamais recalculé dans le
 * navigateur — seule la décision de l'afficher l'est.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/admin") ? null : children;
}
