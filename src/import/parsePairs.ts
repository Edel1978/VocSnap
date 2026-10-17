export interface ParsedPair {
  term: string
  translation: string
}

export interface ParseResult {
  pairs: ParsedPair[]
  // Zeilen ohne erkennbares Trennzeichen.
  skipped: string[]
}

// Reihenfolge = Vorrang. Bindestriche nur mit Leerzeichen, damit „well-known" heil bleibt.
const SEPARATORS: RegExp[] = [/\t+/, /\s+=\s*|\s*=\s+|=/, /\s+[–—-]\s+/, /\s*;\s*/, /\s{2,}/, /\s*:\s+/]

export function parsePairs(text: string): ParseResult {
  const pairs: ParsedPair[] = []
  const skipped: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const pair = splitLine(line)
    if (pair) pairs.push(pair)
    else skipped.push(line)
  }
  return { pairs, skipped }
}

function splitLine(line: string): ParsedPair | null {
  for (const sep of SEPARATORS) {
    const m = sep.exec(line)
    if (!m) continue
    const term = line.slice(0, m.index).trim()
    const translation = line.slice(m.index + m[0].length).trim()
    if (term && translation) return { term, translation }
  }
  return null
}
