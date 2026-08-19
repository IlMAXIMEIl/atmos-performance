/**
 * Injection d'un graphe Schema.org dans le HTML servi.
 *
 * Composant serveur sans état : il ne rend qu'une balise `<script>`. Le
 * rendre depuis un composant client fonctionne tout autant — Next rend aussi
 * les composants clients côté serveur, le script part donc bien dans le HTML
 * initial, celui que lisent les robots.
 */

/** Ce que `JSON.stringify` accepte de nos constructeurs de schémas. */
type Schema = Record<string, unknown>;

/**
 * Neutralise le seul caractère capable de refermer la balise depuis
 * l'intérieur. `<` reste une échappement JSON parfaitement valide : le
 * parseur du robot le relit comme un « < », le navigateur ne voit plus de
 * `</script>`.
 */
function serialize(data: Schema | Schema[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: Schema | Schema[] }) {
  return (
    <script
      type="application/ld+json"
      // Contenu maîtrisé, sérialisé depuis nos propres constantes.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
