import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Emoji, type EmojiName } from './Emoji'
import { Icon } from './icons'
import { Mascot, type Mood } from './Mascot'
import { card, choice, chosen, heading, muted } from './ui'

export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className={`${card} animate-pop`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-2">
          {title && <h2 className={heading}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// Seitentitel mit Zurück-Pfeil für Unterseiten.
export function PageTitle({ title, back, children }: { title: string; back?: string; children?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="mb-4 flex items-center gap-2">
      {back !== undefined && (
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => (back ? navigate(back) : navigate(-1))}
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-indigo-600 active:bg-indigo-100 dark:text-indigo-300 dark:active:bg-slate-800"
        >
          <Icon name="back" />
        </button>
      )}
      {title ? <h1 className="flex-1 text-2xl font-semibold">{title}</h1> : <span className="flex-1" />}
      {children}
    </div>
  )
}

// Zeile in einer Liste wie bei den Handy-Einstellungen.
// Zeile mit Symbol, als Link (to) oder Knopf (onClick).
export function ListRow(props: { to?: string; onClick?: () => void; icon: EmojiName; color: string; title: string; detail?: string }) {
  const cls = 'flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800'
  const body = (
    <>
      <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${props.color}22` }}>
        <Emoji name={props.icon} className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{props.title}</span>
        {props.detail && <span className={`${muted} block truncate`}>{props.detail}</span>}
      </span>
      <Icon name="chevron" className="size-5 text-slate-400" />
    </>
  )
  return props.to ? (
    <Link to={props.to} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={props.onClick}>
      {body}
    </button>
  )
}

export function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${value === o.value ? chosen : choice}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Schalter für Ein/Aus-Einstellungen.
export function Toggle(props: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1">
      <span className="flex-1">
        <span className="block font-bold">{props.label}</span>
        {props.hint && <span className={`${muted} block`}>{props.hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-indigo-600 peer-focus-visible:outline-3 peer-focus-visible:outline-indigo-500 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 dark:bg-slate-700" />
    </label>
  )
}

// Freundlicher leerer Zustand mit Snappy.
export function Empty({ title, text, mood = 'happy', children }: { title: string; text?: string; mood?: Mood; children?: ReactNode }) {
  return (
    <div className="flex animate-pop flex-col items-center py-6 text-center">
      <Mascot mood={mood} className="w-28" />
      <p className="mt-2 font-display text-xl font-semibold">{title}</p>
      {text && <p className={`${muted} mt-1 max-w-xs`}>{text}</p>}
      {children && <div className="mt-4 w-full max-w-xs">{children}</div>}
    </div>
  )
}

export function Loading() {
  return <p className="py-8 text-center text-slate-500">Wird geladen …</p>
}

export function ErrorBox({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      {children ?? (
        <>
          Da ist etwas schiefgegangen.{' '}
          <button type="button" className="font-bold underline" onClick={() => location.reload()}>
            Neu laden
          </button>
        </>
      )}
    </div>
  )
}

export function StorageError() {
  return (
    <ErrorBox>
      Der Gerätespeicher ist nicht verfügbar. Im privaten Modus des Browsers kann VocSnap keine Daten speichern.
    </ErrorBox>
  )
}
