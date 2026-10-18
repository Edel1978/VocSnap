import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROVIDERS, SCAN_MAX_EDGE, type ProviderId } from '../../config/providers'
import { ChainError, hasKey, runChain, type ChainAttempt } from '../../providers/chain'
import { createProvider } from '../../providers/registry'
import { SCAN_ERROR_TEXT, type ScannedWord } from '../../providers/types'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { shrinkImage } from '../image'
import { ReviewList } from '../ReviewList'
import { button, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

interface Collected {
  words: ScannedWord[]
  skipped: string[]
  note: string
}

type Phase =
  | { name: 'pick' }
  | { name: 'scanning'; page: number; pages: number; provider: ProviderId | null; progress: number | null }
  | { name: 'review'; result: Collected }

// Fehlversuche einer Seite als kurze Liste für die Anzeige.
function describe(attempts: ChainAttempt[]): string[] {
  return attempts.map((a) => `${PROVIDERS[a.provider].label}: ${a.message ?? SCAN_ERROR_TEXT[a.error ?? 'failed']}`)
}

export function ScanPage() {
  const { id = '' } = useParams()
  const { store, settings, updateSettings } = useApp()
  const navigate = useNavigate()
  const [lesson] = useAsync(() => store.getLesson(id), [store, id])
  const [photos, setPhotos] = useState<Blob[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>({ name: 'pick' })
  const [errors, setErrors] = useState<string[] | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const chain = settings.providerOrder.filter((p) => hasKey(p, settings.apiKeys))

  // Vorschau-URLs freigeben, sobald Fotos verworfen werden.
  useEffect(() => {
    const urls = photos.map((p) => URL.createObjectURL(p))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])

  if (lesson.state === 'loading') return <Loading />
  if (lesson.state === 'error') return <ErrorBox />
  if (!lesson.data) return <ErrorBox>Diese Lektion gibt es nicht mehr.</ErrorBox>
  const { source_lang, target_lang } = lesson.data

  const add = (files: FileList | null) => {
    setErrors(null)
    // FileList leert sich beim Zurücksetzen des Feldes, daher vorher kopieren.
    const added = files ? Array.from(files) : []
    if (added.length) setPhotos((p) => [...p, ...added])
    if (cameraRef.current) cameraRef.current.value = ''
    if (fileRef.current) fileRef.current.value = ''
  }

  const scan = async () => {
    setErrors(null)
    const collected: Collected = { words: [], skipped: [], note: '' }
    const used: string[] = []
    const failed: string[] = []
    const invalid = new Set(settings.invalidKeys)

    for (let i = 0; i < photos.length; i++) {
      const page = photos.length > 1 ? `Seite ${i + 1}: ` : ''
      setPhase({ name: 'scanning', page: i + 1, pages: photos.length, provider: null, progress: null })
      try {
        const image = await shrinkImage(photos[i], SCAN_MAX_EDGE)
        const { result, attempts } = await runChain(
          settings.providerOrder,
          settings.apiKeys,
          {
            image,
            sourceLang: source_lang,
            targetLang: target_lang,
            onProgress: (progress) => setPhase((ph) => (ph.name === 'scanning' ? { ...ph, progress } : ph)),
          },
          {
            create: createProvider,
            onTry: (provider) => setPhase((ph) => (ph.name === 'scanning' ? { ...ph, provider, progress: null } : ph)),
          },
        )
        attempts.forEach((a) => (a.error === 'invalid_key' ? invalid.add(a.provider) : !a.error && invalid.delete(a.provider)))
        collected.words.push(...result.words)
        collected.skipped.push(...result.skipped)
        used.push(`${page}${PROVIDERS[result.provider].label}`)
      } catch (e) {
        const attempts = e instanceof ChainError ? e.attempts : []
        attempts.forEach((a) => a.error === 'invalid_key' && invalid.add(a.provider))
        failed.push(`${page}nicht erkannt`, ...describe(attempts))
      }
    }

    updateSettings({ invalidKeys: [...invalid] })
    if (collected.words.length === 0 && collected.skipped.length === 0) {
      setErrors(failed.length ? failed : [SCAN_ERROR_TEXT.failed])
      setPhase({ name: 'pick' })
      return
    }
    // Fotos werden nach der Erkennung verworfen.
    setPhotos([])
    collected.note = [`Erkannt mit ${used.join(', ')}`, ...failed.filter((f) => f.endsWith('nicht erkannt'))].join(' · ')
    setPhase({ name: 'review', result: collected })
  }

  if (phase.name === 'review') {
    return (
      <ReviewList
        lessonId={id}
        initial={phase.result.words}
        skipped={phase.result.skipped}
        note={phase.result.note}
        onBack={() => confirm('Erkannte Wörter verwerfen und neu scannen?') && setPhase({ name: 'pick' })}
        onSaved={() => navigate(`/lektion/${id}`, { replace: true })}
      />
    )
  }

  if (phase.name === 'scanning') {
    return (
      <Section title={phase.pages > 1 ? `Seite ${phase.page} von ${phase.pages}` : 'Erkennung läuft'}>
        <p className="mb-3">{phase.provider ? `${PROVIDERS[phase.provider].label} …` : 'Foto wird vorbereitet …'}</p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full bg-indigo-600 transition-all ${phase.progress === null ? 'w-1/3 animate-pulse' : ''}`}
            style={phase.progress === null ? undefined : { width: `${Math.round(phase.progress * 100)}%` }}
          />
        </div>
        <p className={`${muted} mt-3`}>Fällt ein Anbieter aus, übernimmt automatisch der nächste.</p>
      </Section>
    )
  }

  return (
    <div className="space-y-4">
      <Section title="Foto scannen">
        <p className={`${muted} mb-3`}>
          Vokabelliste gerade und gut beleuchtet fotografieren. Mehrere Seiten sind möglich. Fotos werden nicht gespeichert
          und nach der Erkennung verworfen.
        </p>
        {previews.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={url} className="relative">
                <img src={url} alt={`Seite ${i + 1}`} className="h-28 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label={`Seite ${i + 1} entfernen`}
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 size-7 rounded-full bg-black/60 text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${button} py-3`} onClick={() => cameraRef.current?.click()}>
            Kamera
          </button>
          <button type="button" className={`${button} py-3`} onClick={() => fileRef.current?.click()}>
            Bilder wählen
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      </Section>

      {errors && (
        <ErrorBox>
          <span className="block font-semibold">Kein Anbieter konnte das Foto erkennen.</span>
          {errors.map((e, i) => (
            <span key={i} className="block text-sm">
              {e}
            </span>
          ))}
        </ErrorBox>
      )}

      <button type="button" className={`${primary} w-full`} disabled={photos.length === 0} onClick={scan}>
        {photos.length > 1 ? `${photos.length} Seiten erkennen` : 'Erkennen'}
      </button>
      <p className={`${muted} text-center`}>Reihenfolge: {chain.map((p) => PROVIDERS[p].label).join(' → ')}</p>
    </div>
  )
}
