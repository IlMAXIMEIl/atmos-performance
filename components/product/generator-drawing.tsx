import type { ComponentProps } from "react";

/**
 * Dessin technique du générateur, repris de la direction artistique.
 *
 * Un trait plutôt qu'une photographie : le dessin laisse annoter chaque pièce
 * sans que le fond ne se batte avec le texte, et il tient dans le même nuancier
 * que le reste de la page. Les identifiants `data-part` sont les points
 * d'accroche des annotations — ils ne servent qu'à ça.
 *
 * Les dégradés portent un identifiant préfixé : deux dessins sur une même page
 * partageraient sinon leurs `<defs>`, et le second reprendrait les couleurs du
 * premier.
 */
export function GeneratorDrawing({
  className = "",
  ...rest
}: ComponentProps<"svg">) {
  return (
    <svg
      {...rest}
      viewBox="0 0 260 400"
      fill="none"
      role="img"
      aria-label="Dessin technique du générateur ATMOS ONE : écran de contrôle, sortie hypoxique, colonne de séparation, débitmètre et molette de réglage, sur châssis à roulettes."
      className={className}
    >
      <defs>
        <linearGradient id="atmos-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#152134" />
          <stop offset="1" stopColor="#0a1220" />
        </linearGradient>
        <linearGradient id="atmos-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e1828" />
          <stop offset="1" stopColor="#080f1b" />
        </linearGradient>
      </defs>

      {/* Châssis */}
      <path
        d="M34 44c0-11 9-20 20-20h152c11 0 20 9 20 20v312c0 8-6 14-14 14H48c-8 0-14-6-14-14z"
        fill="url(#atmos-body)"
        stroke="#2a3f5c"
      />
      <path d="M34 74h192" stroke="#1e2e45" />

      {/* Écran de contrôle */}
      <g data-part="screen">
        <rect
          x="52"
          y="36"
          width="58"
          height="28"
          rx="4"
          fill="#0b2440"
          stroke="#3b9eff"
        />
        <path
          d="M60 50h10M76 50h8M90 50h12"
          stroke="#3b9eff"
          strokeWidth="1.5"
          opacity=".8"
        />
      </g>

      {/* Voyants et interrupteur */}
      <circle cx="130" cy="50" r="2" fill="#3b9eff" opacity=".9" />
      <circle cx="142" cy="50" r="2" fill="#2a3f5c" />
      <circle cx="154" cy="50" r="2" fill="#2a3f5c" />
      <circle cx="166" cy="50" r="2" fill="#2a3f5c" />
      <circle cx="196" cy="50" r="6" fill="none" stroke="#3b9eff" />
      <path d="M196 46v5" stroke="#3b9eff" strokeWidth="1.4" />

      {/* Panneau central */}
      <rect
        x="46"
        y="96"
        width="168"
        height="150"
        rx="8"
        fill="url(#atmos-panel)"
        stroke="#22344e"
      />

      {/* Sortie hypoxique */}
      <g data-part="outlet">
        <rect
          x="122"
          y="88"
          width="16"
          height="16"
          rx="3"
          fill="#0f2237"
          stroke="#3b9eff"
        />
        <path d="M130 88v-8" stroke="#3b9eff" strokeWidth="1.4" />
      </g>

      {/* Colonne débitmètre */}
      <g data-part="flow">
        <rect
          x="172"
          y="112"
          width="26"
          height="86"
          rx="4"
          fill="#0a1524"
          stroke="#3b9eff"
        />
        <path
          d="M178 122h6M178 134h10M178 146h6M178 158h10M178 170h6M178 182h10"
          stroke="#3b9eff"
          opacity=".55"
        />
        <circle cx="185" cy="150" r="4" fill="#3b9eff" />
      </g>

      {/* Molette de réglage */}
      <g data-part="dial">
        <circle cx="185" cy="220" r="13" fill="#0f1b2c" stroke="#3b9eff" />
        <path d="M185 210v6" stroke="#3b9eff" strokeWidth="1.6" />
      </g>

      {/* Colonne de séparation azote / oxygène */}
      <g data-part="sieve">
        <path
          d="M74 128h44v78a10 10 0 0 1-10 10H84a10 10 0 0 1-10-10z"
          fill="#0a1524"
          stroke="#22344e"
        />
        <path d="M74 186h44" stroke="#3b9eff" opacity=".5" />
        <path d="M88 128v-10h16v10" stroke="#22344e" />
      </g>

      {/* Corps inférieur et marque */}
      <path d="M40 260h180" stroke="#1e2e45" />
      <text
        x="130"
        y="316"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="4"
        fill="#2f4a6b"
      >
        ATMOS
      </text>

      {/* Roulettes */}
      <g data-part="caster">
        <circle cx="66" cy="380" r="10" fill="#0a1220" stroke="#22344e" />
        <circle cx="194" cy="380" r="10" fill="#0a1220" stroke="#22344e" />
        <path d="M60 370h12M188 370h12" stroke="#22344e" />
      </g>
    </svg>
  );
}
