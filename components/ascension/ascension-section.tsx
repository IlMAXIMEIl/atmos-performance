"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Eyebrow } from "@/components/ui/eyebrow";
import {
  MAX_ALTITUDE,
  fio2AtAltitude,
  formatDecimal,
  formatNumber,
  landmarkFor,
} from "@/lib/altitude";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Les quatre chapitres de la traversée, et la tranche d'altitude que chacun
 * fait défiler.
 *
 * Les bornes ne sont pas décoratives : ce sont celles des trois protocoles de
 * `ProtocolsSection` — LHTL 2 100–2 600, IHT 2 500–3 500, IHE 3 500–5 000 —
 * encadrées par l'air ambiant et le plafond de l'appareil. Le relevé affiché
 * reste toujours à l'intérieur de la plage annoncée par son surtitre.
 *
 * **IHT et IHE partagent un chapitre.** Séparés, ils portaient la scène à cinq
 * écrans de défilement pour une distinction que la section Protocoles, trois
 * sections plus bas, détaille bien mieux. Ici les deux sont nommés dans le
 * même surtitre : le visiteur retient qu'au-delà de 2 500 m la séance change
 * de nature, ce qui est le seul point que cette scène doit faire passer.
 *
 * Chaque chapitre reçoit la même part de défilement ; c'est l'altitude qui
 * accélère ou ralentit d'un chapitre à l'autre, ce qui ne se perçoit pas.
 *
 * Le texte tient en une phrase par chapitre. Une scène épinglée impose son
 * rythme au lecteur : lui donner trois lignes à lire par palier, c'est le
 * forcer soit à s'arrêter de défiler, soit à renoncer à lire.
 */
const CHAPTERS: {
  eyebrow: string;
  /** Bornes basse et haute parcourues pendant ce chapitre, en mètres. */
  band: [number, number];
  title: string;
  body: string;
}[] = [
  {
    eyebrow: "Air ambiant",
    band: [0, 2100],
    title: "Sous 2 000 mètres, le corps n'a rien à faire.",
    body: "20,9 % d'oxygène. L'air est confortable, et le confort ne déclenche aucune adaptation.",
  },
  {
    eyebrow: "Mode Sommeil · LHTL",
    band: [2100, 2500],
    title: "Le palier où la nuit fait le travail.",
    body: "Douze à quatorze heures sous tente, à intensité faible. L'acclimatation s'installe pendant que vous dormez.",
  },
  {
    eyebrow: "Entraînement et exposition · IHT / IHE",
    band: [2500, 5000],
    title: "Plus haut, la séance change de nature.",
    body: "Sous masque à l'effort jusqu'à 3 500 m, puis au repos strict au-delà : c'est l'air qui fournit l'intensité, plus l'allure.",
  },
  {
    eyebrow: "Plafond ATMOS ONE",
    band: [5000, MAX_ALTITUDE],
    title: "Et vous n'avez pas quitté votre chambre.",
    body: `${formatDecimal(fio2AtAltitude(MAX_ALTITUDE))} % d'oxygène, au-delà du camp de base de l'Everest. L'altitude devient un réglage, pas un voyage.`,
  },
];

/** Part de défilement attribuée à chaque chapitre. */
const SLICE = 1 / CHAPTERS.length;

/**
 * Altitude en mètres, groupée par milliers avec une espace ordinaire.
 *
 * `formatNumber` sépare par une espace insécable fine (U+202F), invisible en
 * texte courant mais large d'une pleine chasse dans une police à chasse fixe :
 * le relevé affichait « 1  080 ». Ici l'espace est ordinaire, resserrée par
 * `word-spacing` — seuls U+0020 et U+00A0 y sont sensibles. Le calcul reste
 * fait à la main, sans `toLocaleString`, pour que serveur et navigateur
 * produisent la même chaîne.
 */
function metres(value: number): string {
  return formatNumber(value).replace(/\u202F/g, " ");
}

/** Chapitre courant et altitude atteinte, arrondie au palier de 10 m. */
function altitudeAt(progress: number): { index: number; metres: number } {
  const index = Math.min(
    CHAPTERS.length - 1,
    Math.max(0, Math.floor(progress / SLICE)),
  );
  const local = Math.min(1, Math.max(0, progress / SLICE - index));
  const [low, high] = CHAPTERS[index].band;

  return { index, metres: Math.round((low + (high - low) * local) / 10) * 10 };
}

