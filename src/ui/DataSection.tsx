import { useRef, useState } from 'react'
import { ImportError, parseExchange } from '../data/exchange'
import { useApp } from './AppContext'
import { Section } from './components'
import { button, muted } from './ui'
import { useAsync } from './useAsync'

type Message = { ok: boolean; text: string } | null

export function DataSection() {
  const { store, reloadProfiles, settings, updateSettings } = useApp()
  const [persisted] = useAsync(async () => (await navigator.storage?.persisted?.()) ?? false, [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message>(null)
  const [busy, setBusy] = useState(false)

  const exportFile = async () => {
    setMessage(null)
    try {
      const data = await store.exportAll()
      const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vocsnap-${data.exported_at.slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      updateSettings({ lastBackup: new Date().toISOString() })
    } catch {
      setMessage({ ok: false, text: 'Export fehlgeschlagen.' })
    }
  }

  const importFile = async (file: File) => {
    setBusy(true)
    setMessage(null)
    try {
      let raw: unknown
      try {
        raw = JSON.parse(await file.text())
      } catch {
        throw new ImportError('Die Datei ist kein gültiges JSON.')
      }
      const r = await store.importAll(parseExchange(raw))
      await reloadProfiles()
      setMessage({
        ok: true,
        text: `Übernommen: ${r.profiles} Profile, ${r.lessons} Lektionen, ${r.words} Wörter, ${r.reviewEvents} Lernergebnisse.`,
      })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ImportError ? e.message : 'Import fehlgeschlagen.' })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Section title="Sichern und wiederherstellen">
      <p className={`${muted} mb-3`}>
        Sicherung als Datei. Beim Import werden Daten zusammengeführt, nichts wird gelöscht. Neuere Änderungen gewinnen.
      </p>
      <p className={`${muted} mb-3`}>
        {settings.lastBackup
          ? `Letzte Sicherung: ${new Date(settings.lastBackup).toLocaleDateString('de-DE')}`
          : 'Noch keine Sicherung auf diesem Gerät.'}
        {persisted.state === 'ready' && !persisted.data && ' Der Browser darf die Daten bei vollem Speicher löschen, sichere deshalb regelmäßig.'}
      </p>
      <div className="flex gap-2">
        <button type="button" className={`${button} flex-1 py-3`} onClick={exportFile}>
          Exportieren
        </button>
        <button type="button" className={`${button} flex-1 py-3`} disabled={busy} onClick={() => fileRef.current?.click()}>
          Importieren
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importFile(f)
        }}
      />
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {message.text}
        </p>
      )}
    </Section>
  )
}
