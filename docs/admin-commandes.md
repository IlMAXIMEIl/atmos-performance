# Espace d'administration des commandes

**État : construit et vérifié en local.** Ce document se suffit à lui-même : il
porte le périmètre, les décisions prises et les pièges rencontrés — pendant la
conception comme pendant la construction. Le donner tel quel en début de
conversation doit suffire à reprendre le travail.

---

## 1. Le problème, et ce qui y répond

Les commandes étaient enregistrées en base (`lib/orders.ts`, table `orders`)
sans que rien ne permette de les consulter ni de les traiter : il fallait
ouvrir phpMyAdmin et écrire du SQL.

`/admin` offre désormais la liste, le statut et le bouton « marquer comme
traitée » qu'un onglet « Commandes » de Shopify propose.

## 2. Ce qui n'est PAS construit, et pourquoi

Cette section reste la plus importante du document : elle évite des semaines de
travail inutile.

- **Aucun tableau de bord financier.** Chiffre d'affaires, virements,
  remboursements, litiges, exports comptables, TVA : Stripe le fait déjà, et
  mieux. Le dupliquer créerait une seconde source de vérité qui finirait par
  diverger de la première. Le tableau de bord financier du projet, c'est
  Stripe — et la page de liste le dit en toutes lettres, avec un lien.
- **Aucune gestion de stock** tant qu'il n'y a qu'un produit sans variante.
- **Aucune étiquette transporteur ni intégration logistique** tant que le
  volume ne le justifie pas. Le champ « numéro de suivi » est un champ texte
  libre : il se recopie depuis n'importe quel transporteur et ne tombe jamais
  en panne.

La règle : **l'administration sert au traitement des commandes, pas à la
comptabilité ni à l'analyse.**

## 3. Ce qui existe

### 3.1 Routes

| Route | Rôle |
| --- | --- |
| `/admin` | Liste paginée, recherche, filtres, tri, actions en lot |
| `/admin/connexion` | Formulaire de connexion |
| `/admin/commandes/[reference]` | Fiche commande, statut, traitement, journal |
| `/admin/export` | Export CSV de la sélection courante |

### 3.2 Authentification — `lib/admin-session.ts`

- Mot de passe unique dans `ADMIN_PASSWORD`, cookie de session signé
  (`httpOnly`, `sameSite=lax`, `secure` en production), douze heures.
- Signature HMAC-SHA256 par `node:crypto`, **sans dépendance ajoutée** : la
  session ne transporte qu'une date d'expiration, un JWT n'aurait rien de plus
  à porter.
- La clé de signature dérive du secret **et** de l'empreinte du mot de passe :
  changer l'un ou l'autre invalide toutes les sessions en cours.
- Comparaisons en temps constant sur des empreintes SHA-256 de longueur fixe —
  même précaution que `app/api/health/db/route.ts`.
- Limitation de débit sur la connexion : cinq tentatives par quart d'heure et
  par IP, via `lib/rate-limit.ts`.
- `robots: { index: false }` sur tout le segment (`app/admin/layout.tsx`), et
  `/admin/` refusé dans `app/robots.ts`.

**`requireAdmin()` est appelé dans chaque page et chaque action serveur**,
jamais seulement dans la disposition : une disposition ne se réexécute pas à
chaque navigation et n'empêche pas les segments qu'elle enveloppe de se rendre.
Les actions serveur, elles, sont des points d'entrée POST publics dès qu'elles
existent.

### 3.3 Base — `lib/orders.ts`

Trois colonnes ajoutées à `orders` et une table créée, par des migrations
idempotentes jouées à la première requête :

```
orders.status           VARCHAR(32) NOT NULL DEFAULT 'recue'   + INDEX idx_status
orders.tracking_number  VARCHAR(128) NOT NULL DEFAULT ''
orders.internal_note    TEXT
order_events (id, order_id, status, note, created_at)  FK ON DELETE CASCADE
```

Statuts : `recue`, `en_fabrication`, `expediee`, `annulee` — définis dans
`lib/order-status.ts`, **volontairement à part de `lib/orders.ts`** : le
premier composant client à importer `isOrderStatus` depuis `lib/orders`
entraînerait `mysql2`, donc `net` et `tls`, dans le paquet du navigateur, et la
compilation échoue. C'est arrivé deux fois pendant la construction.

`updateOrderStatus` passe par une **transaction** : une série entière bascule
en entier ou pas du tout, journal compris. Une commande déjà dans le statut
demandé n'est pas touchée et ne produit pas d'événement.

### 3.4 Liste

Pensée pour des milliers de lignes : pagination par la base (50 par page),
`COUNT(*)` séparé pour le total, aucun `SELECT` intégral. `listOrders()`, qui
faisait un `SELECT * FROM orders` non borné et n'était appelée nulle part, a
été remplacée par `searchOrders()`.

Les filtres vivent **dans l'URL** et nulle part ailleurs (`lib/admin-filters.ts`) :
une recherche se partage, le retour arrière refait la vue précédente, et
l'export relit la même chaîne de requête que la page en appelant la même
fonction de filtrage — le fichier contient exactement les lignes affichées.

Les caractères propres à `LIKE` sont échappés : un `%` saisi par erreur ne
rapporte pas toute la table.

### 3.5 Export CSV

Séparateur `;` et BOM UTF-8, pour qu'Excel français l'ouvre au double-clic
sans assistant d'importation.

