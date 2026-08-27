"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

/**
 * Rideau de première visite : la page d'accueil s'ouvre sur une respiration.
 *
 * Un halo s'emplit sur « Inspirez », se relâche sur « Expirez », puis
 * l'horizon se fend et révèle le hero. C'est la marque qui parle, pas la
 * fiche technique : le souffle est le geste commun de tout ce que la maison
 * propose — l'effort d'endurance, l'hypoxie, la récupération — et il restera
 * juste quand la gamme dépassera le premier générateur. Une version
 * précédente faisait grimper un altimètre vers 6 500 m : c'était rejouer la
 * spécification d'un produit là où il fallait présenter une maison.
 *
 * Les deux temps portent les deux pôles chromatiques du site : l'inspiration
 * en bleu instrument (l'effort, l'hypoxie), l'expiration en contrepoint
 * chaud (la récupération) — les mêmes jetons que partout ailleurs.
 *
 * Trois règles gouvernent ce composant :
 *
 * 1. **Une fois par session, et seulement à l'arrivée.** Un écran de
 *    lancement qui revient à chaque page n'est plus un lancement, c'est un
 *    obstacle. Le script d'amorçage ci-dessous marque la session au premier
 *    passage et refuse de lever le rideau en pleine navigation client.
 * 2. **Fermé par défaut.** Le rideau ne s'affiche que si le script décide de
 *    le lever : sans JavaScript, rien ne se lève et rien ne bloque — le même
 *    contrat que les révélations `data-reveal`. En mouvement réduit, il ne se
 *    lève pas non plus : deux secondes d'animation imposée sont exactement ce
 *    que cette préférence demande d'éviter.
 * 3. **Jamais sans issue.** Si l'hydratation n'arrive pas — extension qui la
 *    casse, réseau qui abandonne le tas JavaScript — le script d'amorçage
 *    retire le rideau de lui-même au bout de six secondes. Un écran noir qui
 *    ne rend jamais la main coûterait plus cher que tout ce qu'il apporte.
 */

/** Clé de session : posée dès le premier passage, rideau levé ou non. */
const SEEN_KEY = "atmos:rideau";

const LOADER_ID = "atmos-loader";

/** Signal d'ouverture, écouté par le hero via `afterSiteLoader`. */
const LOADER_DONE_EVENT = "atmos:rideau:leve";

/**
 * Décide du lever de rideau *avant le premier rendu* : inscrit dans le HTML
 * juste après le rideau, il s'exécute pendant l'analyse du document, avant
 * toute peinture — ni éclair de page nue à la première visite, ni éclair de
 * rideau aux suivantes. L'hydratation ne ré-exécute pas un script en place ;
 * seule une navigation client le rejoue, et `readyState` l'y neutralise.
 */
const BOOT_SCRIPT = `(function () {
  try {
    var seen = sessionStorage.getItem("${SEEN_KEY}");
    sessionStorage.setItem("${SEEN_KEY}", "1");
    if (seen) return;
    if (document.readyState !== "loading") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var veil = document.getElementById("${LOADER_ID}");
    if (!veil) return;
    veil.setAttribute("data-visible", "");
    var arm = function () {
      setTimeout(function () {
        var still = document.getElementById("${LOADER_ID}");
        if (still) still.removeAttribute("data-visible");
      }, 6000);
    };
    if (document.hidden) {
      document.addEventListener("visibilitychange", function onVisible() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVisible);
        arm();
      });
    } else {
      arm();
    }
  } catch (error) {
    /* Stockage inaccessible (navigation privée stricte) : pas de rideau. */
  }
})();`;

/**
 * Exécute `fn` dès que la page est réellement regardée — tout de suite au
 * premier plan, au retour de visibilité sinon.
 *
 * Toutes les horloges du rideau passent par ici. Dans un onglet ouvert en
 * arrière-plan — clic molette depuis un moteur de recherche —
 * `requestAnimationFrame` ne bat pas : la respiration resterait figée à sa
 * première image pendant que les comptes à rebours de sécurité, eux,
 * tournent en temps réel et retirent un rideau que personne n'a encore vu.
 * Le temps du rideau ne s'écoule donc qu'à l'écran.
 */
