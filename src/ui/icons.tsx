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
  check: 'M5 12.5l4.5 4.5L19 7',
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
