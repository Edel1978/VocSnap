// Erfundene Beispielwörter zum Ausprobieren, je Fremdsprache mit deutscher Übersetzung.
const EXAMPLES: Record<string, [string, string][]> = {
  en: [
    ['the dog', 'der Hund'],
    ['the house', 'das Haus'],
    ['to read', 'lesen'],
    ['happy', 'glücklich'],
    ['the friend', 'der Freund'],
    ['the school', 'die Schule'],
    ['to swim', 'schwimmen'],
    ['tomorrow', 'morgen'],
  ],
  fr: [
    ['le chien', 'der Hund'],
    ['la maison', 'das Haus'],
    ['lire', 'lesen'],
    ['content', 'glücklich'],
    ["l'ami", 'der Freund'],
    ["l'école", 'die Schule'],
    ['nager', 'schwimmen'],
    ['demain', 'morgen'],
  ],
}

// Paare passend zur Sprachrichtung der Lektion, null wenn es keine gibt.
export function exampleWords(source: string, target: string): { term: string; translation: string }[] | null {
  if (target === 'de' && EXAMPLES[source]) return EXAMPLES[source].map(([term, translation]) => ({ term, translation }))
  if (source === 'de' && EXAMPLES[target]) return EXAMPLES[target].map(([translation, term]) => ({ term, translation }))
  return null
}
