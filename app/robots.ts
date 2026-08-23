import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Page de retour après paiement : sans intérêt pour l'indexation.
        "/reservation/",
        /*
          Espace d'administration.

          Les pages portent déjà `robots: { index: false }` — voir
          `app/admin/layout.tsx` — mais un robot doit d'abord charger la page
          pour lire cette balise, ce qui consomme du budget d'exploration et
          fait apparaître l'espace dans les journaux d'accès. Le refus est
          posé ici en plus, pas à la place.

          Ce fichier est public : il annonce l'existence de `/admin`. Ce n'est
          pas un secret — la route est devinable en trois essais — et la
          protection est le mot de passe, jamais l'obscurité de l'adresse.
        */
        "/admin/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
