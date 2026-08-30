/**
 * Liste d'attente : les inscriptions alimentent directement Brevo.
 *
 * Remplace successivement le fichier JSONL local (perdu à chaque déploiement
 * sur un hébergement sans disque) puis la notification par email (une boîte de
 * réception n'est pas une base de contacts). Brevo devient la source de
 * vérité : segmentation, désinscription et envois groupés y sont natifs.
 *
 * Le SDK `@getbrevo/brevo` n'est pas utilisé : deux appels REST suffisent, et
 * s'en passer évite une dépendance de plus à surveiller. Seul ce module serait
 * à retoucher pour en changer.
 */

/** Origine de l'inscription : intention d'achat, ou demande d'information. */
export type WaitlistSource = "drop-1" | "location";

const API_ROOT = "https://api.brevo.com/v3";

/**
 * Délai au-delà duquel on cesse d'attendre Brevo.
 *
 * Sans plafond, une API qui ne répond pas retient la fonction serverless
 * jusqu'à son propre délai d'exécution, et le visiteur regarde un bouton qui
 * tourne. Mieux vaut échouer vite et lui proposer de réessayer.
 */
const TIMEOUT_MS = 8_000;

/** Résultat interne. Le route handler répond la même chose dans les deux cas :
 *  distinguer les deux côté client révélerait qui est déjà inscrit. */
export type WaitlistResult = "inscrit" | "deja-inscrit";

type BrevoConfig = { apiKey: string; listId: number };

/**
 * Lit et valide la configuration.
 *
 * `BREVO_LIST_ID` est convertie en nombre ici : l'API refuse une liste
 * transmise en chaîne, et l'erreur qu'elle renvoie alors n'est pas parlante.
 * Autant échouer tout de suite, avec un message qui dit quoi corriger.
 *
 * La location et le Drop n°1 ne se relancent pas de la même façon : si
 * `BREVO_LOCATION_LIST_ID` est définie, les demandes d'information y vont.
 * Sinon tout arrive dans `BREVO_LIST_ID` — configuration minimale, quitte à
 * mélanger les deux intentions dans une seule liste.
 */
function readConfig(source: WaitlistSource): BrevoConfig {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY absent : voir .env.example");
  }

  const raw =
    (source === "location" ? process.env.BREVO_LOCATION_LIST_ID : undefined) ??
    process.env.BREVO_LIST_ID;
  const listId = Number(raw);
  if (!raw || !Number.isInteger(listId) || listId <= 0) {
    throw new Error(
      `BREVO_LIST_ID doit être l'identifiant numérique d'une liste Brevo (reçu : ${JSON.stringify(raw)})`,
    );
  }

  return { apiKey, listId };
}

function headers(apiKey: string) {
  return {
    // Brevo s'authentifie par un en-tête maison, pas par `Authorization`.
    "api-key": apiKey,
    "Content-Type": "application/json",
    accept: "application/json",
  };
}

/** Corps d'erreur Brevo : `{ code, message }`. Le code est stable, pas le message. */
async function readError(response: Response) {
  const body = await response.text().catch(() => "");
  let code = "";
  try {
    code = (JSON.parse(body) as { code?: string }).code ?? "";
  } catch {
    // Réponse non-JSON (passerelle, page d'erreur) : le texte brut suffit aux journaux.
  }
  return { code, body: body.slice(0, 500) };
}

/**
 * Inscrit un prospect, ou rattache à la liste un contact déjà connu.
 *
 * Deux appels, jamais plus d'un dans le cas courant :
 *
 * 1. `POST /contacts` crée le contact et l'ajoute à la liste.
 * 2. Si Brevo répond `duplicate_parameter`, l'adresse existe déjà — dans un
 *    autre segment, ou inscrite lors d'une campagne précédente. Un `PUT` la
 *    rattache alors à la liste visée.
 *
 * Le `PUT` ne transmet **que** `listIds`, jamais les attributs : sans quoi
 * n'importe qui connaissant l'adresse d'un contact pourrait réécrire son
 * prénom depuis le formulaire public. C'est aussi la raison pour laquelle
 * `updateEnabled` reste à `false` sur la création.
 *
 * @throws si la configuration manque, si Brevo est injoignable ou refuse.
 */

