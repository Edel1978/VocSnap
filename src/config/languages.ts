// Neue Sprachen hier ergänzen. Code = BCP-47, auch für die Sprachausgabe.
export const LANGUAGES = [
  { code: 'en', label: 'Englisch' },
  { code: 'fr', label: 'Französisch' },
  { code: 'de', label: 'Deutsch' },
] as const

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}