**Les cellules commençant par `=`, `+`, `-` ou `@` sont neutralisées** par une
apostrophe en tête. Nom, adresse et options viennent des métadonnées Stripe,
c'est-à-dire de ce que le client a saisi : sans cela, un champ
`=HYPERLINK(…)` s'exécuterait à l'ouverture du fichier sur le poste de
l'opérateur. Effet de bord assumé : les numéros de téléphone, qui commencent
par `+`, portent la même apostrophe — invisible dans le tableur, et c'est bien
en texte qu'on veut les lire.

## 4. Pièges rencontrés pendant la construction

Les quatre suivants ont coûté du temps et n'étaient pas prévisibles à la
lecture du cahier des charges.

### `export const dynamic = "force-dynamic"` n'est pas facultatif

Sans lui, `next build` **fige `/admin` et `/admin/connexion` en statique**. Au
moment du build, `ADMIN_PASSWORD` n'est pas dans l'environnement :
`hasAdminSession()` répond « non » sans jamais lire de cookie, la liste part
donc en redirection et la connexion affiche « non configurée ». Ce sont ces
deux réponses-là qui partent au CDN, et l'administration devient
**définitivement inaccessible** — renseigner les variables ensuite ne change
rien, puisque la page n'est plus exécutée.

### `mysql2` dans le paquet du navigateur

Voir §3.3. Le symptôme est `Module not found: Can't resolve 'tls'`, et la
trace d'import désigne le composant client fautif. La règle : un composant
client n'importe **jamais** `@/lib/orders` — même pour un type, si l'import
n'est pas un `import type` isolé.

### `setState` dans un effet

`react-hooks/set-state-in-effect` refuse `useEffect(() => setSelected([]), [rows])`.
Le motif correct est l'ajustement **pendant le rendu**, avec mémorisation de la
prop précédente. Il est employé deux fois, dans `orders-table.tsx` et
`orders-filters.tsx`.

### Un retour anticipé avale la confirmation

Un lot fait souvent sortir ses lignes du filtre courant — passer trois
commandes en « Expédiée » depuis une liste filtrée sur « En fabrication » la
vide entièrement. Le `return` anticipé « aucune commande » masquait alors le
message de l'action : le tableau se vidait sans que l'opérateur sache si son
changement était passé.

## 5. Contraintes techniques respectées

- **La réserve de connexions s'ouvre à la première requête, jamais à
  l'import** : `next build` exécute les modules sans base à disposition.
- **`overflow-x-clip`, jamais `overflow-hidden`** sur un conteneur de page —
  ce dernier neutralise tout `position: sticky` en dessous, et la barre
  d'actions en lot en dépend. Vérifié : l'en-tête reste à `top: 0` à toutes
  les hauteurs de défilement.
- **Pas de `toLocaleString` ni de `new Date()` dans une valeur rendue.** Les
  horodatages sont convertis en heure de Paris par un calcul explicite de la
  règle d'heure d'été européenne (`lib/format.ts`), vérifié conforme à `Intl`
  sur douze cas dont les deux bascules, l'heure ambiguë et le 29 février.
  Toutes les valeurs du tableau sont formatées **côté serveur** et traversent
  la frontière déjà écrites.
- **`reference` reste la clé d'idempotence.** Aucun chemin de l'administration
  ne l'écrit ni ne la modifie.

## 6. Variables d'environnement

```
ADMIN_PASSWORD=          # mot de passe de l'espace — openssl rand -base64 24
ADMIN_SESSION_SECRET=    # signature du cookie de session — openssl rand -hex 32
```

Variables serveur : un redémarrage suffit, pas de reconstruction. Sans elles,
la page de connexion l'annonce et refuse toute tentative — une variable
oubliée ne doit pas se traduire par une administration ouverte.

## 7. Ce qui reste ouvert

- **`balanceDue` est affiché brut**, sans mise en forme. Le webhook le recopie
  d'une métadonnée Stripe, mais **aucun chemin du code ne l'écrit** : ni
  `app/api/checkout/route.ts`, ni `app/api/payment-intent/route.ts`. Son
  format n'étant défini nulle part, le lire comme des centimes serait une
  convention inventée que le premier producteur réel contredirait. À trancher
  le jour où la location écrit vraiment un solde.
- **Un seul opérateur.** Le journal enregistre *quoi* et *quand*, pas *qui* :
  avec un mot de passe unique, la question ne se pose pas. Le jour où il y a
  deux comptes, ajouter une colonne `actor` à `order_events` et remplacer
  `lib/admin-session.ts` — les appelants ne connaissent que `requireAdmin`.
- **La limitation de débit vit en mémoire.** Suffisant sur l'hébergement Node
  d'Hostinger, qui fait tourner un seul processus. Voir l'avertissement de
  `lib/rate-limit.ts` pour ce qu'elle ne garantit pas ailleurs.

## 8. Rappel de déploiement

L'hébergement est **Hostinger**, pas Vercel. Le déploiement passe par une
archive des fichiers suivis, construite **sur le serveur** :

```bash
git archive --format=tar.gz -o /tmp/atmos-source.tar.gz HEAD
# puis hosting_deployJsApplication, et purge du cache
```

**Purger le cache après chaque déploiement** : les pages statiques sont
servies par le CDN pendant des heures, en-têtes compris. Les pages de `/admin`
ne sont jamais mises en cache (§4), mais le reste du site l'est.