function whenPageVisible(fn: () => void): () => void {
  if (!document.hidden) {
    fn();
    return () => {};
  }

  const onVisible = () => {
    if (document.hidden) return;
    document.removeEventListener("visibilitychange", onVisible);
    fn();
  };

  document.addEventListener("visibilitychange", onVisible);
  return () => document.removeEventListener("visibilitychange", onVisible);
}

/**
 * Exécute `callback` au lever du rideau — immédiatement s'il n'y a pas de
 * rideau à attendre. C'est le point de départ que le hero confie à son
 * enchaînement d'entrée : joué à l'hydratation, il se déroulerait derrière
 * le rideau, pour personne.
 *
 * Le repli à sept secondes double le retrait d'urgence du script d'amorçage
 * (six secondes) : même si aucun signal ne part jamais, la page finit
 * toujours par jouer son entrée.
 */
export function afterSiteLoader(callback: () => void): () => void {
  const veil = document.getElementById(LOADER_ID);
  if (!veil || !veil.hasAttribute("data-visible")) {
    callback();
    return () => {};
  }

  let fallback = 0;
  const run = () => {
    window.clearTimeout(fallback);
    window.removeEventListener(LOADER_DONE_EVENT, run);
    callback();
  };

  window.addEventListener(LOADER_DONE_EVENT, run);
  const cancelArming = whenPageVisible(() => {
    fallback = window.setTimeout(run, 7000);
  });

  return () => {
    cancelArming();
    window.clearTimeout(fallback);
    window.removeEventListener(LOADER_DONE_EVENT, run);
  };
}

