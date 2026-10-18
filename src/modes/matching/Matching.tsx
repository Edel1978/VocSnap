import { useMemo, useState } from 'react'
import { isMatch, matchingResults } from '../../learn/matching'
import { prompt, shuffle, solution } from '../../learn/session'
import type { ModeProps } from '../types'

// Links Abfragen, rechts Lösungen. Erst links tippen, dann rechts.
export function Matching({ items, onResults }: ModeProps) {
  const right = useMemo(() => shuffle(items.map((_, i) => i)), [items])
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [usedRight, setUsedRight] = useState<Set<number>>(new Set())
  const [missed, setMissed] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<number | null>(null)

  const choose = (r: number) => {
    if (picked === null || usedRight.has(r)) return
    if (isMatch(items[picked], items[r])) {
      const nextDone = new Set(done).add(picked)
      setDone(nextDone)
      setUsedRight(new Set(usedRight).add(r))
      setPicked(null)
      if (nextDone.size === items.length) setTimeout(() => onResults(matchingResults(items, missed)), 400)
    } else {
      setMissed(new Set(missed).add(picked))
      setFlash(r)
      setTimeout(() => setFlash(null), 400)
    }
  }

  const cell = 'min-h-14 w-full rounded-xl px-3 py-2 text-left break-words transition-colors'

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-500">Links ein Wort wählen, dann rechts die passende Übersetzung.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              disabled={done.has(i)}
              onClick={() => setPicked(i)}
              className={`${cell} ${
                done.has(i)
                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
                  : picked === i
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {prompt(it)}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((r) => (
            <button
              key={r}
              type="button"
              disabled={usedRight.has(r)}
              onClick={() => choose(r)}
              className={`${cell} ${
                usedRight.has(r)
                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
                  : flash === r
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {solution(items[r])}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
