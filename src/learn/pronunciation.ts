import type { ReviewResult } from '../data/types'
import type { StudyItem } from './session'
import { distance, variants } from './tolerance'

// Das Fremdsprachen-Wort einer Karte (Seite, deren Sprache nicht Deutsch ist) und das deutsche Gegenstück.
export function spokenSide(item: StudyItem): { say: string; lang: string; cue: string } {
  const { word, langs } = item
  return langs.source !== 'de' || langs.target === 'de'
    ? { say: word.term, lang: langs.source, cue: word.translation }
    : { say: word.translation, lang: langs.target, cue: word.term }
}

const ARTICLES = /^(the|a|an|le|la|les|l'|un|une|des|der|die|das|ein|eine) ?/

// Spracherkennung liefert Groß-/Kleinschreibung und Satzzeichen uneinheitlich, Artikel oft gar nicht.
function norm(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[.,!?;:"«»¿¡()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(ARTICLES, '')
}

// Vergleicht die erkannten Alternativen mit dem erwarteten Wort.
export function judgeSpeech(heard: string[], expected: string): ReviewResult {
  let best: ReviewResult = 'wrong'
  for (const v of variants(expected).map(norm)) {
    for (const h of heard.map(norm)) {
      if (!h || !v) continue
      if (h === v) return 'correct'
      const tolerance = v.length >= 6 ? 2 : v.length >= 3 ? 1 : 0
      if (tolerance && distance(h, v, tolerance) <= tolerance) best = 'half'
    }
  }
  return best
}
