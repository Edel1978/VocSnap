// Neue Sprachen hier ergänzen. speech = Sprachcode für die Sprachausgabe des Geräts.
export const LANGUAGES = [
  { code: 'en', label: 'Englisch', speech: 'en-GB' },
  { code: 'fr', label: 'Französisch', speech: 'fr-FR' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
] as const

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

export function speechLang(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? code
}
