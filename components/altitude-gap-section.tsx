import { Eyebrow } from "@/components/ui/eyebrow";
import { MAX_ALTITUDE, formatNumber } from "@/lib/altitude";

/**
 * L'écart de naissance : la section qui transforme l'envie en besoin.
 *
 * Le visiteur qui sort du hero sait ce que fait l'appareil. Cette section
 * lui dit pourquoi c'est vital : les athlètes qui dominent son sport n'ont
 * pas *acheté* l'altitude — ils y sont nés, ou leur équipe la leur impose
 * chaque saison. Lui s'entraîne aussi sérieusement qu'eux, puis dort au
 * niveau de la mer. On ne vend pas un perfectionnement, on rend une arme
 * que l'élite possède déjà. La formulation reste factuelle et digne : la
 * maison ne vend pas par la peur, elle montre un écart réel et documenté.
 *
 * **Des lieux, jamais des noms ni des visages.** Utiliser la photographie
 * ou le nom d'un athlète identifiable pour vendre suppose un contrat
 * d'image — sans lui, c'est une association commerciale mensongère et un
 * risque juridique réel. Iten, Bekoji ou la Sierra Nevada disent la même
 * chose sans faire endosser le produit à personne, et un lieu chiffré se
 * lit comme un relevé : c'est la langue du site.
 *
 * Les altitudes sont réelles et vérifiables : Iten ≈ 2 400 m, Bekoji
 * ≈ 2 800 m, le centre d'altitude de Sierra Nevada ≈ 2 320 m — la même
 * plage que les protocoles défendus plus bas, ce qui n'est pas un hasard.
 */
const PLACES = [
  {
    value: "Iten, Kenya · 2 400 m",
    label: "le village qui règne sur le marathon mondial",
  },
  {
    value: "Bekoji, Éthiopie · 2 800 m",
    label: "la ville natale des champions olympiques du fond",
  },
  {
    value: "Sierra Nevada · 2 320 m",
    label: "le camp d'altitude du peloton professionnel",
  },
  {
    value: `Votre chambre · jusqu'à ${formatNumber(MAX_ALTITUDE)} m`,
    label: "la même arme, à domicile, nuit après nuit",
    /* La bascule : le seul relevé en accent, parce que c'est le seul qui
       parle du visiteur. */
    accent: true,
  },
];

export function AltitudeGapSection() {
  return (
    <section
      id="armes-egales"
      aria-labelledby="armes-egales-titre"
      className="relative z-20 mx-auto w-full max-w-[1240px] scroll-mt-24 px-6 py-24 sm:py-32 lg:px-10"
    >
      <div className="max-w-3xl">
        <Eyebrow data-reveal>À armes égales</Eyebrow>

        {/* Volets masqués : la deuxième ligne, courte et en accent, porte
            le coup. Le texte reste une seule phrase pour les lecteurs
            d'écran. */}
        <h2
          id="armes-egales-titre"
          className="mt-5 text-[1.85rem] leading-[1.12] font-medium tracking-[-0.03em] sm:text-4xl lg:text-5xl"
        >
          <span data-reveal-line>
            <span className="text-ink">Eux sont nés là-haut.</span>
          </span>
          <span data-reveal-line>
            <span className="text-accent">Pas vous.</span>
          </span>
        </h2>

        <p
          data-reveal
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty"
        >
          {
            "Le fond mondial appartient aux coureurs nés entre 2 000 et 3 000 mètres — Rift Valley kényane, hauts plateaux éthiopiens. Leur organisme apprend à transporter l'oxygène depuis l'enfance. Le cyclisme professionnel en a tiré la même conclusion : les blocs d'altitude structurent désormais chaque saison. À ce niveau, l'altitude n'est pas un perfectionnement. C'est l'équipement de série."
          }
        </p>

        <p
          data-reveal
          className="mt-4 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty"
        >
          {
            "Vous, vous vous entraînez aussi sérieusement qu'eux. Puis vous dormez à 200 mètres. Cet écart-là ne se comble pas à l'entraînement — il se creuse la nuit."
          }
        </p>
      </div>

      {/* Les relevés : trois lieux qui possèdent l'arme, puis la chambre du
          visiteur qui la reçoit. Même grammaire que les repères du hero —
          chiffre en chasse fixe, étiquette en capitales espacées. */}
      <dl
        data-reveal
        className="mt-14 grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        {PLACES.map(({ value, label, accent }) => (
          <div key={value} className="flex flex-col gap-1.5 px-5 py-6">
            <dt
              className={`font-mono text-sm tracking-[0.02em] ${accent ? "text-accent" : "text-ink"}`}
            >
              {value}
            </dt>
            <dd className="text-[0.72rem] leading-[1.5] tracking-[0.1em] text-dimmer uppercase">
              {label}
            </dd>
          </div>
        ))}
      </dl>

      <p
        data-reveal
        className="mt-10 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty"
      >
        {
          "ATMOS ONE ne vous promet pas d'être meilleur que les meilleurs. Il vous rend ce qu'ils ont reçu à la naissance : des nuits en altitude. "
        }
        <span className="text-ink">À armes égales, le travail décide.</span>
      </p>
    </section>
  );
}
