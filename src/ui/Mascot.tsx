// „Snappy", die Karteikarte mit Gesicht. Selbst gezeichnet, Stimmung steuert Mund und Augen.
export type Mood = 'happy' | 'cheer' | 'sleepy'

export function Mascot({ mood = 'happy', className = '' }: { mood?: Mood; className?: string }) {
  const ink = '#1E1B4B'
  return (
    <svg viewBox="0 0 120 120" className={`animate-bob ${className}`} aria-hidden="true">
      <ellipse cx="60" cy="112" rx="32" ry="5" fill="#000" opacity=".15" />
      <g transform="rotate(-8 60 60)">
        <rect x="22" y="28" width="76" height="70" rx="16" fill="#fff" stroke={ink} strokeWidth="4" />
        <path d="M22 44a16 16 0 0 1 16-16h44a16 16 0 0 1 16 16v2H22z" fill="#FB923C" stroke={ink} strokeWidth="4" />
        {mood === 'sleepy' ? (
          <g stroke={ink} strokeWidth="4" strokeLinecap="round">
            <path d="M40 66h12M68 66h12" />
          </g>
        ) : (
          <g className="animate-blink" style={{ transformOrigin: '60px 66px' }}>
            <circle cx="46" cy="66" r="6" fill={ink} />
            <circle cx="74" cy="66" r="6" fill={ink} />
            <circle cx="48" cy="64" r="2" fill="#fff" />
            <circle cx="76" cy="64" r="2" fill="#fff" />
          </g>
        )}
        {mood === 'cheer' ? (
          <path d="M48 78q12 14 24 0z" fill={ink} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        ) : mood === 'sleepy' ? (
          <path d="M54 82h12" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        ) : (
          <path d="M50 80q10 9 20 0" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        <circle cx="38" cy="78" r="4" fill="#FDA4AF" />
        <circle cx="82" cy="78" r="4" fill="#FDA4AF" />
      </g>
      {mood !== 'sleepy' && (
        <>
          <path d="M100 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FDE68A" />
          <path d="M14 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FDE68A" />
        </>
      )}
      {mood === 'sleepy' && (
        <text x="92" y="30" fontFamily="Fredoka" fontWeight="700" fontSize="16" fill="#A5B4FC">
          z
        </text>
      )}
    </svg>
  )
}
