import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROVIDERS, SCAN_MAX_EDGE, type ProviderId } from '../../config/providers'
import { createProvider, resolveProvider } from '../../providers/registry'
import { SCAN_ERROR_TEXT, ScanError, type ScanResult } from '../../providers/types'
import { useApp } from '../AppContext'
import { ErrorBox, Loading, Section } from '../components'
import { shrinkImage } from '../image'
import { ReviewList } from '../ReviewList'
import { button, muted, primary } from '../ui'
import { useAsync } from '../useAsync'

type Phase = { name: 'pick' } | { name: 'scanning'; progress: number | null } | { name: 'review'; result: ScanResult }

export function ScanPage() {
  const { id = '' } = useParams()
  const { store, settings } = useApp()
  const navigate = useNavigate()
  const [lesson] = useAsync(() => store.getLesson(id), [store, id])
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ name: 'pick' })
  const [error, setError] = useState<{ text: string; retryTesseract: boolean } | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const preferred = resolveProvider(settings.provider, settings.apiKeys)

  // Vorschau-URL freigeben, sobald das Foto verworfen wird.
  useEffect(() => {
    if (!photo) return setPreview(null)
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  if (lesson.state === 'loading') return <Loading />
  if (lesson.state === 'error') return <ErrorBox />
  if (!lesson.data) return <ErrorBox>Diese Lektion gibt es nicht mehr.</ErrorBox>
  const { source_lang, target_lang } = lesson.data

  const pick = (f: File | undefined) => {
    setError(null)
    if (f) setPhoto(f)
    if (cameraRef.current) cameraRef.current.value = ''
    if (fileRef.current) fileRef.current.value = ''
  }

  const scan = async (providerId: ProviderId) => {
    if (!photo) return
    setError(null)
    setPhase({ name: 'scanning', progress: null })
    try {
      const image = await shrinkImage(photo, SCAN_MAX_EDGE)
      const result = await createProvider(providerId, settings.apiKeys).recognize({
        image,
        sourceLang: source_lang,
        targetLang: target_lang,
        onProgress: (p) => setPhase({ name: 'scanning', progress: p }),
      })
      if (result.words.length === 0 && result.skipped.length === 0) throw new ScanError('failed')
      // Foto wird nach der Erkennung verworfen.
      setPhoto(null)
      setPhase({ name: 'review', result })
    } catch (e) {
      const text = e instanceof ScanError ? e.message : SCAN_ERROR_TEXT.failed
      setError({ text, retryTesseract: providerId !== 'tesseract' })
      setPhase({ name: 'pick' })
    }
  }

  if (phase.name === 'review') {
    return (
      <ReviewList
        lessonId={id}
        initial={phase.result.words}
        skipped={phase.result.skipped}
        onBack={() => setPhase({ name: 'pick' })}
        onSaved={() => navigate(`/lektion/${id}`, { replace: true })}
      />
    )
  }

  if (phase.name === 'scanning') {
    return (
      <Section title="Erkennung läuft">
        <p className="mb-3">{PROVIDERS[preferred].label}</p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full bg-indigo-600 transition-all ${phase.progress === null ? 'w-1/3 animate-pulse' : ''}`}
            style={phase.progress === null ? undefined : { width: `${Math.round(phase.progress * 100)}%` }}
          />
        </div>
        <p className={`${muted} mt-3`}>Das kann beim ersten Mal etwas dauern.</p>
      </Section>
    )
  }

  return (
    <div className="space-y-4">
      <Section title="Foto scannen">
        <p className={`${muted} mb-3`}>
          Vokabelliste gerade und gut beleuchtet fotografieren. Das Foto wird nicht gespeichert und nach der Erkennung
          verworfen.
        </p>
        {preview ? (
          <img src={preview} alt="Ausgewähltes Foto" className="mb-3 max-h-72 w-full rounded-xl object-contain" />
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${button} py-3`} onClick={() => cameraRef.current?.click()}>
            Kamera
          </button>
          <button type="button" className={`${button} py-3`} onClick={() => fileRef.current?.click()}>
            Bild wählen
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </Section>

      {error && (
        <div className="space-y-2">
          <ErrorBox>{error.text}</ErrorBox>
          {error.retryTesseract && photo && (
            <button type="button" className={`${button} w-full py-3`} onClick={() => scan('tesseract')}>
              Mit Tesseract versuchen
            </button>
          )}
        </div>
      )}

      <button type="button" className={`${primary} w-full`} disabled={!photo} onClick={() => scan(preferred)}>
        Erkennen
      </button>
      <p className={`${muted} text-center`}>
        Erkennung mit {PROVIDERS[preferred].label}
        {preferred === 'tesseract' && settings.provider !== 'tesseract' && ' (kein Key eingetragen)'}
      </p>
    </div>
  )
}
