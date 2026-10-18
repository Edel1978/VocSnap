// Logo 4a: weißes Kärtchen mit „V" im Auslöser-Ring, Funke oben rechts. Auch Vorlage für die App-Icons.
export const LOGO = {
  ring: '#FB923C',
  ink: '#4F46E5',
  spark: '#FDE68A',
  from: '#6366F1',
  to: '#4338CA',
}

export function LogoRing({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <circle
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke={LOGO.ring}
      strokeWidth="6"
      strokeDasharray="22 8"
      strokeLinecap="round"
      className={className}
      style={style}
    />
  )
}

export function LogoCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <g className={className} style={style}>
      <rect x="38" y="38" width="44" height="44" rx="10" fill="#fff" transform="rotate(-8 60 60)" />
      <path d="M47 49l13 26 13-26" fill="none" stroke={LOGO.ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

export function LogoSpark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <path d="M96 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={LOGO.spark} className={className} style={style} />
  )
}

// Vollständiges Logo mit Hintergrund, z. B. im Kopf der App.
export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LOGO.from} />
          <stop offset="1" stopColor={LOGO.to} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#logo-bg)" />
      <LogoRing />
      <LogoCard />
      <LogoSpark />
    </svg>
  )
}
