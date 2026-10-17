import type { ReactNode } from 'react'
import { card, heading } from './ui'

export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className={card}>
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

export function Loading() {
  return <p className="py-8 text-center text-slate-500">Wird geladen …</p>
}

export function ErrorBox({ children }: { children?: ReactNode }) {
  return (
    <p className="rounded-xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      {children ?? 'Da ist etwas schiefgegangen. Bitte Seite neu laden.'}
    </p>
  )
}

export function StorageError() {
  return (
    <ErrorBox>
      Der Gerätespeicher ist nicht verfügbar. Im privaten Modus des Browsers kann VocSnap keine Daten speichern.
    </ErrorBox>
  )
}
