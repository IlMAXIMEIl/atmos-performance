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
 * Libellé des boutons tant que les commandes sont fermées.
 *
 * Aucun paiement n'est possible aujourd'hui : un bouton « Précommander » sec
 * promettrait une action que le site ne sait pas tenir. Le libellé dit ce
 * qui va réellement se passer au clic. Il redeviendra « Précommander » le
 * jour où `ORDERS_OPEN` passera à `true`.
 */
/**
 * Ce que comprend la livraison, quelle que soit la formule.
 *
 * Source unique : la section Offres l'affiche, la page « À propos » s'y
 * réfère. Une ligne ajoutée ici apparaît des deux côtés — l'inverse de ce qui
 * s'est produit sur les altitudes, recopiées de page en page jusqu'à diverger.
 */
export const INCLUDED_ITEMS = [
  "Générateur ATMOS ONE",
  "Masque et circuit respiratoire",
  "Station de contrôle",
  "Protocoles guidés Live High et Train High",
  "Accompagnement au démarrage",
] as const;

export const WAITLIST_CTA = "Rejoindre la liste d'attente";
export const WAITLIST_CTA_SHORT = "Liste d'attente";

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
