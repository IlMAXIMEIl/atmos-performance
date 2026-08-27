/**
 * Lecture des variables Supabase de la vitrine, et rien d'autre.
 *
 * ## Le même choix que Nexus : aucun préfixe `NEXT_PUBLIC_`
 *
 * La clé publiable n'est pas un secret — elle est faite pour être publique,
 * et ne donne accès qu'à ce que les politiques RLS autorisent. Le préfixe
 * serait donc sans danger, mais coûteux : une variable `NEXT_PUBLIC_` est
 * remplacée par sa valeur **à la compilation** et figée dans le paquet. Sur
 * Hostinger, en changer imposerait une reconstruction complète — celle qui
 * se fait en WASM avec le compilateur de repli, plusieurs minutes.
 *
 * Sans préfixe, ces valeurs sont lues à l'exécution : un redémarrage suffit.
 *
 * Cela n'est possible que parce que **le navigateur ne parle jamais à
 * Supabase** : l'espace client passe intégralement par des composants
 * serveur et des actions serveur. Le jour où une fonctionnalité réclamera un
 * client navigateur — du temps réel sur le tracker, par exemple — il faudra
 * réintroduire un `NEXT_PUBLIC_` et accepter le rebuild. Ce jour-là, la
 * propriété « aucune adresse Supabase dans `.next/static` » tombe aussi.
 *
 * ## Pourquoi ça lève plutôt que de retomber sur une valeur vide
 *
 * `createServerClient(undefined, undefined)` ne proteste pas : il construit
 * un client qui échouera plus tard, sur une requête, avec un message qui ne
 * parle pas de configuration. Mieux vaut échouer ici, en nommant la variable.
 */

/*
  Repli écrit en dur, même règle que `CONTENUS_API` dans `lib/posts.ts` : ce
  ne sont pas des données métier, ce sont des adresses d'infrastructure. La
  variable d'environnement prime ; la constante évite deux écueils réels —
  un poste de dev sans `.env.local` qui rend un espace client mort sans
  explication, et surtout le remplacement des variables de production par
  l'API Hostinger, qui est un remplacement *total* : y toucher pour ajouter
  deux clés obligerait à réémettre les dix autres, dont les secrets Stripe
  dont les valeurs ne se relisent pas.

  La clé publiable n'est pas un secret : elle est faite pour être publique et
  ne donne accès qu'à ce que les politiques RLS autorisent.
*/
const URL_PROJET = "https://bjrwcmvbgczgwefylhyx.supabase.co";
const CLE_PUBLIABLE = "sb_publishable_vMse_Vj2c25zup3SpqHlNw_GKwwO7k1";

export function supabaseUrl(): string {
  return process.env.SUPABASE_URL ?? URL_PROJET;
}

export function supabaseClePubliable(): string {
  return process.env.SUPABASE_PUBLISHABLE_KEY ?? CLE_PUBLIABLE;
}

/**
 * L'espace client est-il configuré ?
 *
 * Toujours vrai depuis que le repli existe — la fonction reste le point
 * unique que les pages interrogent : si le repli disparaît un jour, c'est
 * elle qui redeviendra conditionnelle, pas les pages.
 */
export function espaceClientConfigure(): boolean {
  return Boolean(supabaseUrl() && supabaseClePubliable());
}
