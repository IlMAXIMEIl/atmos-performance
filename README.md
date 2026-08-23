# ATMOS ONE

Site de lancement du générateur d'altitude hypoxique ATMOS ONE : page produit,
blog, glossaire, simulateur d'altitude, et capture de la liste d'attente.

Next.js 16 (App Router), React 19, Tailwind CSS 4.

## Développement

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

Le site tourne sur http://localhost:3000.

## Variables d'environnement

Toutes sont décrites dans [`.env.example`](.env.example). En résumé :

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `BREVO_API_KEY` | Création des contacts de la liste d'attente | oui |
| `BREVO_LIST_ID` | Liste Brevo du Drop n°1 (identifiant numérique) | oui |
| `BREVO_LOCATION_LIST_ID` | Liste séparée pour les demandes de location | non |
| `STRIPE_SECRET_KEY` | Tunnel de paiement | à l'ouverture des ventes |
| `STRIPE_WEBHOOK_SECRET` | Vérification de signature du webhook | à l'ouverture des ventes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payment Element du tunnel d'achat intégré | à l'ouverture des ventes |
| `DB_HOST` `DB_USER` `DB_PASSWORD` `DB_NAME` | Base MySQL des commandes — **à préférer** à `DATABASE_URL` : aucun caractère à échapper | à l'ouverture des ventes |
| `DATABASE_URL` | Même chose en une seule chaîne, si le mot de passe ne contient ni `#` `?` `/` `@` | alternative |
| `DIAGNOSTIC_TOKEN` | Protège `GET /api/health/db` (nombre de commandes) | recommandé |
| `ADMIN_PASSWORD` | Mot de passe de l'espace d'administration `/admin` | à l'ouverture des ventes |
| `ADMIN_SESSION_SECRET` | Signature du cookie de session de `/admin` | à l'ouverture des ventes |
| `NEXT_PUBLIC_SITE_URL` | Origine publique (URL de retour Stripe, données structurées) | oui en production |

Seules les variables préfixées `NEXT_PUBLIC_` sont exposées au navigateur — l'URL du site et la clé **publiable** de Stripe, qui est faite pour ça. Les autres sont des
secrets serveur : jamais de préfixe `NEXT_PUBLIC_`, jamais dans le dépôt.

## Déploiement (Hostinger « Web Apps », runtime Node)

Le projet est bâti en `output: "standalone"` : le build produit un serveur
autonome dans `.next/standalone`, sans `node_modules` à réinstaller.

```bash
npm ci
npm run build
npm start
```

Rien d'autre à faire : `npm run build` enchaîne `next build` puis la copie de
`public/` et `.next/static/` dans le dossier standalone — deux dossiers que le
build n'y place pas de lui-même, et sans lesquels le site se charge sans
styles, sans polices et sans images.

`npm start` lance `node .next/standalone/server.js`, le seul point d'entrée
valable ici : `next start` ne fonctionne pas avec `output: "standalone"` et
Next le signale explicitement. Le port et l'interface se règlent par
l'environnement (`PORT`, `HOSTNAME`).

### Construire sur le serveur, pas en local

`sharp`, qu'utilise l'optimisation d'images, est une dépendance **native** :
son binaire est compilé pour un couple OS/architecture donné. Un build fait
sur un Mac puis téléversé plante sur le Linux d'Hostinger. Lancer `npm ci &&
npm run build` dans l'environnement cible (ou une CI Linux) règle la question.

### Les variables d'environnement se déclarent côté hébergeur

Le serveur standalone lit ses fichiers `.env` **dans son propre dossier**, pas
à la racine du projet : téléverser un `.env.local` ne suffit pas. Les valeurs
doivent être fournies par l'environnement réel — le panneau d'Hostinger — ou
par un `.env` déposé à côté de `server.js`.

## Ouverture des ventes

`ORDERS_OPEN` et `LEASING_OPEN` dans [`lib/offering.ts`](lib/offering.ts)
pilotent l'ouverture commerciale, côté page comme côté API. Tant que
`ORDERS_OPEN` vaut `false`, `/api/checkout` refuse toute session de paiement et
le webhook Stripe accuse réception sans rien enregistrer.

Les commandes sont enregistrées en **MySQL** par
[`lib/orders.ts`](lib/orders.ts), sur la base incluse dans l'hébergement.
L'application tourne sur le même serveur : l'hôte est `localhost`, sans
traversée de réseau ni démarrage à froid. Le schéma est créé au premier
enregistrement (`CREATE TABLE IF NOT EXISTS`), il n'y a pas de migration à
lancer au déploiement.

**Deux chemins écrivent la commande**, indépendants l'un de l'autre : le
webhook Stripe, et la page de confirmation qui relit l'intention côté serveur.
Le webhook seul ne suffit pas — mal configuré, Stripe ne livre rien du tout :
ni réessai, ni journal, ni ligne. L'inverse est vrai aussi, un client qui ferme
son onglet ne verra jamais la page de confirmation.

L'idempotence porte sur la **référence du paiement** (`pi_…` ou `cs_…`), pas
sur l'identifiant de l'événement : les deux chemins doivent converger sur la
même ligne, et Stripe émet plusieurs événements pour un même paiement. C'est
la contrainte d'unicité de la base qui tranche, jamais une relecture
applicative — entre un `SELECT` et un `INSERT`, deux écritures simultanées
passeraient toutes les deux.

`GET /api/health/db` répond `{ ok, orders }` — jeton en en-tête
`x-diagnostic-token` — : de quoi vérifier en une commande que la base répond et
que les commandes arrivent.

**Stripe reste la source de vérité.** Cette table en est une copie
interrogeable ; la perdre ne perd aucune commande.

## Espace d'administration

`/admin` sert au **traitement** des commandes : liste paginée, recherche,
filtres, statut, fiche client, actions en lot et export CSV. Il est protégé par
`ADMIN_PASSWORD` et un cookie de session signé par `ADMIN_SESSION_SECRET` —
deux variables serveur, un redémarrage suffit à les prendre en compte. Sans
elles, la page de connexion l'annonce et refuse toute tentative.

Le **tableau de bord financier, c'est Stripe** : chiffre d'affaires,
remboursements, litiges et exports comptables n'y sont volontairement pas
dupliqués. Chaque fiche porte un lien direct vers le paiement correspondant.

Le périmètre, les décisions et les pièges rencontrés sont dans
[`docs/admin-commandes.md`](docs/admin-commandes.md) — à lire avant d'y
toucher, en particulier le `export const dynamic = "force-dynamic"` sans lequel
`next build` fige l'espace en statique et le rend inaccessible.

Les colonnes `status`, `tracking_number`, `internal_note` et la table
`order_events` sont créées par des migrations idempotentes à la première
requête : il n'y a rien à lancer au déploiement.