export function SiteLoader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const veil = root.current;
      if (!veil) return;

      // Rideau non levé — session déjà vue, mouvement réduit, navigation
      // client : le composant se retire et libère le hero sans attendre.
      if (!veil.hasAttribute("data-visible")) {
        window.dispatchEvent(new Event(LOADER_DONE_EVENT));
        setDone(true);
        return;
      }

      const html = document.documentElement;

      // Un défilement pendant le rideau déposerait le visiteur au milieu de
      // la page, l'entrée du hero jouée hors champ. Verrouillé le temps de
      // l'ouverture, restauré dans tous les cas — y compris au démontage.
      html.style.overflow = "hidden";

      const finish = () => {
        html.style.overflow = "";
        window.dispatchEvent(new Event(LOADER_DONE_EVENT));
        setDone(true);
      };

      // En pause tant que la page n'est pas regardée : la respiration ne se
      // joue pas pour un onglet d'arrière-plan, elle l'attend.
      const curtain = gsap.timeline({ paused: true, onComplete: finish });
      const cancelStart = whenPageVisible(() => curtain.play());

      curtain
        // La marque et la consigne apparaissent…
        .fromTo(
          "[data-loader-fade]",
          { y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.1 },
          0,
        )
        // …et l'inspiration commence : le halo s'emplit, l'horizon se
        // déploie du même souffle. `sine.inOut` et rien d'autre — c'est la
        // courbe d'une respiration, sans départ sec ni à-coup.
        .fromTo(
          "[data-loader-halo]",
          { scale: 0.55 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "sine.inOut" },
          0.1,
        )
        .to(
          "[data-loader-horizon]",
          { scaleX: 1, duration: 1.2, ease: "sine.inOut" },
          0.1,
        )
        // Le tournant du souffle : la consigne bascule au sommet de
        // l'inspiration, du bleu de l'effort au chaud de la récupération.
        .to(
          '[data-loader-word="inspirez"]',
          { opacity: 0, duration: 0.3, ease: "power1.out" },
          1.3,
        )
        .to(
          '[data-loader-word="expirez"]',
          { opacity: 1, duration: 0.35, ease: "power1.in" },
          1.35,
        )
        // L'expiration : le halo se relâche vers l'extérieur et s'éteint.
        .to(
          "[data-loader-halo]",
          { scale: 1.32, opacity: 0, duration: 0.9, ease: "sine.inOut" },
          1.35,
        )
        // Fin du souffle : tout s'efface, l'horizon s'ouvre.
        .to(
          "[data-loader-fade], [data-loader-horizon]",
          { opacity: 0, duration: 0.3, ease: "power1.out" },
          1.9,
        )
        // Le signal part dès que les pans bougent, pas à la fin : le titre
        // du hero monte pendant que le rideau s'ouvre, et la page révélée
        // n'est jamais une scène vide. `finish` renverra le même événement,
        // pour rien — l'écouteur du hero se retire au premier signal.
        .call(() => window.dispatchEvent(new Event(LOADER_DONE_EVENT)), [], 2.1)
        .to(
          '[data-loader-panel="haut"]',
          { yPercent: -102, duration: 0.8, ease: "power4.inOut" },
          2.0,
        )
        .to(
          '[data-loader-panel="bas"]',
          { yPercent: 102, duration: 0.8, ease: "power4.inOut" },
          2.0,
        );

      return () => {
        cancelStart();
        html.style.overflow = "";
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <>
      {/* `suppressHydrationWarning` : `data-visible` est posé par le script
          d'amorçage avant l'hydratation, React ne doit pas s'en offusquer.
          L'état initial de chaque élément est en CSS, comme pour
          `data-reveal` : aucune image ne montre le rideau à moitié peint. */}
      <div
        ref={root}
        id={LOADER_ID}
        aria-hidden
        suppressHydrationWarning
        className="fixed inset-0 z-[60] hidden data-visible:block"
      >
        {/* Les deux pans, fendus sur la ligne d'horizon. Le pan bas déborde
            d'un pixel sur le haut : deux moitiés exactes laissent un jour au
            gré des arrondis de viewport. Chacun porte son halo d'accent vers
            la fente, pour que l'ouverture parte d'une lueur. */}
        <div
          data-loader-panel="haut"
          className="absolute inset-x-0 top-0 bottom-1/2 bg-void"
        >
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(72%_100%_at_50%_100%,var(--accent-soft),transparent_72%)] opacity-60" />
        </div>
        <div
          data-loader-panel="bas"
          className="absolute inset-x-0 top-[calc(50%-1px)] bottom-0 bg-void"
        >
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(72%_100%_at_50%_0%,var(--accent-soft),transparent_72%)] opacity-60" />
        </div>

        {/* Le souffle : un halo qui s'emplit à l'inspiration et se relâche à
            l'expiration. Centré par `inset-0 m-auto`, jamais par une classe
            de translation — GSAP remet la propriété CSS `translate` à `none`
            quand il anime, et le halo sauterait hors du centre. */}
        <div
          data-loader-halo
          className="absolute inset-0 m-auto aspect-square w-[min(44rem,120vw)] rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_62%)] opacity-0"
        />

        {/* L'horizon : il se déploie avec l'inspiration, et c'est sur lui
            que le rideau se fend. Replié en style en ligne et non en classe
            `scale-x-0` : Tailwind 4 écrit `scale`, la propriété CSS, que
            GSAP n'écrase pas — les deux échelles se multiplieraient et le
            trait resterait invisible. */}
        <div
          data-loader-horizon
          style={{ transform: "scaleX(0)" }}
          className="absolute inset-x-0 top-1/2 mx-auto h-px w-[min(34rem,74vw)] bg-gradient-to-r from-transparent via-accent to-transparent"
        />

        {/* La marque au-dessus de l'horizon. Le retrait gauche compense
            l'espacement que la dernière lettre traîne derrière elle, sans
            quoi le mot centré penche à gauche. */}
        <div className="absolute inset-x-0 bottom-1/2 flex flex-col items-center px-6 pb-8">
          <p
            data-loader-fade
            className="pl-[0.42em] font-mono text-[clamp(1.05rem,2.4vw,1.4rem)] tracking-[0.42em] text-ink uppercase opacity-0"
          >
            Atmos
          </p>
        </div>

        {/* La consigne sous l'horizon : les deux temps du souffle, empilés
            au même endroit et permutés en fondu au sommet de l'inspiration. */}
        <p
          data-loader-fade
          className="absolute inset-x-0 top-1/2 pt-7 text-center font-mono text-[0.66rem] tracking-[0.24em] uppercase opacity-0"
        >
          <span className="relative inline-block">
            <span data-loader-word="inspirez" className="text-accent">
              Inspirez
            </span>
            <span
              data-loader-word="expirez"
              className="absolute inset-0 text-warm whitespace-nowrap opacity-0"
            >
              Expirez
            </span>
          </span>
        </p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </>
  );
}
