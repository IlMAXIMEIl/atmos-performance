/**
 * Limitation de requêtes par IP, en mémoire.
 *
 * Fenêtre glissante simple, sans dépendance ni service externe. Elle suffit à
 * son objectif réel : empêcher un bot d'inonder le formulaire de capture ou de
 * faire créer des centaines de sessions Stripe. Ce n'est pas un rempart contre
 * une attaque distribuée, et elle ne prétend pas l'être.
 *
 * ⚠️ **Limite structurelle en hébergement serverless** (Vercel, Netlify) : le
 * compteur vit dans la mémoire d'une instance. Plusieurs instances en
 * parallèle comptent chacune de leur côté, et une instance recyclée repart de
 * zéro — le quota réel est donc un multiple de celui annoncé. C'est un filtre
 * anti-spam, pas un quota exact. Le jour où il en faut un vrai, seul ce module
 * est à réécrire vers un stockage partagé (Upstash Redis, Vercel KV) : les
 * routes appelantes n'ont pas à bouger.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Plafond du registre. Sans lui, un attaquant faisant tourner son IP ferait
 * grossir la Map indéfiniment — la protection deviendrait la fuite mémoire.
 */
const MAX_TRACKED_KEYS = 10_000;

/** Purge les fenêtres expirées, et vide tout si le registre déborde. */
function evictExpired(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  if (windows.size > MAX_TRACKED_KEYS) windows.clear();
}

export type RateLimitResult = {
  ok: boolean;
  /** Secondes à attendre avant de réessayer — sert l'en-tête `Retry-After`. */
  retryAfter: number;
};

/**
 * Consomme un jeton pour `key`.
 *
 * @param key    Identité de l'appelant, préfixée par la route : deux routes ne
 *               doivent pas partager le même compteur.
 * @param limit  Nombre de requêtes autorisées par fenêtre.
 * @param windowMs Durée de la fenêtre, en millisecondes.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  evictExpired(now);

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Identifie l'appelant à partir des en-têtes du proxy.
 *
 * `x-forwarded-for` est renseigné par le client autant que par le proxy : sa
 * valeur brute se falsifie. Derrière Vercel, `x-real-ip` est posé par la
 * plateforme et fait foi ; on ne retombe sur le premier maillon de
 * `x-forwarded-for` qu'à défaut. Sans aucun des deux (appel local), toutes les
 * requêtes partagent le même compteur : c'est le comportement voulu en
 * développement.
 */
export function clientKey(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}

/**
 * Même identité, à partir des seuls en-têtes.
 *
 * Une action serveur ne reçoit pas de `Request` : elle lit `headers()` de
 * `next/headers`. Le formulaire de connexion de l'administration en a besoin
 * pour compter ses tentatives comme les routes comptent les leurs — sans
 * quoi la seule porte protégée par un mot de passe serait aussi la seule
 * sans limitation de débit.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "inconnu";
}

/** Réponse standard de refus : message générique, `Retry-After` renseigné. */
export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: "Trop de tentatives. Réessayez dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
