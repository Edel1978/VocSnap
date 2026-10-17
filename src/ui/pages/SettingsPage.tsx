import { useState, type ReactNode } from 'react'
import { PROVIDERS, type ProviderId } from '../../config/providers'
import { MODES } from '../../modes/modes'
import { resolveProvider } from '../../providers/registry'
import type { Settings } from '../../settings/settings'
import { useApp } from '../AppContext'
import { button, card, input } from '../ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Choice<T extends string>({
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
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            value === o.value ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const [showKey, setShowKey] = useState(false)
  const provider = PROVIDERS[settings.provider]
  const active = resolveProvider(settings.provider, settings.apiKeys)

  const move = (i: number, d: -1 | 1) => {
    const order = [...settings.modeOrder]
    ;[order[i], order[i + d]] = [order[i + d], order[i]]
    updateSettings({ modeOrder: order })
  }

  const setLeitnerDays = (i: number, v: string) => {
    const n = Number(v)
    if (!Number.isInteger(n) || n < 1) return
    const next = [...settings.leitnerIntervals]
    next[i] = n
    updateSettings({ leitnerIntervals: next })
  }

  return (
    <div className="space-y-4">
      <Section title="Design">
        <Choice<Settings['theme']>
          value={settings.theme}
          options={[
            { value: 'dark', label: 'Dunkel' },
            { value: 'light', label: 'Hell' },
          ]}
          onChange={(theme) => updateSettings({ theme })}
        />
      </Section>

      <Section title="Karteikarten">
        <Choice<Settings['flashcardConfirm']>
          value={settings.flashcardConfirm}
          options={[
            { value: 'flip', label: 'Umdrehen' },
            { value: 'swipe', label: 'Swipe' },
          ]}
          onChange={(flashcardConfirm) => updateSettings({ flashcardConfirm })}
        />
        <p className="mt-2 text-sm text-slate-500">
          {settings.flashcardConfirm === 'flip'
            ? 'Karte umdrehen und selbst bewerten.'
            : 'Rechts wischen = gewusst, links = nicht gewusst.'}
        </p>
      </Section>

      <Section title="Tagesziel">
        <label className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className={`${input} w-24`}
            value={settings.dailyGoal}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n > 0) updateSettings({ dailyGoal: n })
            }}
          />
          <span>Vokabeln pro Tag</span>
        </label>
      </Section>

      <Section title="Reihenfolge der Lernmodi">
        <ol className="space-y-2">
          {settings.modeOrder.map((id, i) => (
            <li key={id} className="flex items-center gap-2">
              <span className="flex-1">{MODES.find((m) => m.id === id)?.label}</span>
              <button type="button" className={button} disabled={i === 0} onClick={() => move(i, -1)} aria-label="nach oben">
                ↑
              </button>
              <button
                type="button"
                className={button}
                disabled={i === settings.modeOrder.length - 1}
                onClick={() => move(i, 1)}
                aria-label="nach unten"
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Wiederholung (Tage je Fach)">
        <div className="grid grid-cols-5 gap-2">
          {settings.leitnerIntervals.map((d, i) => (
            <label key={i} className="text-center text-xs text-slate-500">
              Fach {i + 1}
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className={`${input} mt-1 px-1 text-center`}
                value={d}
                onChange={(e) => setLeitnerDays(i, e.target.value)}
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Texterkennung">
        <select
          className={input}
          value={settings.provider}
          onChange={(e) => updateSettings({ provider: e.target.value as ProviderId })}
        >
          {Object.values(PROVIDERS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {provider.requiresKey && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                placeholder="API-Key"
                className={input}
                value={settings.apiKeys[provider.id] ?? ''}
                onChange={(e) => updateSettings({ apiKeys: { ...settings.apiKeys, [provider.id]: e.target.value.trim() } })}
              />
              <button type="button" className={button} onClick={() => setShowKey((s) => !s)}>
                {showKey ? 'Verbergen' : 'Zeigen'}
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Der Key bleibt nur auf diesem Gerät. Er sollte von einem Erwachsenen erstellt werden.
              {provider.keyUrl && (
                <>
                  {' '}
                  <a className="text-indigo-600 underline dark:text-indigo-400" href={provider.keyUrl} target="_blank" rel="noreferrer">
                    Key erstellen
                  </a>
                </>
              )}
            </p>
          </div>
        )}
        {active !== settings.provider && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Kein Key eingetragen. Es wird {PROVIDERS[active].label} verwendet.
          </p>
        )}
      </Section>
    </div>
  )
}
