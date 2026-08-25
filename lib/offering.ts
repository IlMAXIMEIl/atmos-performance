import { formatNumber } from "@/lib/format";

/**
 * Ouverture commerciale des formules.
 *
 * Le lancement ne propose que l'achat ferme. La location reste présentée sur
 * le site mais son tunnel de paiement est fermé : passer cette constante à
 * `true` le rouvre partout à la fois, côté page comme côté serveur.
 */
export const LEASING_OPEN = false;

/**
 * Ouverture de l'encaissement.
 *
 * À `false`, les boutons d'action ouvrent la liste prioritaire du Drop n°1 au
 * lieu du tunnel de commande, le serveur refuse toute session de paiement, et
 * le webhook accuse réception sans rien enregistrer. Même parti pris que
 * `LEASING_OPEN` : une constante, honorée des deux côtés, pour que la page et
 * l'API ne puissent pas diverger.
 *
 * ⚠ **À `true`, le site encaisse pour de bon.** N'importe quel visiteur peut
 * régler 1 890 €, et ce que Stripe débite dépend de la clé configurée : une
 * `sk_live_` prélève réellement une carte. Vérifier avant chaque bascule que
 * le mode Stripe est celui qu'on croit, et que l'entité qui encaisse est bien
 * immatriculée.
 *
 * **Refermé, validation acquise.** La chaîne complète a été éprouvée en clés
 * de test le 22 août 2026 : paiement, vérification de l'intention côté
 * serveur, écriture en base par les deux chemins, page de confirmation.
 *
 * Quatre défauts ont été trouvés et corrigés à cette occasion — le
 * `client_secret` absent de l'URL de retour, `DATABASE_URL` illisible par
 * l'analyseur d'URL, `localhost` résolu en IPv6 que MySQL refuse, et l'URL du
 * webhook réduite à la racine du domaine. Les trois premiers ne peuvent plus
 * se reproduire ; le quatrième est de la configuration, et il est désormais
 * sans conséquence puisque la page de confirmation écrit aussi.
 *
 * Avant de rouvrir : remettre les clés de production, vérifier que le point
 * de terminaison du webhook vise bien `/api/webhooks/stripe` dans ce mode-là,
 * et s'assurer que l'entité qui encaisse est immatriculée.
 */
export const ORDERS_OPEN = false;

/**
 * Série de lancement en cours.
 *
 * La production part par séries fermées plutôt qu'en flux continu : la
 * quantité annoncée est celle réellement fabriquée pour la France. Source
 * unique des mentions de rareté, page d'accueil comme modales.
 */
export const DROP_NAME = "Drop n°1";
export const DROP_UNITS = 25;
export const DROP_SCARCITY = `Seulement ${DROP_UNITS} unités disponibles pour la France`;

/**
 * Prix d'achat d'une unité, en euros TTC.
 *
 * Valeur d'affichage, partagée par le simulateur et les données structurées.
 * Les montants réellement débités restent définis en centimes côté serveur
 * dans `app/api/checkout/route.ts` : un prix venu du navigateur serait
 * modifiable par le visiteur.
 */
export const PURCHASE_PRICE_EUR = 1890;

/**
 * Loyer mensuel et frais d'expédition de la location, en euros.
 *
 * Ils n'existaient nulle part : « 350 € » et « 39 € » étaient écrits à la
 * main dans la carte d'offre *et* dans le récapitulatif de la modale, sans
 * qu'aucun des deux ne sache que l'autre existait. Le même schéma exactement
 * que le « paiement en 3x ou 4x » — il n'avait simplement pas encore divergé.
 */
export const LEASING_MONTHLY_EUR = 350;
export const LEASING_SHIPPING_EUR = 39;

/**
 * « 1 890 € », avec l'espace fine insécable des milliers.
 *
 * Le même formateur que les altitudes, pour que les montants et les mètres
 * s'écrivent de la même façon sur une page qui affiche les deux — et pour la
 * raison qui a fait écrire `formatNumber` à la main : `toLocaleString` ne
 * sépare pas les milliers de la même façon d'une version d'ICU à l'autre, et
 * l'écart serveur / navigateur casse l'hydratation.
 */
export function formatEuros(value: number): string {
  return `${formatNumber(value)} €`;
}

/**
 * Moyens de paiement annoncés sous le prix.
 *
 * Réservés à l'achat : la location se règle comptant, mois par mois, et
 * n'ouvre droit à aucun fractionnement. Toute reprise de cette constante doit
 * donc rester derrière une condition sur la formule d'achat.
 *
 * **N'énumérer ici que ce que Stripe propose réellement.** Cette phrase paraît
 * sur la carte de prix publique et dans la FAQ, dont dérive le balisage
 * `FAQPage` : elle est indexée, et c'est un engagement tarifaire.
 *
 * Trois mentions ont été retirées pour cette raison :
 *
 * - le **10x**, que Klarna ne propose pas via Stripe ;
 * - **Alma**, qui n'y est pas distribué du tout et demanderait une
 *   intégration séparée ;
 * - **PayPal**, activé en mode test mais pas en production — le tunnel ne
 *   l'affichait donc pas, alors que cette phrase l'annonçait juste au-dessus.
 *   À remettre le jour où il apparaît réellement dans le Payment Element, et
 *   pas avant : les deux listes de moyens de paiement de Stripe, test et
 *   production, sont indépendantes.
 */
