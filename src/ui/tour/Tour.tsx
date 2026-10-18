import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../AppContext'
import { Mascot } from '../Mascot'
import { primary } from '../ui'
import { advancedByRoute, startTour, tourSteps, type TourStep } from './steps'

const PAD = 6
const GAP = 14
const BUBBLE_H = 190

const find = (target?: string) => (target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null)

// Position des markierten Elements, laufend nachgeführt (Laden, Scrollen, Animationen).
function useTargetRect(target?: string): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    if (!target) return setRect(null)
    let scrolled = false
    const update = () => {
      const el = find(target)
      if (el && !scrolled) {
        scrolled = true
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
      const r = el?.getBoundingClientRect() ?? null
      setRect((old) =>
        old && r && old.top === r.top && old.left === r.left && old.width === r.width && old.height === r.height ? old : r,
      )
    }
    update()
    const t = setInterval(update, 150)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      clearInterval(t)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [target])
  return rect
}

// Geführte Einführung: dunkelt die Seite ab, markiert das nächste Element und erklärt es.
export function Tour() {
  const { settings, updateSettings, profile, store } = useApp()
  const { pathname } = useLocation()
  const tour = settings.tour

  // Erster Start (oder „Mehr → Anleitung"): Ablauf je nachdem, ob schon Lektionen da sind.
  useEffect(() => {
    if (!profile || settings.onboarded || tour) return
    let off = false
    store.listLessons(profile.id).then((l) => !off && updateSettings({ tour: startTour(l.length > 0) }))
    return () => {
      off = true
    }
  }, [profile, settings.onboarded, tour, store, updateSettings])

  if (!tour || !profile) return null
  const steps = tourSteps(tour.flow)
  const step = steps[tour.step]
  if (!step) return null
  const finish = () => updateSettings({ tour: null, onboarded: true })
  const go = () => (tour.step + 1 < steps.length ? updateSettings({ tour: { ...tour, step: tour.step + 1 } }) : finish())

  return <StepView key={`${tour.flow}-${tour.step}`} step={step} next={steps[tour.step + 1]} path={pathname} go={go} finish={finish} />
}

function StepView({ step, next, path, go, finish }: { step: TourStep; next?: TourStep; path: string; go: () => void; finish: () => void }) {
  const rect = useTargetRect(step.target)
  const onPath = step.path.test(path)

  // Seitenwechsel zum nächsten Schritt.
  useEffect(() => {
    if (advancedByRoute(step, next, path)) go()
  }, [step, next, path, go])

  // Tipp auf das markierte Element.
  useEffect(() => {
    if (step.advance !== 'click' || !step.target) return
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest(`[data-tour="${step.target}"]`)) setTimeout(go, 0)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [step, go])

  // Element des nächsten Schritts ist da (z. B. Wörter gespeichert).
  useEffect(() => {
    if (step.advance !== 'appear' || !next?.target) return
    const t = setInterval(() => find(next.target) && go(), 200)
    return () => clearInterval(t)
  }, [step, next, go])

  if (!onPath) {
    return (
      <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
        <p className="flex items-center gap-2 rounded-full bg-indigo-950/90 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-white shadow-lg">
          Anleitung pausiert
          <button type="button" className="rounded-full bg-white/15 px-3 py-1 font-bold" onClick={finish}>
            Beenden
          </button>
        </p>
      </div>
    )
  }

  const skip = (
    <button type="button" className="px-2 py-1 text-sm font-bold text-slate-500" onClick={finish}>
      {step.id === 'done' ? 'Schließen' : 'Überspringen'}
    </button>
  )
  const action = step.advance === 'button' && (
    <button type="button" className={`${primary} px-5 py-2 text-base`} onClick={go}>
      {step.button ?? 'Weiter'}
    </button>
  )

  // Ohne Ziel: Karte in der Mitte.
  if (!step.target) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/60 p-6">
        <div className="w-full max-w-sm animate-pop rounded-[28px] bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
          <Mascot mood="cheer" className="mx-auto w-28" />
          {step.title && <h2 className="mt-2 text-2xl font-bold">{step.title}</h2>}
          <p className="mt-2 text-slate-600 dark:text-slate-300">{step.text}</p>
          <div className="mt-5 flex items-center justify-between">
            {skip}
            {action}
          </div>
        </div>
      </div>
    )
  }

  // Ziel noch nicht sichtbar (lädt noch oder erscheint später): nichts anzeigen.
  if (!rect) return null

  const hole = { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + 2 * PAD, height: rect.height + 2 * PAD }
  const vh = window.innerHeight
  const vw = window.innerWidth
  const below = vh - (hole.top + hole.height) >= BUBBLE_H + GAP
  const above = !below && hole.top >= BUBBLE_H + GAP
  const width = Math.min(vw - 24, 380)
  const left = Math.max(12, Math.min(vw - width - 12, rect.left + rect.width / 2 - width / 2))
  const arrowX = Math.max(24, Math.min(width - 24, rect.left + rect.width / 2 - left))
  const bubbleStyle = below
    ? { top: hole.top + hole.height + GAP, left, width }
    : above
      ? { bottom: vh - hole.top + GAP, left, width }
      : { top: 12, left, width }

  return (
    <>
      {/* Klicks nur auf das markierte Element durchlassen. */}
      {!step.free && (
        <>
          <div className="fixed inset-x-0 top-0 z-50" style={{ height: Math.max(0, hole.top) }} />
          <div className="fixed inset-x-0 bottom-0 z-50" style={{ top: hole.top + hole.height }} />
          <div className="fixed left-0 z-50" style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }} />
          <div className="fixed right-0 z-50" style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }} />
        </>
      )}
      <div
        className="pointer-events-none fixed z-50 rounded-2xl ring-4 ring-orange-400 transition-all duration-300"
        style={{ ...hole, boxShadow: step.free ? undefined : '0 0 0 9999px rgb(30 27 75 / 0.6)' }}
      >
        <span className="absolute inset-0 animate-ping rounded-2xl ring-4 ring-orange-300" />
      </div>
      <div className="fixed z-50 animate-pop rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-900" style={bubbleStyle}>
        {(below || above) && (
          <span
            className={`absolute size-4 rotate-45 bg-white dark:bg-slate-900 ${below ? '-top-2' : '-bottom-2'}`}
            style={{ left: arrowX - 8 }}
          />
        )}
        <div className="flex gap-3">
          <Mascot mood="happy" className="w-12 shrink-0" />
          <p className="text-[15px] leading-snug font-semibold">{step.text}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {skip}
          {action}
        </div>
      </div>
    </>
  )
}
