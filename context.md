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
6. Section Offres : Toggle interactif Achat vs Leasing, puis teaser ATMOS Chamber. — `offers-section.tsx`
7. Footer : Mentions légales, contact@atmos-performance.com, Instagram (@atmos_performance), Youtube (@atmos_performance), Tiktok (@atmos_performance). — `site-footer.tsx`

Page annexe : `/mentions-legales` — `app/mentions-legales/page.tsx`.

## À compléter avant publication
- Les specs du générateur sont désormais les valeurs constructeur réelles. Restent des valeurs de remplissage : prix Achat et Leasing, chiffres de la section Science, date de livraison, taille de la vague #1.
- Champs `[À COMPLÉTER]` de la page mentions légales (identité de l'éditeur, hébergeur).
- CTA de la section Offres : pointe sur un `mailto:` en attendant un vrai formulaire de pré-réservation.
- Icônes de marque du footer (Instagram, YouTube, TikTok) : redessinées à la main, à remplacer par les marques officielles.

## Instructions pour l'IA
- Travailler section par section.
- Utiliser Tailwind CSS, Framer Motion et Lucide-React.
- Conserver le thème sombre (#0B0C10) sur tout le site.
- Variants d'animation partagés dans `lib/motion.ts` : réutiliser `EASE`, `container` et `rise` plutôt que de les redéclarer.
- Cette version de `lucide-react` ne fournit aucune icône de marque (`Instagram`, `Youtube`… sont absents) : vérifier qu'une icône existe avant de l'importer.
- Ne pas calculer de valeurs de rendu avec `Math.cos`/`Math.sin` ni `new Date()` : les écarts serveur / client provoquent des erreurs d'hydratation. Pré-calculer et arrondir.
