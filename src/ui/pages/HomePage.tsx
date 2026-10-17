import { useEffect, useState } from 'react'
import { useApp } from '../AppContext'
import { card } from '../ui'

type Status = { state: 'loading' } | { state: 'ready'; profiles: number } | { state: 'error' }

export function HomePage() {
  const { store } = useApp()
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    store
      .listProfiles()
      .then((p) => setStatus({ state: 'ready', profiles: p.length }))
      .catch(() => setStatus({ state: 'error' }))
  }, [store])

  return (
    <div className="space-y-4">
      <section className={card}>
        <h2 className="text-lg font-semibold">Willkommen</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Vokabeln fotografieren, prüfen und lernen. Profile, Lektionen und Lernen folgen in der nächsten Version.
        </p>
      </section>
      <section className={card}>
        <h2 className="text-sm font-semibold text-slate-500 uppercase">Speicher</h2>
        {status.state === 'loading' && <p className="mt-1">Wird geladen …</p>}
        {status.state === 'ready' && (
          <p className="mt-1">
            Bereit. {status.profiles === 0 ? 'Noch keine Profile.' : `${status.profiles} Profil(e).`}
          </p>
        )}
        {status.state === 'error' && (
          <p className="mt-1 text-red-600 dark:text-red-400">
            Der Gerätespeicher ist nicht verfügbar. Im privaten Modus des Browsers kann VocSnap keine Daten speichern.
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          Daten liegen nur auf diesem Gerät. Regelmäßig exportieren, der Browserspeicher kann gelöscht werden.
        </p>
      </section>
    </div>
  )
}
