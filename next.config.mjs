/**
 * Configuration Next.js — **en `.mjs`, et pas en `.ts`**.
 *
 * Le serveur de build d'Hostinger tourne sur une glibc antérieure à 2.29 :
 * le binaire natif `@next/swc-linux-x64-gnu` n'y charge pas, et Next se rabat
 * sur son compilateur WASM. Or celui-ci échoue à compiler un `next.config.ts`
 * (`Cannot find module …next.config`), ce qui fait échouer le build entier.
 * En JavaScript pur, il n'y a rien à compiler : le fichier est chargé tel quel.
 *
 * Ne pas repasser ce fichier en TypeScript sans vérifier que l'hébergeur a été
 * mis à jour. Le typage est conservé par l'annotation JSDoc ci-dessous.
 */
/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * Ils sont posés ici plutôt que dans un `proxy.ts` : ce sont des constantes,
 * identiques pour chaque route, et `headers()` les fait servir par l'edge de
 * l'hébergeur sans réveiller de fonction serveur — y compris sur les pages
 * statiques du blog et du glossaire.
 */
const SECURITY_HEADERS = [
  /**
   * Le préchargement DNS accélère les liens sortants (Stripe, polices) au prix
   * d'une résolution DNS révélant les domaines visités. Assumé : le site n'a
   * pas de contenu confidentiel et le gain de latence est réel au checkout.
   */
  { key: "X-DNS-Prefetch-Control", value: "on" },

  /**
   * HTTPS obligatoire pendant deux ans, sous-domaines compris.
   *
   * Volontairement **sans** `; preload` : l'inscription sur hstspreload.org
   * est difficile à défaire — les navigateurs refusent ensuite tout HTTP sur
   * le domaine, radiation comprise pendant des semaines — et bloquerait un
   * futur sous-domaine servi en HTTP. La protection pour les visiteurs est la
   * même ; seule l'amorce du tout premier accès n'est pas couverte.
   */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },

  /**
   * Aucune mise en cadre, d'où qu'elle vienne : le site n'est jamais embarqué
   * ailleurs, et un formulaire de capture d'email en iframe est le support
   * classique du clickjacking.
   */
  { key: "X-Frame-Options", value: "DENY" },

  /** Interdit au navigateur de deviner un type MIME à la place du nôtre. */
  { key: "X-Content-Type-Options", value: "nosniff" },

  /**
   * Origine seule vers les autres sites, rien du tout en HTTP : un chemin
   * comme `/reservation/confirmee?session_id=…` ne doit pas fuiter en referer.
   */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /**
   * Le site ne se sert d'aucune de ces API. Le dire coupe court à toute
   * demande d'accès qu'un script tiers compromis pourrait déclencher.
   *
   * `payment` fait exception, et c'est **indispensable au Payment Element**.
   * Le champ de paiement vit dans une iframe servie par `js.stripe.com`, et
   * Apple Pay comme Google Pay y passent par la Payment Request API. Sans
   * cette délégation explicite, la directive retombe sur sa valeur par défaut
   * — `self` — qui exclut l'iframe de Stripe : les portefeuilles
   * disparaissent du tunnel sans le moindre message d'erreur, et la carte
   * continue de fonctionner, ce qui rend la panne invisible en recette.
   */
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://js.stripe.com")',
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  /**
   * Build autonome pour l'hébergement Node d'Hostinger (« Web Apps »).
   *
   * Produit `.next/standalone/`, qui embarque un `server.js` minimal et les
   * seules dépendances réellement tracées — inutile d'installer `node_modules`
   * sur le serveur.
   *
   * ⚠️ `server.js` ne sert **ni `public/` ni `.next/static/`** : ces deux
   * dossiers ne sont pas copiés par le build et doivent l'être à la main,
   * faute de quoi le site se charge sans styles ni images. Voir le README pour
   * la commande de déploiement.
   */
  output: "standalone",

  /** Rien à gagner à annoncer le framework et sa version à un scanner. */
  poweredByHeader: false,

  headers() {
    return Promise.resolve([{ source: "/:path*", headers: SECURITY_HEADERS }]);
  },
};

export default nextConfig;
