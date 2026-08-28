import { NextResponse, type NextRequest } from "next/server";

import { creerClient } from "@/lib/supabase/server";

/**
 * L'atterrissage des liens envoyés par email.
 *
 * Confirmation d'inscription et réinitialisation de mot de passe passent
 * tous deux par ici : le lien porte un `code` à usage unique, cette route
 * l'échange contre une session puis route selon le cas — `?suite` pour la
 * réinitialisation (l'écran du nouveau mot de passe), `/compte` sinon.
 *
 * C'est une route et non une page : il n'y a rien à afficher, seulement des
 * cookies à poser — précisément ce qu'un gestionnaire de route fait et
 * qu'un composant serveur ne peut pas faire proprement.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const suite = request.nextUrl.searchParams.get("suite");

  // Seules nos deux destinations internes sont acceptées : une `suite`
  // arbitraire ferait de cette route un redirecteur ouvert.
  const destination = suite === "/compte/nouveau-mot-de-passe" ? suite : "/compte";

  if (code) {
    const supabase = await creerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
    console.error("Espace client — échange du code :", error.message);
  }

  // Lien expiré, déjà utilisé, ou forgé : retour à l'entrée, avec un mot.
  const connexion = new URL("/compte/connexion", request.url);
  connexion.searchParams.set("lien", "expire");
  return NextResponse.redirect(connexion);
}
