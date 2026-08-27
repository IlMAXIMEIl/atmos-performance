import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseClePubliable, supabaseUrl } from "@/lib/supabase/env";

/**
 * Client Supabase pour le serveur : composants serveur, actions, routes.
 *
 * ## Un client par requête, jamais un singleton
 *
 * Le client porte la session de **l'appelant**. Le mémoriser au niveau du
 * module le ferait partager entre deux requêtes simultanées, donc entre deux
 * personnes : la seconde verrait les nuits de la première. D'où un client
 * neuf à chaque appel — ce n'est pas une inefficacité à « optimiser ».
 *
 * ## Pourquoi `setAll` peut échouer, et pourquoi on l'ignore
 *
 * Un composant serveur ne peut pas écrire d'en-tête : le flux de la réponse
 * a déjà commencé. Si Supabase veut y rafraîchir un jeton expiré, l'écriture
 * lève — et ce n'est pas une erreur à faire remonter, parce que le
 * middleware s'en charge à chaque requête, avant tout rendu. Le `catch` vide
 * est volontaire, et il n'est sûr **que** tant que le middleware existe.
 *
 * ## `getUser()`, jamais `getSession()`
 *
 * `getSession()` relit le cookie et le croit sur parole ; il est
 * falsifiable. `getUser()` fait valider le jeton par Supabase. Toute
 * décision d'autorisation passe par le second — voir `clientConnecte()`.
 */
export async function creerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseClePubliable(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesAPoser) {
        try {
          for (const { name, value, options } of cookiesAPoser) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appel depuis un composant serveur : voir ci-dessus.
        }
      },
    },
  });
}

/**
 * L'identité de l'appelant, validée auprès de Supabase.
 *
 * Renvoie `null` plutôt que de lever : chaque page décide elle-même quoi
 * faire d'un visiteur sans session — l'écran de connexion en redirige, une
 * page publique se contente de masquer une entrée de menu.
 */
export async function clientConnecte() {
  const supabase = await creerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
