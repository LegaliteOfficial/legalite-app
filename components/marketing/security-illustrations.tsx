/**
 * Spot illustrations for the marketing security cards. Pure inline SVG in the
 * brand palette (gold on near-black), so they stay crisp and need no assets.
 */

const svgClass = 'w-full max-w-[240px] h-auto'

// Isolated and encrypted: a document with masked content behind a lock,
// inside a dashed isolation boundary.
export function IllusEncrypted() {
  return (
    <svg viewBox="0 0 220 130" fill="none" className={svgClass} aria-hidden>
      <rect
        x="16" y="14" width="188" height="102" rx="16"
        stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" strokeDasharray="5 6"
      />
      <rect
        x="70" y="30" width="80" height="70" rx="10"
        fill="#0E1420" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"
      />
      <rect x="82" y="44" width="46" height="4" rx="2" fill="rgba(255,255,255,0.28)" />
      <rect x="82" y="54" width="56" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
      <g fill="#C9972B">
        <circle cx="84" cy="70" r="2.6" />
        <circle cx="94" cy="70" r="2.6" />
        <circle cx="104" cy="70" r="2.6" />
        <circle cx="114" cy="70" r="2.6" />
        <circle cx="124" cy="70" r="2.6" />
      </g>
      <circle cx="150" cy="92" r="16" fill="url(#enc-grad)" />
      <rect x="144" y="90" width="12" height="10" rx="2" fill="#0A0E14" />
      <path d="M147 90v-2.5a3 3 0 0 1 6 0V90" stroke="#0A0E14" strokeWidth="1.6" fill="none" />
      <defs>
        <linearGradient id="enc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#E8B84B" />
          <stop offset="1" stopColor="#C9972B" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Private from the AI: an AI orb whose reach into user data is stopped by a
// gold shield barrier.
export function IllusPrivateAi() {
  return (
    <svg viewBox="0 0 220 130" fill="none" className={svgClass} aria-hidden>
      <rect
        x="26" y="46" width="46" height="40" rx="8"
        fill="#0E1420" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"
      />
      <rect x="34" y="56" width="30" height="3.5" rx="1.75" fill="rgba(255,255,255,0.25)" />
      <rect x="34" y="64" width="22" height="3.5" rx="1.75" fill="rgba(255,255,255,0.15)" />
      <rect x="34" y="72" width="26" height="3.5" rx="1.75" fill="rgba(255,255,255,0.15)" />

      <path d="M158 65 H128" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 5" />

      <circle cx="180" cy="65" r="20" fill="rgba(201,151,43,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <path d="M180 54 l3.2 7.8 7.8 3.2 -7.8 3.2 -3.2 7.8 -3.2 -7.8 -7.8 -3.2 7.8 -3.2z" fill="#E8B84B" />

      <path
        d="M110 38 l17 6 v15 c0 12.5 -8.5 20 -17 23 c-8.5 -3 -17 -10.5 -17 -23 v-15z"
        fill="rgba(201,151,43,0.10)" stroke="#C9972B" strokeWidth="1.8"
      />
      <path d="M102 64 l5.5 5.5 9.5 -11" stroke="#E8B84B" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Never used to train: user data flowing toward a model, blocked by a gold
// prohibition mark.
export function IllusNoTraining() {
  return (
    <svg viewBox="0 0 220 130" fill="none" className={svgClass} aria-hidden>
      <rect
        x="24" y="44" width="42" height="44" rx="8"
        fill="#0E1420" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"
      />
      <rect x="32" y="54" width="26" height="3.5" rx="1.75" fill="rgba(255,255,255,0.22)" />
      <rect x="32" y="62" width="20" height="3.5" rx="1.75" fill="rgba(255,255,255,0.14)" />
      <rect x="32" y="70" width="24" height="3.5" rx="1.75" fill="rgba(255,255,255,0.14)" />

      <path d="M74 66 H150" stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" strokeDasharray="4 5" />
      <path d="M146 61 l6 5 -6 5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <g stroke="rgba(255,255,255,0.22)" strokeWidth="1.4">
        <line x1="170" y1="50" x2="190" y2="66" />
        <line x1="170" y1="82" x2="190" y2="66" />
        <line x1="170" y1="50" x2="170" y2="82" />
      </g>
      <circle cx="170" cy="50" r="5" fill="#0E1420" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
      <circle cx="170" cy="82" r="5" fill="#0E1420" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
      <circle cx="190" cy="66" r="6.5" fill="rgba(201,151,43,0.15)" stroke="#C9972B" strokeWidth="1.5" />

      <circle cx="112" cy="66" r="15" fill="#0A0E14" stroke="#E8B84B" strokeWidth="2" />
      <line x1="102" y1="56" x2="122" y2="76" stroke="#E8B84B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
