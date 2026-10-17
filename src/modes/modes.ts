// Kennungen der Lernmodi in Standard-Reihenfolge. Die Bausteine selbst folgen ab E1.
export const MODES = [
  { id: 'flashcard', label: 'Karteikarte' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'typing', label: 'Tippen' },
  { id: 'listen_write', label: 'Hören und Schreiben' },
  { id: 'matching', label: 'Matching' },
] as const

export type ModeId = (typeof MODES)[number]['id']

export const MODE_IDS: ModeId[] = MODES.map((m) => m.id)
