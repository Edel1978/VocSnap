// Neue Sprachen hier ergänzen. speech = Sprachcode für die Sprachausgabe, color = Kennfarbe in Listen.
export const LANGUAGES = [
  { code: 'en', label: 'Englisch', speech: 'en-GB', color: '#6366F1' },
  { code: 'fr', label: 'Französisch', speech: 'fr-FR', color: '#EC4899' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE', color: '#10B981' },
] as const

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

export function speechLang(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? code
}

export function languageColor(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.color ?? '#6366F1'
}
