// Linien-Icons (24×24, Strichstärke 2). Dekorativ, Bedeutung steht immer auch als Text daneben.
const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  book: 'M4 5h16v14H4zM8 9h8M8 13h5',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2M17 7l1.5-1.5M5.5 18.5L7 17M17 17l1.5 1.5M5.5 5.5L7 7',
  play: 'M7 4.5v15l12-7.5z',
  flame: 'M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 11.5C8 9 9.5 8 9.5 6c2 1 2.5 2.5 2.5 2.5S13 6 12 3zM10 14.5a2 2 0 0 0 4 0c0-1.5-2-2.5-2-4-1 1-2 2.5-2 4z',
  calendar: 'M3.5 5h17v15h-17zM3.5 10h17M8 3v4M16 3v4',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  plus: 'M12 5v14M5 12h14',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  palette: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11.5h0M10 7.5h0M14.5 7.5h0',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h0',
  cards: 'M7 4h11a2 2 0 0 1 2 2v11M4 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h0M4.5 12h0M4.5 18h0',
  keyboard: 'M3 6h18v12H3zM7 10h0M11 10h0M15 10h0M7 14h10',
  ear: 'M6 10a6 6 0 1 1 12 0c0 3-2 4-3 5.5S14 19 12 20a3 3 0 0 1-3-2M9 10a3 3 0 0 1 6 0',
  puzzle: 'M10 4h4v3a2 2 0 1 0 4 0V4h2v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
