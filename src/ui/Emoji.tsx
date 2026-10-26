// Bunte 3D-Symbole (Microsoft Fluent Emoji, MIT, public/emoji/LICENSE). Liegen in der App, offline verfügbar.
export type EmojiName =
  | 'house' | 'books' | 'trophy' | 'gear' | 'fire' | 'target' | 'check' | 'calendar' | 'redo' | 'star' | 'hundred'
  | 'brain' | 'camera' | 'lock' | 'sparkles' | 'memo' | 'pencil' | 'rocket' | 'game' | 'sunrise' | 'owl' | 'muscle'
  | 'shield' | 'mic' | 'party'

export function Emoji({ name, className = 'size-7' }: { name: EmojiName; className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}emoji/${name}.webp`} alt="" aria-hidden="true" draggable={false} className={`shrink-0 select-none ${className}`} />
}
