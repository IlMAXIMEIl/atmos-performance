# ATMOS PERFORMANCE - Structure du Site

## Positionnement & Brand
- Marque : ATMOS PERFORMANCE (atmos-performance.com)
- Produit phare : **ATMOS ONE**, générateur d'altitude hypoxique. Il abaisse la fraction d'oxygène de 20,9 % à 9 %, soit 0 à 6 500 m simulés (21 330 ft). Usage : performance sportive, VO2max, acclimatation.
- Specs constructeur (valeurs réelles, reprises dans la fiche technique de la section Produit) : débit 100 L/min, sonore ≤ 50 dB, consommation ≤ 550 W, poids 27 kg, dimensions 365 × 375 × 600 mm, alarmes coupure d'alimentation et pression haute / basse, options oxymètre de pouls et système de monitoring.
- **L'appareil ne fait que de l'hypoxie.** Ne jamais le présenter comme un générateur d'hyperoxie ni comme un caisson hyperbare.
- Produit à venir, distinct : **ATMOS Chamber**, caisson de régénération hyperbare. Mentionné uniquement en teaser en bas de la section Offres.
- Style : Premium, scientifique, minimaliste (type Apple / Rolex / Canyon).
- Offre : Pré-ventes avec option d'Achat direct et Leasing (Location).

## Arborescence du Site
Toutes les sections sont construites. Une section = un composant dans `components/`, assemblé dans `app/page.tsx`.

1. Header : Logo ATMOS, Liens (Produit, Protocoles, Offres), Bouton Pill 'Précommander'. — `app/page.tsx`
2. Hero Section. — `app/page.tsx`
3. Section Produit : photo du générateur (`public/generator.png`) et pilules interactives. — `product-section.tsx`
4. Section Protocoles d'Altitude : Mode Sommeil / tente d'altitude (Live High, 2 000–3 500 m) et Mode Entraînement sous masque (Train High / IHT, 4 000–6 000 m), situés sur un axe d'altitude 0–6 500 m. Ces deux plages sont des recommandations de protocole, pas des limites de l'appareil. — `protocols-section.tsx`
5. Section Science : Chiffres clés et réassurance (études, fer, adaptation). — `science-section.tsx`
6. Section Offres : Toggle interactif Achat vs Location, puis teaser ATMOS Chamber. — `offers-section.tsx`. Les deux CTA ouvrent la modale — `reservation-modal.tsx` — qui redirige vers Stripe Checkout via `app/api/checkout/route.ts`, puis retombe sur `/reservation/confirmee`.
   - **Achat ferme** : 1 890 € l'unité. Étapes : configuration (quantité 1 à 5 + options), coordonnées, paiement. Acompte de **300 € par unité** encaissé en ligne ; solde (1 590 € par unité) réglé avant expédition.
   - **Location** : 350 €/mois, 1 mois minimum. Étapes : date de début, coordonnées, paiement. Encaissement du 1er mois **+ 39 € d'expédition = 389 €**, et **empreinte bancaire** conservée pour la caution (aucun débit à ce titre). Mention obligatoire sous le bouton : 100 % des loyers versés sont déduits en cas d'achat.
   - La durée de location est verrouillée à 30 jours : la date de fin est **recalculée par le serveur**, jamais reprise du navigateur. Idem pour tous les montants.
   - L'empreinte bancaire passe par `setup_future_usage: "off_session"` sur la session Checkout (plus `customer_creation: "always"`), et non par un SetupIntent séparé : Stripe n'autorise pas un paiement et un SetupIntent dans une même session.
   - Les options (oxymètre, monitoring) sont enregistrées en métadonnées mais **non tarifées** : elles ne modifient pas le montant encaissé.
7. Footer : Mentions légales, contact@atmos-performance.com, Instagram (@atmos_performance), Youtube (@atmos_performance), Tiktok (@atmos_performance). — `site-footer.tsx`

Page annexe : `/mentions-legales` — `app/mentions-legales/page.tsx`.

## À compléter avant publication
- Les specs du générateur et les prix (1 890 € à l'achat, 350 €/mois + 39 € d'expédition en location, acompte 300 €) sont des valeurs réelles. Restent des valeurs de remplissage : chiffres de la section Science, date de livraison, taille de la vague #1.
- Le montant de la caution de location n'est pas défini : seule l'empreinte est prise. Il faudra le fixer avant tout prélèvement hors session.
- Les options d'équipement ne sont pas tarifées.
- Champs `[À COMPLÉTER]` de la page mentions légales (identité de l'éditeur, hébergeur).
- Clés Stripe : copier `.env.example` en `.env.local` et renseigner `STRIPE_SECRET_KEY`. **Vérifié en mode test : les deux tunnels créent bien leur session Checkout.** Une clé absente ou refusée donne le même message côté visiteur (« Le paiement n'est pas encore configuré sur ce site »).
- Une clé secrète Stripe valide ne contient que deux tirets bas (`sk_test_` puis une seule chaîne). Trois épisodes de gabarit résiduel ont été perdus sur ce point.
- Webhook branché : `app/api/webhooks/stripe/route.ts` écoute `checkout.session.completed`, vérifie la signature sur le corps brut et enregistre la commande via `lib/orders.ts`. Idempotent sur l'identifiant d'événement. Nécessite `STRIPE_WEBHOOK_SECRET`.
- **Le stockage est un fichier JSONL local (`.data/orders.jsonl`, gitignoré).** Il ne survit pas à un déploiement sans disque persistant (Vercel, Netlify) : à remplacer par une base ou un envoi d'email avant la mise en production. Seules `recordOrder` et `listOrders` sont à réécrire.
- Aucun email de confirmation n'est envoyé ; la page `/reservation/confirmee` reste déclarative.
- L'empreinte carte de la location n'est observable qu'après un paiement réel : Stripe ne crée le PaymentIntent qu'au moment où le client règle.
- Icônes de marque du footer (Instagram, YouTube, TikTok) : redessinées à la main, à remplacer par les marques officielles.

## Instructions pour l'IA
- Travailler section par section.
- Utiliser Tailwind CSS, Framer Motion et Lucide-React.
- Conserver le thème sombre (#0B0C10) sur tout le site.
- Variants d'animation partagés dans `lib/motion.ts` : réutiliser `EASE`, `container` et `rise` plutôt que de les redéclarer.
- Cette version de `lucide-react` ne fournit aucune icône de marque (`Instagram`, `Youtube`… sont absents) : vérifier qu'une icône existe avant de l'importer.
- Ne pas calculer de valeurs de rendu avec `Math.cos`/`Math.sin` ni `new Date()` : les écarts serveur / client provoquent des erreurs d'hydratation. Pré-calculer et arrondir.
