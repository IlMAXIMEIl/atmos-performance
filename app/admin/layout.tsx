import type { Metadata } from "next";

/**
 * Disposition de l'espace d'administration.
 *
 * Elle ne fait qu'une chose : **retirer tout ce qui vit ici de l'index**.
 * Les métadonnées d'un segment sont héritées par ses pages, donc une seule
 * déclaration couvre la connexion, la liste et chaque fiche — y compris
 * celles qui seront ajoutées plus tard, qui n'auront rien à penser.
 *
 * `nocache` et `noimageindex` en plus de `noindex` : ils demandent à Google
 * de ne pas conserver de copie en cache, ce qui serait un contournement
 * complet de l'authentification si une page fuyait une fois.
 *
 * Aucun contrôle d'autorisation ici. Une disposition ne se réexécute pas à
 * chaque navigation — rendu partiel — et n'empêche pas les segments qu'elle
 * enveloppe de se rendre. La vérification est dans chaque page et chaque
 * action ; voir `lib/admin-session.ts`.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

/**
 * Rien de cet espace n'est jamais pré-rendu, ni mis en cache.
 *
 * Sans cette ligne, `next build` **fige les deux pages en statique**, et pour
 * une raison qui ne saute pas aux yeux : au moment du build, `ADMIN_PASSWORD`
 * n'est pas dans l'environnement. `hasAdminSession()` répond « non » sans
 * jamais lire de cookie, la page de liste part donc en redirection et la page
 * de connexion affiche « non configurée » — et **ce sont ces deux réponses-là
 * qui partent au CDN**.
 *
 * Le résultat est une administration définitivement inaccessible : les
 * variables ont beau être renseignées ensuite dans le panneau d'Hostinger,
 * `/admin` continue de rediriger et `/admin/connexion` continue d'annoncer
 * qu'il n'y a rien de configuré. Le rendu à la demande n'est pas une
 * précaution ici, c'est la condition pour que l'espace existe.
 *
 * C'est de toute façon ce qu'on veut : une liste de commandes doit montrer la
 * base à l'instant où on la regarde, jamais un instantané.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
