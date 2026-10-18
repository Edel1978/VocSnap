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

// Großes Symbol in einer farbigen Kachel.
const Tile = ({ icon, color }: { icon: IconName; color: string }) => (
  <span className="flex size-32 animate-pop items-center justify-center rounded-[36px] text-white shadow-xl" style={{ backgroundColor: color }}>
    <Icon name={icon} className="size-16" />
  </span>
)

const SLIDES: Slide[] = [
  {
    title: 'Willkommen bei VocSnap',
    text: 'Dein Vokabeltrainer: Foto machen, lernen, können. In ein paar Schritten zeigen wir dir, wie alles funktioniert.',
    art: <Logo className="size-36 drop-shadow-xl" />,
  },
  {
    title: 'Lektion anlegen',
    text: 'Tippe auf „Neue Lektion“. Fotografiere die Vokabelliste aus deinem Buch, füge Text ein oder tippe die Wörter selbst ein. Prüfe die Wörter kurz und speichere.',
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
    title: 'Foto-Scan einrichten',
    text: 'Am besten erkennt VocSnap Fotos mit einem kostenlosen Schlüssel von Groq oder Gemini. Trag ihn unter „Mehr → Foto-Scan“ ein. Ohne Schlüssel liest die App direkt auf dem Gerät, nur etwas ungenauer.',
    art: <Tile icon="sparkle" color="#0EA5E9" />,
  },
  {
    title: 'Lernen, wie du magst',
    text: 'Unter „Lernen“ wählst du Karteikarten, Multiple Choice, Tippen, Hören oder Paare finden. „Weiterlernen“ auf der Startseite legt sofort mit den fälligen Wörtern los.',
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
    title: 'Fünf Fächer',
    text: 'Jedes Wort wandert durch fünf Fächer. Gewusst: ein Fach weiter, es kommt erst später wieder. Falsch: zurück in Fach 1. So übst du genau das, was noch nicht sitzt.',
    art: (
      <div className="flex items-end gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="flex w-11 animate-pop items-end justify-center rounded-t-xl bg-emerald-500 pb-1.5 font-display text-lg font-bold text-white shadow-lg"
            style={{ height: `${40 + n * 22}px`, opacity: 0.45 + n * 0.11, animationDelay: `${n * 80}ms` }}
          >
            {n}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: 'Klassenarbeit planen',
    text: 'Auf der Startseite planst du eine Arbeit: Datum und Lektionen wählen. VocSnap verteilt die Wörter auf die Tage bis dahin, am Tag davor gibt es eine Generalprobe.',
    art: <Tile icon="calendar" color="#F97316" />,
  },
  {
    title: 'Jeden Tag ein bisschen',
    text: 'Sammle XP, steig im Level auf und schalte Abzeichen von Bronze bis Diamant frei. Zwei Schutztage im Monat retten deine Serie, wenn du mal einen Tag aussetzt.',
    art: <Mascot mood="cheer" className="w-44" />,
  },
  {
    title: 'Deine Daten',
    text: 'Alles bleibt auf deinem Gerät, ganz ohne Konto. Sichere deine Daten ab und zu unter „Mehr → Daten“. Diese Anleitung findest du jederzeit unter „Mehr → Anleitung“.',
    art: <Tile icon="database" color="#10B981" />,
  },
]

// Einführung beim ersten Start. Später über „Mehr → Anleitung" erneut abrufbar.
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
      <div className="flex justify-between">
        <button type="button" className={`px-2 py-1 text-sm font-bold text-slate-500 ${i === 0 ? 'invisible' : ''}`} onClick={() => setI(i - 1)}>
          Zurück
        </button>
        <button type="button" className="px-2 py-1 text-sm font-bold text-slate-500" onClick={done}>
          {last ? 'Schließen' : 'Überspringen'}
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
