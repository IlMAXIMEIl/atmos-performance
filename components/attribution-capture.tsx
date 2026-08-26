"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { capterAttribution } from "@/lib/attribution";

/**
 * L'oreille qui écoute les arrivées tracées. Monté une fois dans le
 * layout, sous `Suspense` — `useSearchParams` l'exige sur les pages
 * statiques, et ce composant ne doit surtout pas les faire basculer en
 * rendu dynamique : il ne rend rien, il pose un cookie.
 *
 * `useSearchParams` plutôt que `window.location` : la capture rejoue à
 * chaque navigation cliente, pas seulement au premier chargement — un
 * visiteur qui revient par une pub Meta alors que l'onglet était ouvert
 * est une nouvelle arrivée, pas une suite de la première.
 */
export function AttributionCapture() {
  const params = useSearchParams();
  const chemin = usePathname();

  useEffect(() => {
    capterAttribution(params.toString(), chemin);
  }, [params, chemin]);

  return null;
}