/**
 * Les options payantes, par **identifiant stable**.
 *
 * ## Pourquoi cette table vit ici et pas dans une route
 *
 * Les deux tunnels — la session Checkout pour la location, l'intention de
 * paiement pour l'achat — écrivent tous deux les options choisies dans les
 * métadonnées Stripe, et le tableau de bord les relit pour savoir quoi sortir
 * du stock. Trois fichiers, une seule vérité : elle ne peut être qu'ici.
 *
 * Elle en portait déjà deux, en fait, et elles ne disaient pas la même chose :
 * la session écrivait les libellés (« Oxymètre de pouls »), l'intention
 * écrivait les identifiants bruts. Deux commandes identiques produisaient donc
 * deux métadonnées différentes selon la formule choisie — le genre d'écart
 * qu'on ne découvre qu'en cherchant pourquoi une commande sur deux ne
 * décrémente rien.
 *
 * ## La clé est l'identifiant, jamais le libellé
 *
 * Un libellé est un texte d'interface : il se retouche, se raccourcit, gagne
 * une majuscule. Une correspondance posée dessus se casse à ce moment-là, en
 * silence — la commande passe, s'expédie, et ne sort rien de l'entrepôt.
 *
 * Les deux partent donc chez Stripe, chacun pour ce qu'il sait faire :
 * `optionIds` pour la machine, `options` pour l'œil humain qui lira la fiche
 * de la commande.
 */
export const PAID_OPTIONS: Record<string, string> = {
  oxymetre: "Oxymètre de pouls",
  monitoring: "Système de monitoring",
};

/** Les identifiants reçus qui existent réellement, dans l'ordre du catalogue. */
export function knownOptionIds(received: unknown): string[] {
  if (!Array.isArray(received)) return [];
  const asked = new Set(
    received.filter((o): o is string => typeof o === "string"),
  );
  return Object.keys(PAID_OPTIONS).filter((id) => asked.has(id));
}

/** Ce qui part chez Stripe pour la machine : « oxymetre,monitoring ». */
export function optionIdsMeta(ids: string[]): string {
  return ids.join(",");
}

/** Ce qui part chez Stripe pour l'œil : « Oxymètre de pouls, … ». */
export function optionLabelsMeta(ids: string[]): string {
  return ids.map((id) => PAID_OPTIONS[id]).join(", ") || "aucune";
}

export const INSTALLMENTS_NOTE =
  "Carte bancaire ou paiement en 3x avec Klarna";

/**
 * Contrepartie de la location : pas de fractionnement, mais une empreinte
 * bancaire au titre de la caution matérielle. Annoncée sous le loyer, en
 * discret, pour que le locataire ne la découvre pas au moment de payer.
 */
export const LEASING_DEPOSIT_NOTE =
  "*Une empreinte bancaire sera demandée pour la caution matérielle.";

/** Titre et accroche du formulaire de capture, partagés modale et section. */
export const WAITLIST_TITLE = `Rejoindre la liste d'attente prioritaire du ${DROP_NAME}`;
export const WAITLIST_SUBTITLE = "Ouverture des commandes imminente";

/**
 * Ce que comprend la livraison, quelle que soit la formule.
 *
 * Source unique : la section Offres l'affiche, la page « À propos » s'y
 * réfère. Une ligne ajoutée ici apparaît des deux côtés — l'inverse de ce qui
 * s'est produit sur les altitudes, recopiées de page en page jusqu'à diverger.
 */
export const INCLUDED_ITEMS = [
  "Générateur ATMOS ONE",
  "Masque, ballon réservoir et circuit respiratoire",
  "Station de contrôle",
  "Protocoles guidés Live High et Train High",
  "Accompagnement au démarrage",
] as const;

/**
 * Libellé des boutons tant que les commandes sont fermées.
 *
 * Aucun paiement n'est possible aujourd'hui : un bouton « Précommander » sec
 * promettrait une action que le site ne sait pas tenir. Le libellé dit ce qui
 * va réellement se passer au clic, et nomme la série plutôt que le mécanisme —
 * « liste d'attente » décrit notre tableur, « être averti du Drop n°1 » décrit
 * ce que le visiteur y gagne. Il redeviendra « Précommander » le jour où
 * `ORDERS_OPEN` passera à `true`.
 *
 * La version courte existe pour le bouton du header, contraint en largeur sur
 * mobile. Les deux sortent d'ici : un libellé d'appel à l'action retapé dans
 * une page finit toujours par contredire les autres.
 */
export const WAITLIST_CTA = `Être averti du ${DROP_NAME}`;
export const WAITLIST_CTA_SHORT = "Être averti";

/**
 * Déroulé de la précommande, tel qu'annoncé au visiteur.
 *
 * Exporté depuis ici parce que trois surfaces le reprennent : la section
 * « Offres », la FAQ — dont le balisage `FAQPage` dérive — et la modale de
 * capture. Un parcours décrit différemment d'un endroit à l'autre est le
 * genre d'incohérence que Google relève sur les pages produit.
 */
export const PREORDER_STEPS = [
  {
    title: "Inscrivez-vous sur la liste prioritaire",
    detail: "Sans engagement : un email suffit, aucun paiement n'est demandé.",
  },
  {
    title: `Accès exclusif à l'ouverture du ${DROP_NAME}`,
    detail: `Stocks très limités. ${DROP_SCARCITY}.`,
  },
  {
    title: "Paiement sécurisé à l'ouverture",
    detail: "Au comptant ou fractionné, selon ce qui vous arrange.",
  },
  {
    title: "Fabrication et expédition directe",
    detail: "Votre unité est produite dans la série, puis expédiée chez vous.",
  },
] as const;
