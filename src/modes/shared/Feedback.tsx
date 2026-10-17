import { useEffect } from 'react'
import type { ReviewResult } from '../../data/types'

const TEXT: Record<ReviewResult, { title: string; cls: string }> = {
  correct: { title: 'Richtig!', cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  half: { title: 'Fast richtig', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  wrong: { title: 'Leider falsch', cls: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200' },
}

// Ergebnis einer Abfrage mit Lösung. Enter oder Button geht weiter.
export function Feedback({ result, solution, onNext }: { result: ReviewResult; solution: string; onNext: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onNext()
      }
    }
    // Erst nach dem aktuellen Tastendruck lauschen, sonst springt das Enter vom Absenden gleich weiter.
    const t = setTimeout(() => window.addEventListener('keydown', onKey), 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [onNext])

  const t = TEXT[result]
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl p-4 ${t.cls}`}>
        <p className="font-semibold">{t.title}</p>
        {result !== 'correct' && (
          <p className="mt-1">
            Lösung: <span className="font-semibold">{solution}</span>
          </p>
        )}
      </div>
      <button type="button" autoFocus className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white" onClick={onNext}>
        Weiter
      </button>
    </div>
  )
}
