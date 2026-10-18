import { useState, type ReactNode } from 'react'
import { useApp } from './AppContext'
import { Icon, type IconName } from './icons'
import { Logo } from './Logo'
import { Mascot } from './Mascot'
import { primary } from './ui'

interface Slide {
  title: string
  text: string
  art: ReactNode
}

const modeIcons: [IconName, string][] = [
  ['cards', '#6366F1'],
  ['list', '#F97316'],
  ['keyboard', '#10B981'],
  ['ear', '#EC4899'],
  ['puzzle', '#0EA5E9'],
]

const SLIDES: Slide[] = [
  {
    title: 'Foto machen, fertig',
    text: 'Fotografiere die Vokabelliste aus deinem Buch. VocSnap liest die Wörter ab, du prüfst kurz und speicherst.',
    art: (
      <div className="relative">
        <Logo className="size-36 drop-shadow-xl" />
        <span className="absolute -right-4 -bottom-3 flex size-14 items-center justify-center rounded-2xl bg-orange-400 text-indigo-950 shadow-press">
          <Icon name="camera" className="size-7" />
        </span>
      </div>
    ),
  },
  {
    title: 'Lernen, wie du magst',
    text: 'Karteikarten, Multiple Choice, Tippen, Hören oder Paare finden. VocSnap merkt sich, was du schon kannst.',
    art: (
      <div className="grid grid-cols-3 gap-3">
        {modeIcons.map(([icon, color], i) => (
          <span
            key={icon}
            className={`flex size-16 animate-pop items-center justify-center rounded-2xl text-white shadow-lg ${i === 3 ? 'col-start-1' : ''}`}
            style={{ backgroundColor: color, animationDelay: `${i * 80}ms` }}
          >
            <Icon name={icon} className="size-8" />
          </span>
        ))}
      </div>
    ),
  },
  {
    title: 'Jeden Tag ein bisschen',
    text: 'Sammle XP, halte deine Serie und schalte Abzeichen frei. Snappy sagt dir, was heute dran ist.',
    art: <Mascot mood="cheer" className="w-44" />,
  },
]

// Kurze Einführung beim ersten Start. Später über „Mehr → Über VocSnap" erneut abrufbar.
export function Onboarding() {
  const { settings, updateSettings } = useApp()
  const [i, setI] = useState(0)
  if (settings.onboarded) return null
  const done = () => {
    setI(0)
    updateSettings({ onboarded: true })
  }
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-slate-950">
      <div className="flex justify-end">
        <button type="button" className="px-2 py-1 text-sm font-bold text-slate-500" onClick={done}>
          Überspringen
        </button>
      </div>
      <div key={i} className="flex flex-1 animate-slide flex-col items-center justify-center text-center">
        <div className="flex h-56 items-center justify-center">{slide.art}</div>
        <h1 className="mt-6 text-3xl font-bold">{slide.title}</h1>
        <p className="mt-3 max-w-xs text-slate-600 dark:text-slate-300">{slide.text}</p>
      </div>
      <div className="mb-5 flex justify-center gap-2" aria-label={`Schritt ${i + 1} von ${SLIDES.length}`}>
        {SLIDES.map((_, n) => (
          <span key={n} className={`h-2.5 rounded-full transition-all ${n === i ? 'w-7 bg-indigo-600' : 'w-2.5 bg-slate-300 dark:bg-slate-700'}`} />
        ))}
      </div>
      <button type="button" className={`${primary} mx-auto w-full max-w-sm`} onClick={() => (last ? done() : setI(i + 1))}>
        {last ? "Los geht's" : 'Weiter'}
      </button>
    </div>
  )
}
