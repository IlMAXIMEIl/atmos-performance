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

function requise(valeur: string | undefined, nom: string): string {
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. ` +
        "Voir .env.example — les valeurs sont dans Supabase, " +
        "Project Settings → API Keys.",
    );
  }
  return valeur;
}

export function supabaseUrl(): string {
  return requise(process.env.SUPABASE_URL, "SUPABASE_URL");
}

export function supabaseClePubliable(): string {
  return requise(
    process.env.SUPABASE_PUBLISHABLE_KEY,
    "SUPABASE_PUBLISHABLE_KEY",
  );
}

/**
 * L'espace client est-il configuré ?
 *
 * La vitrine doit tourner sans Supabase : un poste de développement sans
 * `.env.local`, ou un incident de configuration en production, ne doit pas
 * emporter la page d'accueil et le tunnel de commande avec l'espace client.
 * Les entrées vers `/compte` se contentent alors de disparaître.
 */
export function espaceClientConfigure(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}
