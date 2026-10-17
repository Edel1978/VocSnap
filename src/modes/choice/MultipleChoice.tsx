import { useMemo, useState } from 'react'
import { buildChoices } from '../../learn/choices'
import { prompt, solution } from '../../learn/session'
import { Extras } from '../shared/Extras'
import { Feedback } from '../shared/Feedback'
import type { ModeProps } from '../types'

export function MultipleChoice({ items, pool, onResults }: ModeProps) {
  const item = items[0]
  const choices = useMemo(() => buildChoices(item, pool), [item, pool])
  const [picked, setPicked] = useState<string | null>(null)
  const right = solution(item)
  const result = picked === null ? null : picked === right ? 'correct' : 'wrong'

  const style = (c: string) => {
    if (picked === null) return 'bg-slate-100 dark:bg-slate-800'
    if (c === right) return 'bg-emerald-600 text-white'
    if (c === picked) return 'bg-rose-600 text-white'
    return 'bg-slate-100 opacity-50 dark:bg-slate-800'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-3xl font-semibold break-words">{prompt(item)}</p>
      </div>
      <div className="grid gap-2">
        {choices.map((c, i) => (
          <button
            key={c}
            type="button"
            disabled={picked !== null}
            onClick={() => setPicked(c)}
            className={`rounded-xl px-4 py-3 text-left text-lg ${style(c)}`}
          >
            <span className="mr-3 text-sm opacity-60">{i + 1}</span>
            {c}
          </button>
        ))}
      </div>
      {result && (
        <>
          <Feedback result={result} solution={right} onNext={() => onResults([{ item, result }])} />
          <Extras word={item.word} />
        </>
      )}
    </div>
  )
}