/**
 * La scène d'ascension : le relevé d'altitude monte avec le défilement, les
 * crêtes passent sous vos pieds, le chapitre change de palier en palier.
 *
 * **Le chiffre d'oxygène n'est pas une approximation.** Il sort de
 * `fio2AtAltitude`, la table ISA tabulée qui alimente déjà le simulateur : à
 * 1 080 m la page affiche 18,4 % — la valeur physiologique — et non les
 * 18,9 % qu'une interpolation linéaire entre 20,9 et 9,1 donnerait. Les deux
 * écarts se croisent au milieu de la plage et divergent partout ailleurs.
 *
 * Rien n'est détourné : l'épinglage est un `position: sticky`, la page défile
 * normalement et ScrollTrigger se contente de lire l'avancement. Aucun état
 * React n'est touché pendant le défilement — le relevé est écrit directement
 * dans le DOM, ce qui évite un rendu par image.
 */
export function AscensionSection() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(stage);

      // En mouvement réduit, la scène est déjà servie dépliée par CSS : les
      // cinq chapitres se lisent à la suite, chacun avec son palier. Rien à
      // animer, et surtout aucun déclencheur à poser.
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const slides = gsap.utils.toArray<HTMLElement>("[data-chapter]");
        const altitudeOut = stage.current!.querySelector<HTMLElement>(
          "[data-readout='altitude']",
        )!;
        const fio2Out = stage.current!.querySelector<HTMLElement>(
          "[data-readout='fio2']",
        )!;
        const landmarkOut = stage.current!.querySelector<HTMLElement>(
          "[data-readout='landmark']",
        )!;

        // `quickSetter` court-circuite le moteur de tween : on écrit la
        // transformation directement, ce qui est le bon outil quand la valeur
        // vient du défilement et non d'une durée.
        const ridges = (["far", "mid", "near"] as const).map((depth) => ({
          set: gsap.quickSetter(
            stage.current!.querySelector(`[data-ridge='${depth}']`)!,
            "css",
          ),
          // Le plan le plus proche descend le plus vite et grandit le plus :
          // c'est lui qu'on dépasse.
          drop: depth === "near" ? 44 : depth === "mid" ? 24 : 10,
          zoom: depth === "near" ? 0.5 : depth === "mid" ? 0.26 : 0.1,
        }));

        let shown = -1;
        let lastMetres = -1;

        const render = (progress: number) => {
          const { index, metres: altitude } = altitudeAt(progress);

          if (altitude !== lastMetres) {
            lastMetres = altitude;
            altitudeOut.textContent = metres(altitude);
            fio2Out.textContent = formatDecimal(fio2AtAltitude(altitude));
            landmarkOut.textContent = landmarkFor(altitude);
          }

          if (index !== shown) {
            shown = index;
            slides.forEach((slide, i) => {
              gsap.set(slide, { opacity: i === index ? 1 : 0 });
              // Les chapitres masqués se superposent au courant : sans cela,
              // un lecteur d'écran lirait les cinq d'affilée.
              slide.setAttribute("aria-hidden", i === index ? "false" : "true");
            });
          }

          for (const ridge of ridges) {
            ridge.set({
              transform: `translateX(-50%) translateY(${progress * ridge.drop}%) scale(${1 + progress * ridge.zoom})`,
            });
          }
        };

        const trigger = ScrollTrigger.create({
          trigger: track.current,
          // La scène adhère du moment où le rail touche le haut de la fenêtre
          // jusqu'à ce que son pied la rejoigne : exactement la course que
          // `position: sticky` consomme.
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => render(self.progress),
          onRefresh: (self) => render(self.progress),
        });

        return () => trigger.kill();
      });

      return () => media.revert();
    },
    { scope: stage },
  );

  return (
    <section
      id="ascension"
      aria-labelledby="ascension-titre"
      className="relative z-20"
    >
      {/*
        Le rail fournit la course : un peu plus d'une fenêtre par chapitre,
        entrée et sortie comprises. En mouvement réduit il s'efface, et la
        scène redevient une simple suite de blocs.
      */}
      {/*
        La course de la scène : 300 svh de piste moins la fenêtre épinglée,
        soit 200 vh réellement parcourus — environ 450 px par chapitre.

        Elle valait 520 svh, soit 420 vh de course : douze secondes le doigt
        sur la molette avant d'en sortir. Une scène épinglée doit se traverser,
        pas s'endurer.

        450 px, c'est le plancher assumé : un geste franc de trackpad couvre
        300 à 500 px, donc un geste avance d'un chapitre. En descendant plus
        bas, un seul mouvement en sauterait un — ce qui ne se lit pas comme
        « rapide » mais comme « cassé ». La scène produit tient la même
        cadence : les deux traversées de la page battent au même rythme.
      */}
      <div
        ref={track}
        className="relative h-[300svh] motion-reduce:h-auto"
        data-reveal-scope
      >
        <div
          ref={stage}
          className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible motion-reduce:py-24"
        >
          {/* ── Les crêtes ───────────────────────────────────────────────
              Trois plans qui descendent à des vitesses différentes : on ne
              regarde pas un paysage, on passe au-dessus. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-reduce:hidden"
          >
            <Ridge depth="far" fill="#111b2c" opacity={0.35} />
            <Ridge depth="mid" fill="#0a1320" opacity={0.6} />
            <Ridge depth="near" fill="#060b14" opacity={1} />
            {/* Le sol se fond dans la page : sans ce voile, la dernière crête
                se découpe au ras de la section suivante. */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" />
          </div>

          <h2 id="ascension-titre" className="sr-only">
            {`De 0 à ${formatNumber(MAX_ALTITUDE)} mètres, palier par palier`}
          </h2>

          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-12 px-6 lg:grid-cols-[minmax(0,32em)_1fr] lg:px-10">
            {/* ── Les chapitres ─────────────────────────────────────────
                Empilés au même endroit sur la scène épinglée, seul le
                chapitre courant est opaque. Dépliés en liste en mouvement
                réduit. */}
            <div className="relative min-h-[19rem] motion-reduce:flex motion-reduce:min-h-0 motion-reduce:flex-col motion-reduce:gap-20 lg:min-h-[15rem]">
              {CHAPTERS.map((chapter, index) => (
                <article
                  key={chapter.eyebrow}
                  data-chapter
                  className={[
                    "flex flex-col gap-5 transition-opacity duration-500",
                    // Le premier chapitre tient la place dans le flux ; les
                    // suivants se superposent à lui, calés sur la même case.
                    index === 0
                      ? "relative"
                      : "absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0",
                    index === 0 ? "" : "motion-reduce:relative",
                    "motion-reduce:inset-auto motion-reduce:translate-y-0 motion-reduce:opacity-100",
                  ].join(" ")}
                >
                  <Eyebrow>
                    {`${chapter.eyebrow} — ${metres(chapter.band[0])} → ${metres(chapter.band[1])} m`}
                  </Eyebrow>

                  <p className="text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-ink">
                    {chapter.title}
                  </p>

                  <p className="max-w-[34em] leading-[1.65] text-dim text-pretty">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>

            {/* ── Le relevé ─────────────────────────────────────────────
                Altitude vive à gauche du signe, fraction d'oxygène dessous.
                Masqué en mouvement réduit : sans défilement animé il n'aurait
                qu'une valeur figée à montrer, celle déjà portée par chaque
                surtitre. */}
            <div className="text-right font-mono tabular-nums motion-reduce:hidden lg:justify-self-end">
              <p className="[word-spacing:-0.28em] text-[clamp(2.6rem,8vw,6.4rem)] leading-[0.9] tracking-[-0.05em] whitespace-nowrap text-ink">
                <span data-readout="altitude">{metres(0)}</span>
                <span className="ml-[0.12em] align-baseline text-[0.32em] tracking-[0.1em] text-dim">
                  M
                </span>
              </p>

              <p className="mt-5 text-[0.66rem] tracking-[0.2em] text-dimmer uppercase">
                Oxygène inspiré
              </p>
              <p className="mt-1 text-[1.4rem] tracking-[-0.02em] text-accent">
                <span data-readout="fio2">
                  {formatDecimal(fio2AtAltitude(0))}
                </span>
                {" %"}
              </p>

              {/* Le repère géographique vient de `landmarkFor` : c'est ce qui
                  donne une échelle au chiffre. */}
              <p className="mt-4 ml-auto max-w-[18em] text-[0.66rem] leading-[1.6] tracking-[0.1em] text-dimmer uppercase">
                <span data-readout="landmark">{landmarkFor(0)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Une ligne de crête, tracée large et débordante pour que l'agrandissement
 * ne découvre jamais les bords de la fenêtre.
 */
function Ridge({
  depth,
  fill,
  opacity,
}: {
  depth: "far" | "mid" | "near";
  fill: string;
  opacity: number;
}) {
  const paths = {
    far: "M0 420V236l104-58 92 44 118-96 96 62 132-112 118 84 122-52 104 76 118-64 108 58 96-38 92 62 100-46v264z",
    mid: "M0 420V286l138-72 118 58 142-118 128 86 150-96 136 108 148-70 130 84 154-72 156 92v134z",
    near: "M0 420V330l176-86 148 74 186-132 164 118 178-92 172 116 190-84 186 96v110z",
  };

  return (
    <div
      data-ridge={depth}
      style={{ opacity }}
      className="absolute bottom-0 left-1/2 w-[190%] -translate-x-1/2 will-change-transform"
    >
      <svg
        viewBox="0 0 1600 420"
        preserveAspectRatio="none"
        className="h-auto w-full"
      >
        <path fill={fill} d={paths[depth]} />
      </svg>
    </div>
  );
}
