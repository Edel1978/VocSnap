import { Link } from 'react-router-dom'
import { Emoji, type EmojiName } from './Emoji'

const OPTIONS: { to: string; emoji: EmojiName; title: string; text: string; bg: string }[] = [
  { to: '/scan', emoji: 'camera', title: 'Foto scannen', text: 'Vokabelliste aus dem Buch', bg: 'bg-sky-50 dark:bg-sky-950' },
  { to: '/lektion/neu?weiter=ki', emoji: 'sparkles', title: 'Mit KI', text: 'Situation oder Text', bg: 'bg-orange-50 dark:bg-orange-950' },
  { to: '/lektion/neu', emoji: 'pencil', title: 'Leere Lektion', text: 'Wörter selbst eintragen', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { to: '/pruefung/neu?art=test', emoji: 'calendar', title: 'Test planen', text: 'Vokabeltest oder Arbeit', bg: 'bg-indigo-50 dark:bg-indigo-950' },
]

// „Neu“-Menü: alle Wege, etwas anzulegen, an einer Stelle.
export function NewSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-indigo-950/50" onClick={onClose}>
      <section
        className="w-full max-w-xl animate-slide rounded-t-[32px] bg-white p-5 pb-[max(2rem,env(safe-area-inset-bottom))] dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        aria-label="Neu anlegen"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <h2 className="text-2xl font-semibold">Was möchtest du anlegen?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {OPTIONS.map((o) => (
            <Link key={o.to} to={o.to} className={`rounded-3xl p-4 ${o.bg}`}>
              <Emoji name={o.emoji} className="size-11" />
              <b className="mt-2 block font-display">{o.title}</b>
              <span className="text-xs text-slate-500">{o.text}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
