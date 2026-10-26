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

// Eine Erkennung: Text und Sicherheit der Spracherkennung (0..1, 0 = unbekannt).
export interface Heard {
  text: string
  confidence: number
}

// Ab dieser Sicherheit gilt die Aussprache als deutlich.
export const CLEAR = 0.7

// Streng bewerten: Richtig nur, wenn die wahrscheinlichste Erkennung genau passt und deutlich war.
// Passt nur eine weniger wahrscheinliche Alternative oder war es undeutlich, zählt es halb.
// Betonung und einzelne Laute kann die Spracherkennung im Browser nicht bewerten.
export function judgeSpeech(heard: Heard[], expected: string): ReviewResult {
  const vs = variants(expected).map(norm).filter(Boolean)
  const exact = (h: string) => vs.includes(norm(h))
  const close = (h: string) =>
    vs.some((v) => {
      const tolerance = v.length >= 6 ? 2 : v.length >= 3 ? 1 : 0
      return tolerance > 0 && !!norm(h) && distance(norm(h), v, tolerance) <= tolerance
    })
  const [top, ...rest] = heard
  if (!top) return 'wrong'
  if (exact(top.text)) return top.confidence > 0 && top.confidence < CLEAR ? 'half' : 'correct'
  if (close(top.text) || rest.some((h) => exact(h.text) || close(h.text))) return 'half'
  return 'wrong'
}
