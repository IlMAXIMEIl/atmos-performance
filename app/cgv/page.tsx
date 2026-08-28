import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/cgv`;
const DESCRIPTION =
  "Conditions générales de vente d'ATMOS PERFORMANCE : commande, paiement, livraison, droit de rétractation, garanties légales et service après-vente.";

export const metadata: Metadata = {
  title: "Conditions générales de vente — ATMOS PERFORMANCE",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Conditions générales de vente — ATMOS PERFORMANCE",
    description: DESCRIPTION,
  },
};

/**
 * Date de la version en vigueur.
 *
 * Figée volontairement, comme l'année du pied de page : `new Date()` diffère
 * entre le rendu serveur et le rendu client et casserait l'hydratation. À
 * remettre à jour à chaque modification de fond, la version opposable étant
 * celle acceptée par l'acheteur au moment de sa commande.
 */
const VERSION_DATE = "28 août 2026";

type Article = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  /** Rendu en retrait discret : précisions, renvois, formulaire type. */
  note?: string;
};

/**
 * Base de conditions générales de vente.
 *
 * Deux règles ont gouverné la rédaction :
 *
 * 1. **Aucune donnée d'identité inventée.** L'identité du vendeur vient de
 *    l'extrait RNE du 20/08/2026 (INPI). Un seul champ reste entre crochets :
 *    le médiateur de la consommation, à renseigner dès l'adhésion effective —
 *    elle est obligatoire avant l'ouverture des ventes (art. L.612-1 c. conso).
 * 2. **Aucune clause qui serait réputée non écrite.** Une clause abusive ne
 *    protège pas le vendeur : elle tombe, et elle fragilise le reste du
 *    document. Là où une formulation courante du e-commerce serait inopposable
 *    en B2C — décharge de responsabilité faute de réserves à la livraison,
 *    garantie légale subordonnée à un entretien, retour refusé sans emballage
 *    d'origine — le texte retient la version qui produit le même effet pratique
 *    tout en restant valide.
 *
 * Ce document reste une base : il doit être relu par un professionnel du droit
 * avant l'ouverture des ventes.
 */
const ARTICLES: Article[] = [
  {
    title: "Article 1 — Objet et champ d'application",
    paragraphs: [
      "Les présentes conditions générales de vente régissent l'ensemble des ventes conclues à distance sur le site atmos-performance.com entre le vendeur identifié à l'article 2 et tout acheteur agissant en qualité de consommateur au sens du code de la consommation.",
      "Toute commande implique l'acceptation sans réserve des présentes conditions, portées à la connaissance de l'acheteur avant la validation de sa commande. La version applicable est celle en vigueur à la date de la commande.",
      "Les ventes conclues avec un acheteur professionnel relèvent de conditions distinctes, communiquées sur demande.",
    ],
  },
  {
    title: "Article 2 — Identification du vendeur",
    list: [
      "Vendeur : Maxime Roussel, entrepreneur individuel, exerçant sous le nom commercial Atmos-performance",
      "Siège : 17 rue Joseph Lebas, Appt 19, 76140 Le Petit-Quevilly, France",
      "SIREN : 981 974 470 (RNE) — SIRET : 981 974 470 00024",
      "TVA non applicable, article 293 B du CGI",
      `Contact : ${CONTACT_EMAIL}`,
      "Téléphone : 06 16 96 81 80",
    ],
  },
  {
    title: "Article 3 — Produits",
    paragraphs: [
      "Les caractéristiques essentielles des produits sont présentées sur les pages produits du site. Les photographies et illustrations n'ont pas de valeur contractuelle et ne sauraient engager le vendeur.",
      "Les produits sont proposés dans la limite des stocks disponibles. Certaines séries sont éditées en quantité limitée, annoncée sur la fiche produit ; l'épuisement d'une série ne donne lieu à aucune indemnité.",
      "ATMOS ONE est un générateur d'hypoxie normobare destiné à l'entraînement sportif et à l'acclimatation. Il ne constitue pas un dispositif médical et n'est proposé à aucune fin diagnostique ou thérapeutique.",
    ],
  },
  {
    title: "Article 4 — Prix",
    paragraphs: [
      "Les prix sont indiqués en euros, nets de taxe — TVA non applicable, article 293 B du CGI —, hors éventuels frais de livraison précisés avant la validation de la commande. Le prix affiché est le prix payé : aucune taxe ne s'y ajoute.",
      "Les droits de douane et taxes d'importation afférents à l'acheminement du produit sont pris en charge par le vendeur, l'expédition étant réalisée en régime DDP (Delivered Duty Paid). Aucune somme n'est due par l'acheteur au transporteur à la réception.",
      "Le vendeur se réserve le droit de modifier ses prix à tout moment. Les produits sont facturés sur la base du tarif en vigueur au moment de l'enregistrement de la commande.",
    ],
  },
  {
    title: "Article 5 — Commande",
    paragraphs: [
      "L'acheteur sélectionne les produits, vérifie le détail de sa commande et son prix total, corrige le cas échéant les erreurs, puis confirme sa commande et procède au paiement. Cette double validation constitue la signature électronique de la commande.",
      "La vente n'est définitivement formée qu'après confirmation de la commande par le vendeur et encaissement effectif du paiement. Un courriel de confirmation récapitulant la commande est adressé à l'acheteur.",
      "Le vendeur se réserve le droit de refuser ou d'annuler toute commande présentant un motif légitime, notamment en cas de litige antérieur, de commande anormale ou de défaut de paiement.",
    ],
  },
  {
    title: "Article 6 — Paiement",
    paragraphs: [
      "Le paiement s'effectue en ligne par carte bancaire via un prestataire de paiement sécurisé. Le vendeur n'a accès à aucune donnée de carte bancaire.",
      "Un paiement fractionné peut être proposé, aux conditions de l'établissement partenaire indiquées avant validation de la commande. Le recours au paiement fractionné ne modifie ni les garanties, ni le droit de rétractation.",
      "Les produits demeurent la propriété du vendeur jusqu'au paiement intégral du prix. Ce transfert de propriété différé est sans effet sur le transfert des risques, régi par l'article 7.",
    ],
  },
  {
    title:
      "Article 7 — Livraison, transfert des risques et vérification du colis",
    paragraphs: [
      "Les produits sont livrés à l'adresse indiquée par l'acheteur lors de la commande. Le délai de livraison est communiqué avant la validation de la commande ; à défaut d'indication, la livraison intervient au plus tard trente jours après la conclusion du contrat.",
      "Les risques de perte ou d'endommagement des produits sont transférés à l'acheteur au moment où celui-ci, ou un tiers désigné par lui, prend physiquement possession du produit. Jusqu'à cette prise de possession, ils sont supportés par le vendeur.",
      "L'acheteur est vivement invité à examiner le colis en présence du transporteur et à émettre, le cas échéant, des réserves précises et détaillées sur le bon de livraison : la seule mention « sous réserve de déballage » est sans portée. Un colis manifestement endommagé peut être refusé.",
      "Ces réserves ne conditionnent pas les droits de l'acheteur : leur absence ne le prive ni de la garantie légale de conformité, ni du recours contre le vendeur en cas de produit endommagé. Elles constituent en revanche le moyen le plus efficace d'établir le dommage et d'accélérer son traitement. Toute anomalie constatée après déballage doit être signalée au vendeur dans les meilleurs délais, photographies à l'appui.",
    ],
  },
  {
    title: "Article 8 — Droit de rétractation",
    paragraphs: [
      "Conformément à l'article L.221-18 du code de la consommation, l'acheteur dispose d'un délai de quatorze jours à compter de la réception du produit pour exercer son droit de rétractation, sans avoir à motiver sa décision ni à supporter de pénalité.",
      "Pour exercer ce droit, l'acheteur notifie sa décision par une déclaration dénuée d'ambiguïté, adressée par courriel à l'adresse de contact ou au moyen du formulaire type reproduit ci-dessous. Le vendeur en accuse réception sans délai.",
      "Le produit doit être renvoyé au plus tard quatorze jours après la notification, complet et accompagné de l'ensemble de ses accessoires.",
      "Les frais de renvoi sont à la charge exclusive de l'acheteur. Compte tenu de la valeur et de la nature du produit, le retour doit être confié à un transporteur assurant le suivi et l'assurance de l'envoi ; le coût correspondant reste à la charge de l'acheteur. Cette information lui est communiquée avant la conclusion du contrat, conformément à l'article L.221-5 du code de la consommation.",
      "L'acheteur est invité à conserver l'emballage d'origine, seul conditionnement conçu pour le transport de l'appareil. La responsabilité de l'acheteur peut être engagée à hauteur de la dépréciation du produit résultant de manipulations autres que celles nécessaires pour en établir la nature, les caractéristiques et le bon fonctionnement.",
      "Le remboursement intervient au plus tard quatorze jours à compter de la récupération du produit ou de la fourniture d'une preuve de son expédition, par le même moyen de paiement que celui utilisé lors de la commande.",
    ],
    note: `Formulaire type de rétractation — À l'attention de Maxime Roussel (Atmos-performance), 17 rue Joseph Lebas, Appt 19, 76140 Le Petit-Quevilly, ${CONTACT_EMAIL} : Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous — Commandé le [date] / reçu le [date] — Nom et adresse du consommateur — Signature (uniquement en cas de notification sur papier) — Date.`,
  },
  {
    title: "Article 9 — Exceptions au droit de rétractation",
    paragraphs: [
      "Le droit de rétractation ne peut être exercé pour les biens descellés par l'acheteur après la livraison et qui ne peuvent être renvoyés pour des raisons d'hygiène ou de protection de la santé, conformément à l'article L.221-28 5° du code de la consommation. Cette exception vise le masque et le circuit respiratoire lorsqu'ils ont été descellés ; elle ne s'étend ni au générateur, ni à la station de contrôle, dont la rétractation demeure entière.",
    ],
  },
  {
    title: "Article 10 — Garantie légale de conformité",
    paragraphs: [
      "Le vendeur livre un bien conforme au contrat et répond des défauts de conformité existant lors de la délivrance, dans les conditions des articles L.217-3 et suivants du code de la consommation.",
      "L'acheteur dispose d'un délai de deux ans à compter de la délivrance du bien pour agir. Pendant ce délai, il n'est tenu d'établir que l'existence du défaut de conformité, et non la date de son apparition : les défauts qui apparaissent dans ce délai sont présumés exister au moment de la délivrance.",
      "L'acheteur peut demander la mise en conformité du bien par réparation ou remplacement, sans frais de pièces, de main-d'œuvre ni de renvoi. À défaut, il peut obtenir une réduction du prix ou la résolution de la vente dans les conditions prévues par la loi.",
      "Les frais de retour d'un produit renvoyé au titre de la garantie légale sont pris en charge par le vendeur. Ils ne se confondent pas avec ceux du droit de rétractation prévu à l'article 8, qui restent à la charge de l'acheteur : dans un cas le produit est défectueux et la loi met le renvoi à la charge du vendeur, dans l'autre l'acheteur change d'avis sur un produit conforme.",
      "La garantie légale de conformité s'applique indépendamment de toute garantie commerciale et ne peut être ni écartée, ni restreinte par une clause contractuelle. Aucune garantie commerciale n'est proposée à ce jour ; si une extension payante venait à l'être, elle s'ajouterait à la garantie légale sans jamais s'y substituer.",
      "Elle ne s'étend pas aux dommages qui ne résultent pas d'un défaut de conformité, c'est-à-dire à ceux ayant une cause extérieure au bien : usure normale des consommables, remplacement des filtres non effectué aux intervalles indiqués dans la notice, exploitation dans un environnement poussiéreux, humide ou non conforme aux conditions d'utilisation documentées, chute, choc, immersion, modification ou ouverture de l'appareil, ou intervention d'un tiers non autorisé.",
    ],
  },
  {
    title: "Article 11 — Garantie légale des vices cachés",
    paragraphs: [
      "Indépendamment de la garantie légale de conformité, l'acheteur peut se prévaloir de la garantie des vices cachés au sens des articles 1641 et suivants du code civil, pendant deux ans à compter de la découverte du vice. Il peut alors choisir entre la résolution de la vente et une réduction du prix.",
    ],
  },
  {
    title: "Article 12 — Service après-vente et entretien",
    paragraphs: [
      "Le service après-vente est assuré depuis la France. Toute demande est adressée à l'adresse de contact ; un diagnostic à distance est réalisé en premier lieu et les pièces de rechange sont expédiées depuis le stock du vendeur.",
      "L'appareil filtre l'air en continu : le remplacement des filtres aux intervalles indiqués dans la notice conditionne son fonctionnement et sa longévité. Le vendeur informe l'acheteur des échéances de remplacement. Le défaut d'entretien n'affecte pas l'existence des garanties légales, mais une panne qui en résulte ne constitue pas un défaut de conformité au sens de l'article 10.",
      "Les pièces d'usure (filtres, circuit respiratoire) sont proposées sur le site aussi longtemps que le produit est commercialisé. Le fabricant n'ayant pas communiqué d'engagement de durée sur la disponibilité des autres pièces détachées, cette information ne peut être fournie ; elle sera publiée ici si elle venait à l'être.",
    ],
  },
  {
    title: "Article 13 — Conditions d'utilisation et responsabilité",
    paragraphs: [
      "L'exposition à l'hypoxie s'effectue sous la responsabilité de l'utilisateur, dans le respect de la notice et des consignes de sécurité fournies. Les protocoles, simulateurs et contenus publiés sur le site sont donnés à titre indicatif et ne constituent pas un avis médical.",
      "Un avis médical préalable est nécessaire en cas de pathologie cardiaque ou respiratoire, d'anémie, d'hypertension non contrôlée, de grossesse, ou de tout traitement en cours. L'usage de l'appareil requiert un suivi de la saturation en oxygène par oxymètre de pouls.",
      "La responsabilité du vendeur ne saurait être engagée en cas d'usage non conforme à la notice, de modification de l'appareil, ou d'inobservation des consignes de sécurité. Aucune stipulation des présentes ne limite la responsabilité du vendeur en cas de dommage corporel ou de faute lourde ou dolosive.",
    ],
  },
  {
    title: "Article 14 — Données personnelles",
    paragraphs: [
      "Les données collectées lors de la commande sont nécessaires à son traitement, à la facturation, à la livraison et au suivi de la relation client. Elles ne font l'objet d'aucune cession à des tiers à des fins commerciales.",
      "Conformément au règlement général sur la protection des données, l'acheteur dispose d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, qu'il exerce à l'adresse de contact. Il peut également introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés.",
      "Le responsable du traitement est Maxime Roussel, entrepreneur individuel (Atmos-performance). Les durées de conservation, la liste des sous-traitants et la procédure de suppression des données sont détaillées dans la politique de confidentialité, accessible à l'adresse atmos-performance.com/confidentialite et depuis chaque page du site.",
    ],
  },
  {
    title: "Article 15 — Réclamations, médiation et litiges",
    paragraphs: [
      "Toute réclamation est adressée en premier lieu au vendeur, à l'adresse de contact indiquée à l'article 2.",
      "Conformément aux articles L.612-1 et suivants du code de la consommation, l'acheteur qui n'obtient pas satisfaction peut recourir gratuitement au médiateur de la consommation dont relève le vendeur : [médiateur en cours de désignation — dénomination et coordonnées publiées ici dès l'adhésion effective, avant l'ouverture des ventes]. La saisine du médiateur suppose une réclamation écrite préalable auprès du vendeur.",
      "La Commission européenne met par ailleurs à disposition une plateforme de règlement en ligne des litiges, accessible aux consommateurs de l'Union européenne.",
      "Les présentes conditions sont soumises au droit français. À défaut de résolution amiable, le litige est porté devant la juridiction compétente conformément aux règles de droit commun ; l'acheteur consommateur conserve la faculté de saisir la juridiction du lieu de son domicile.",
    ],
  },
  {
    title: "Article 16 — Dispositions générales",
    paragraphs: [
      "Si l'une des stipulations des présentes conditions venait à être déclarée nulle ou inapplicable, les autres stipulations conserveraient leur pleine valeur.",
      "Le fait pour le vendeur de ne pas se prévaloir d'un manquement de l'acheteur à l'une de ses obligations ne saurait valoir renonciation à s'en prévaloir ultérieurement.",
    ],
  },
];

export default function CgvPage() {
  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 sm:py-28 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <h1 className="mt-10 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          <span className="text-ink">
            Conditions générales de vente
          </span>
        </h1>

        <p className="mt-6 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
          {`Version en vigueur au ${VERSION_DATE}. La version opposable est celle acceptée par l'acheteur au moment de sa commande.`}
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {ARTICLES.map((article) => (
            <section key={article.title}>
              <h2 className="font-mono text-[0.68rem] tracking-[0.24em] text-accent uppercase">
                {article.title}
              </h2>

              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {article.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}

                {article.list && (
                  <ul className="flex flex-col gap-2.5">
                    {article.list.map((line) => (
                      <li
                        key={line}
                        className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                {article.note && (
                  <p className="mt-3 rounded-2xl border border-line bg-white/[0.02] p-5 text-[0.82rem] leading-relaxed font-light text-dimmer text-pretty">
                    {article.note}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-line pt-8 text-[0.82rem] leading-relaxed font-light text-dimmer text-pretty">
          Voir également nos{" "}
          <Link
            href="/mentions-legales"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            mentions légales
          </Link>{" "}
          et notre{" "}
          <Link
            href="/confidentialite"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
