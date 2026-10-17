import type { ReviewResult } from '../data/types'

// Artikel, die beim Eintippen fehlen dürfen (zählt dann als halber Fehler).
const ARTICLES = ['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'the', 'a', 'an', 'le', 'la', 'les', "l'", 'un', 'une', 'des']

function clean(s: string): string {
  return s.normalize('NFC').replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim()
}

// Levenshtein-Abstand, bricht ab, sobald er größer als max wird.
export function distance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

// Mehrere richtige Antworten („groß, riesig", „Auto / Wagen") und optionale Teile in Klammern („(sich) freuen").
export function variants(expected: string): string[] {
  const out = new Set<string>()
  for (const part of expected.split(/[,;/]/)) {
    const p = clean(part)
    if (!p) continue
    out.add(clean(p.replace(/[()]/g, '')))
    out.add(clean(p.replace(/\([^)]*\)/g, '')))
  }
  out.delete('')
  return [...out]
}

function stripArticle(s: string): string | null {
  const lower = s.toLowerCase()
  for (const a of ARTICLES) {
    if (a.endsWith("'") && lower.startsWith(a) && s.length > a.length) return s.slice(a.length)
    if (lower.startsWith(`${a} `)) return s.slice(a.length + 1)
  }
  return null
}

function gradeOne(input: string, expected: string): ReviewResult {
  if (input === expected) return 'correct'
  const a = input.toLowerCase()
  const b = expected.toLowerCase()
  if (a === b) return 'half'
  // Genau ein Buchstabe daneben (auch ein fehlender Akzent), erst ab drei Buchstaben.
  if (b.length >= 3 && distance(a, b, 1) <= 1) return 'half'
  const bare = stripArticle(expected)
  if (bare && a === bare.toLowerCase()) return 'half'
  return 'wrong'
}

const RANK: Record<ReviewResult, number> = { correct: 2, half: 1, wrong: 0 }

export function grade(input: string, expected: string): ReviewResult {
  const typed = clean(input)
  if (!typed) return 'wrong'
  let best: ReviewResult = 'wrong'
  for (const v of variants(expected)) {
    const r = gradeOne(typed, v)
    if (RANK[r] > RANK[best]) best = r
    if (best === 'correct') break
  }
  return best
}
