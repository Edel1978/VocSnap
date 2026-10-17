import { parsePairs, type ParseResult } from '../import/parsePairs'

export interface OcrWord {
  text: string
  x0: number
  y0: number
  x1: number
  y1: number
}

// Lücke ab diesem Vielfachen der Zeilenhöhe gilt als Spaltengrenze.
const COLUMN_GAP = 1.2

// Fasst erkannte Wörter zu Zeilen zusammen (auch über Spalten-Blöcke hinweg) und trennt jede Zeile in Begriff und Übersetzung.
export function wordsToPairs(words: OcrWord[]): ParseResult {
  const rows: OcrWord[][] = []
  const sorted = words.filter((w) => w.text.trim()).sort((a, b) => a.y0 + a.y1 - (b.y0 + b.y1))
  for (const w of sorted) {
    const mid = (w.y0 + w.y1) / 2
    const row = rows.find((r) => {
      const top = Math.min(...r.map((x) => x.y0))
      const bottom = Math.max(...r.map((x) => x.y1))
      return mid >= top && mid <= bottom
    })
    if (row) row.push(w)
    else rows.push([w])
  }

  const result: ParseResult = { pairs: [], skipped: [] }
  for (const row of rows) {
    row.sort((a, b) => a.x0 - b.x0)
    const line = row.map((w) => w.text).join(' ')
    const bySeparator = parsePairs(line).pairs[0]
    const pair = bySeparator ?? splitAtGap(row)
    if (pair) result.pairs.push(pair)
    else result.skipped.push(line)
  }
  return result
}

function splitAtGap(row: OcrWord[]) {
  if (row.length < 2) return null
  const heights = row.map((w) => w.y1 - w.y0).sort((a, b) => a - b)
  const h = heights[Math.floor(heights.length / 2)]
  let best = -1
  let bestGap = 0
  for (let i = 1; i < row.length; i++) {
    const gap = row[i].x0 - row[i - 1].x1
    if (gap > bestGap) {
      bestGap = gap
      best = i
    }
  }
  if (bestGap < h * COLUMN_GAP) return null
  const join = (ws: OcrWord[]) => ws.map((w) => w.text).join(' ').trim()
  return { term: join(row.slice(0, best)), translation: join(row.slice(best)) }
}
