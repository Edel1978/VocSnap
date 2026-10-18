import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { ReviewResult } from '../../data/types'
import { prompt, solution } from '../../learn/session'
import { haptic } from '../../ui/haptics'
import type { ModeProps } from '../types'

const SWIPE_DISTANCE = 100

export function Flashcard({ items, settings, onResults }: ModeProps) {
  const item = items[0]
  const swipe = settings.flashcardConfirm === 'swipe'
  const [flipped, setFlipped] = useState(false)
  const [dx, setDx] = useState(0)
  const start = useRef<number | null>(null)

  const done = (result: ReviewResult) => {
    haptic.result(result)
    onResults([{ item, result }])
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Enter/Leertaste auf einem Knopf löst den Knopf aus, nicht das Umdrehen.
      if ((e.target as Element | null)?.closest('button, input, a, textarea, select')) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight' && (swipe || flipped)) done('correct')
      else if (e.key === 'ArrowLeft' && (swipe || flipped)) done('wrong')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, swipe, flipped, onResults])

  const down = (e: PointerEvent) => {
    start.current = e.clientX
    if (swipe) e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent) => {
    if (swipe && start.current !== null) setDx(e.clientX - start.current)
  }
  const up = (e: PointerEvent) => {
    const d = start.current === null ? 0 : e.clientX - start.current
    start.current = null
    setDx(0)
    if (swipe && Math.abs(d) >= SWIPE_DISTANCE) done(d > 0 ? 'correct' : 'wrong')
    else if (Math.abs(d) < 8) setFlipped((f) => !f)
  }

  const tint =
    dx > SWIPE_DISTANCE / 2 ? 'ring-4 ring-emerald-500' : dx < -SWIPE_DISTANCE / 2 ? 'ring-4 ring-rose-500' : ''

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Karte zurückdrehen' : 'Karte umdrehen'}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null
          setDx(0)
        }}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)`, touchAction: swipe ? 'pan-y' : 'auto' }}
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm select-none dark:border-slate-800 dark:bg-slate-900 ${
          dx === 0 ? 'transition-transform' : ''
        } ${tint}`}
      >
        <p className="text-3xl font-semibold break-words">{prompt(item)}</p>
        {flipped ? (
          <div className="mt-6 space-y-3">
            <p className="text-2xl text-indigo-600 dark:text-indigo-400">{solution(item)}</p>
            {item.word.example_sentence && (
              <p className="text-sm text-slate-500 italic">{item.word.example_sentence}</p>
            )}
            {item.word.warning_note && (
              <p className="text-sm text-amber-600 dark:text-amber-400">Achtung: {item.word.warning_note}</p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-400">Tippen zum Umdrehen</p>
        )}
      </div>

      {swipe ? (
        <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
          <button type="button" className="min-h-11 rounded-xl bg-rose-100 px-3 py-2.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300" onClick={() => done('wrong')}>
            ← Nicht gewusst
          </button>
          <button type="button" className="min-h-11 rounded-xl bg-emerald-100 px-3 py-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" onClick={() => done('correct')}>
            Gewusst →
          </button>
        </div>
      ) : (
        flipped && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-xl bg-rose-600 py-3 font-semibold text-white"
              onClick={() => done('wrong')}
            >
              Nicht gewusst
            </button>
            <button
              type="button"
              className="rounded-xl bg-emerald-600 py-3 font-semibold text-white"
              onClick={() => done('correct')}
            >
              Gewusst
            </button>
          </div>
        )
      )}
    </div>
  )
}
