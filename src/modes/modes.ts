// Kennungen der Lernmodi in Standard-Reihenfolge. Die Bausteine selbst folgen ab E1.
export const MODES = [
  { id: 'flashcard', label: 'Karteikarte' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'typing', label: 'Tippen' },
  { id: 'listen_write', label: 'Hören und Schreiben' },
  { id: 'matching', label: 'Matching' },
  { id: 'speak', label: 'Aussprache' },
] as const

export type ModeId = (typeof MODES)[number]['id']

export const MODE_IDS: ModeId[] = MODES.map((m) => m.id)

// Modi, die erst in den Einstellungen eingeschaltet werden müssen.
export function modeEnabled(id: ModeId, s: { pronunciation: boolean }): boolean {
  return id !== 'speak' || s.pronunciation
}
