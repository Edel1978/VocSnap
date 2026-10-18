import { useState } from 'react'
import { PROVIDERS, type ProviderId } from '../config/providers'
import { hasKey } from '../providers/chain'
import { useApp } from './AppContext'
import { Section } from './components'
import { button, input, muted } from './ui'

// Reihenfolge der Scan-Anbieter und Keys. Keys bleiben im Gerät (localStorage).
export function ProviderSection() {
  const { settings, updateSettings } = useApp()
  const [showKeys, setShowKeys] = useState(false)
  const order = settings.providerOrder

  const move = (i: number, d: -1 | 1) => {
    const next = [...order]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    updateSettings({ providerOrder: next })
  }

  const setKey = (id: ProviderId, value: string) =>
    updateSettings({
      apiKeys: { ...settings.apiKeys, [id]: value.trim() },
      invalidKeys: settings.invalidKeys.filter((p) => p !== id),
    })

  return (
    <Section title="Reihenfolge der Anbieter">
      <p className={`${muted} mb-3`}>
        Beim Scan wird der Reihe nach probiert. Fällt ein Anbieter aus, übernimmt automatisch der nächste. Ohne Key wird
        ein Anbieter übersprungen. Keys bleiben nur auf diesem Gerät.
      </p>
      <ol className="space-y-3">
        {order.map((id, i) => {
          const p = PROVIDERS[id]
          const invalid = settings.invalidKeys.includes(id)
          return (
            <li key={id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{i + 1}.</span>
                <span className="flex-1 font-medium">{p.label}</span>
                <button type="button" className={button} disabled={i === 0} onClick={() => move(i, -1)} aria-label="nach oben">
                  ↑
                </button>
                <button
                  type="button"
                  className={button}
                  disabled={i === order.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="nach unten"
                >
                  ↓
                </button>
              </div>
              {p.note && <p className={`${muted} mt-1`}>{p.note}</p>}
              {p.requiresKey && (
                <div className="mt-2 space-y-1">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder={`${p.label}-Key`}
                    aria-label={`${p.label}-Key`}
                    className={`${input} ${invalid ? 'border-rose-500 dark:border-rose-500' : ''}`}
                    value={settings.apiKeys[id] ?? ''}
                    onChange={(e) => setKey(id, e.target.value)}
                  />
                  {invalid && (
                    <p className="rounded-lg bg-rose-100 p-2 text-sm font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                      Dieser Key wurde beim letzten Scan abgelehnt. Bitte prüfen oder neu erstellen.
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {!hasKey(id, settings.apiKeys) && 'Kein Key, wird übersprungen. '}
                    {p.keyUrl && (
                      <a className="text-indigo-600 underline dark:text-indigo-400" href={p.keyUrl} target="_blank" rel="noreferrer">
                        Key erstellen
                      </a>
                    )}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <button type="button" className={`${button} mt-3`} onClick={() => setShowKeys((s) => !s)}>
        {showKeys ? 'Keys verbergen' : 'Keys zeigen'}
      </button>
    </Section>
  )
}
