import type { Word } from '../../data/types'

// Beispielsatz und Warnhinweis nach der Antwort.
export function Extras({ word }: { word: Word }) {
  if (!word.example_sentence && !word.warning_note) return null
  return (
    <div className="space-y-1 text-sm">
      {word.example_sentence && <p className="text-slate-500 italic">{word.example_sentence}</p>}
      {word.warning_note && <p className="text-amber-600 dark:text-amber-400">Achtung: {word.warning_note}</p>}
    </div>
  )
}