/** Les clés de `lireAttribution` → les attributs Brevo, créés côté compte. */
const ATTRIBUTION_VERS_BREVO: Record<string, string> = {
  utmSource: "UTM_SOURCE",
  utmMedium: "UTM_MEDIUM",
  utmCampaign: "UTM_CAMPAIGN",
  utmContent: "UTM_CONTENT",
  utmTerm: "UTM_TERM",
  gclid: "GCLID",
  fbclid: "FBCLID",
  attributionPage: "ORIGINE_PAGE",
  attributionLe: "ORIGINE_LE",
};

/**
 * Traduit l'attribution en attributs Brevo. Sans elle, l'euro de publicité
 * restait aveugle : Nexus collecte la dépense par campagne chez les régies,
 * mais aucun inscrit ne portait la campagne qui l'avait produit — le coût
 * par inscrit, la seule boussole du plan média, était incalculable.
 */
function attributionAttributes(
  attribution: Record<string, string> | undefined,
): Record<string, string> {
  if (!attribution) return {};
  const out: Record<string, string> = {};
  for (const [cle, attribut] of Object.entries(ATTRIBUTION_VERS_BREVO)) {
    const valeur = attribution[cle];
    if (valeur) out[attribut] = valeur;
  }
  return out;
}

export async function addToWaitlist(
  email: string,
  {
    firstName,
    source,
    attribution,
  }: {
    firstName?: string;
    source: WaitlistSource;
    /**
     * L'origine publicitaire, lue du cookie `atmos_origine` par la route —
     * les mêmes clés que les métadonnées Stripe (`lireAttribution`).
     * Portée à la création seulement : le PUT de rattachement ci-dessous
     * ne transmet jamais d'attributs, et cette règle vaut aussi pour
     * l'origine — un contact revenu par une autre campagne garde celle de
     * sa première inscription, c'est elle qui l'a produit.
     */
    attribution?: Record<string, string>;
  },
): Promise<WaitlistResult> {
  const { apiKey, listId } = readConfig(source);
  const normalised = email.trim().toLowerCase();

  const attributes: Record<string, string> = {
    ...(firstName ? { FIRSTNAME: firstName } : {}),
    ...attributionAttributes(attribution),
  };

  const created = await fetch(`${API_ROOT}/contacts`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      email: normalised,
      listIds: [listId],
      ...(Object.keys(attributes).length ? { attributes } : {}),
      // Une création ne doit pas pouvoir écraser un contact existant :
      // le cas du doublon est traité explicitement ci-dessous.
      updateEnabled: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (created.ok) return "inscrit";

  const { code, body } = await readError(created);

  // Adresse déjà connue de Brevo : on la rattache à la liste plutôt que
  // d'ignorer l'erreur, sans quoi un contact venu d'une autre campagne ne
  // rejoindrait jamais la liste d'attente.
  if (created.status === 400 && code === "duplicate_parameter") {
    const attached = await fetch(
      `${API_ROOT}/contacts/${encodeURIComponent(normalised)}`,
      {
        method: "PUT",
        headers: headers(apiKey),
        body: JSON.stringify({ listIds: [listId] }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!attached.ok) {
      const detail = await readError(attached);
      console.error(
        `Brevo : rattachement à la liste ${listId} refusé (${attached.status}) — inscription à reprendre à la main : ${normalised} (${source})`,
        detail.body,
      );
      throw new Error(`Brevo a répondu ${attached.status} au rattachement`);
    }

    return "deja-inscrit";
  }

  // Le détail (clé révoquée, liste inexistante, quota atteint) part dans les
  // journaux du serveur, jamais vers le visiteur. L'adresse y figure pour
  // rester récupérable à la main si Brevo est durablement indisponible.
  console.error(
    `Brevo a refusé l'inscription (${created.status}${code ? ` ${code}` : ""}) — à reprendre à la main : ${normalised} (${source})`,
    body,
  );
  throw new Error(`Brevo a répondu ${created.status}`);
}
