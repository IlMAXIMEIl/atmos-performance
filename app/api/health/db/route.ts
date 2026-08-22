import { configSource, countOrders, readConfig } from "@/lib/orders";

/**
 * Diagnostic de la base de commandes.
 *
 * Répond à la seule question qu'on s'est posée six fois pendant la mise en
 * place : **est-ce que la base répond, et est-ce que les commandes y
 * arrivent ?** Sans cet appel, la réponse demandait d'ouvrir phpMyAdmin et
 * d'écrire du SQL — ce qui explique pourquoi on a mis si longtemps à voir
 * qu'aucune écriture n'avait jamais eu lieu.
 *
 * La route valide la connexion, l'application du schéma et le droit de
 * lecture, puis renvoie le **nombre** de commandes. Jamais leur contenu : pas
 * un email, pas un nom, pas une adresse.
 *
 * ## Pourquoi un jeton malgré tout
 *
 * Un compteur de commandes est une donnée commerciale. Exposé librement, il
 * dirait à n'importe qui combien d'unités sont vendues sur une série annoncée
 * à 25. `DIAGNOSTIC_TOKEN` reste donc obligatoire, et son absence ferme la
 * route plutôt que de l'ouvrir — une variable oubliée ne doit pas se traduire
 * par une fuite.
 */
export async function GET(request: Request) {
  const expected = process.env.DIAGNOSTIC_TOKEN;

  if (!expected) {
    return Response.json(
      { error: "Diagnostic non configuré." },
      { status: 404 },
    );
  }

  /*
    En-tête uniquement, plus de `?token=`.

    Un secret placé dans une chaîne de requête est recopié dans les journaux
    d'accès de l'hébergeur, dans ceux de tout proxy traversé, et dans
    l'historique du navigateur qui l'a ouvert. Il ne s'agit pas d'un secret de
    grande valeur — la route ne rend qu'un compteur et la configuration de
    connexion — mais rien n'obligeait à le disperser.

    Appel : curl -H "x-diagnostic-token: <jeton>" https://…/api/health/db
  */
  const provided = request.headers.get("x-diagnostic-token") ?? "";

  // Comparaison en temps constant : sur une chaîne courte l'écart est
  // difficile à exploiter, mais rien n'oblige à laisser la porte entrouverte.
  if (!timingSafeEqual(provided, expected)) {
    return Response.json({ error: "Jeton invalide." }, { status: 403 });
  }

  /*
    La configuration appliquée, mot de passe exclu.

    C'est le renseignement qui manquait : une variable `DB_*` oubliée fait
    silencieusement retomber la connexion sur `DATABASE_URL`, et une
    correction posée dans le panneau semble alors sans effet. Savoir quelle
    source est retenue, et vers quel hôte on compose, évite de chercher là où
    il n'y a rien.
  */
  let config: Record<string, unknown> = { source: configSource() };
  try {
    const { host, port, user, database } = readConfig();
    config = { ...config, host, port, user, database };
  } catch (error) {
    config = {
      ...config,
      error: error instanceof Error ? error.message : "illisible",
    };
  }

  try {
    const orders = await countOrders();
    return Response.json({ ok: true, orders, config });
  } catch (error) {
    console.error("Diagnostic de la base impossible", error);

    // Le message d'erreur de la base est renvoyé ici, contrairement au reste
    // du site : la route est déjà derrière un jeton, et c'est précisément ce
    // détail — « accès refusé », « base inconnue », « connexion refusée » —
    // qui fait gagner l'heure de diagnostic.
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
        code: (error as { code?: string }).code ?? null,
        config,
      },
      { status: 503 },
    );
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}
