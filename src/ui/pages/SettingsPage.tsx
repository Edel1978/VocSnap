import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PROVIDERS } from '../../config/providers'
import { MODES, modeEnabled } from '../../modes/modes'
import { canListen } from '../../modes/speak/recognition'
import type { Settings } from '../../settings/settings'
import { useApp } from '../AppContext'
import { Choice, ListRow, PageTitle, Section, Toggle } from '../components'
import { DataSection } from '../DataSection'
import { Icon } from '../icons'
import { Logo } from '../Logo'
import { NumberField } from '../NumberField'
import { ProviderSection } from '../ProviderSection'
import { button, card, input, muted } from '../ui'
import { ProfilesPage } from './ProfilesPage'

// Übersicht „Mehr": Gruppen statt einer langen Seite.
export function SettingsPage() {
  const { settings, profile, updateSettings } = useApp()
  const navigate = useNavigate()
  const chain = settings.providerOrder.filter((p) => !PROVIDERS[p].requiresKey || settings.apiKeys[p]?.trim())
  return (
    <div>
      <PageTitle title="Mehr" />
      <div className={`${card} animate-pop divide-y divide-slate-100 overflow-hidden p-0 dark:divide-slate-800`}>
        <ListRow to="/einstellungen/profil" icon="user" color="#F97316" title="Profil" detail={profile ? `${profile.avatar} ${profile.name}` : undefined} />
        <ListRow to="/einstellungen/lernen" icon="sliders" color="#6366F1" title="Lernen" detail={`Tagesziel ${settings.dailyGoal} · Karteikarten: ${settings.flashcardConfirm === 'flip' ? 'Umdrehen' : 'Swipe'}`} />
        <ListRow to="/einstellungen/scan" icon="camera" color="#0EA5E9" title="Foto-Scan" detail={chain.map((p) => PROVIDERS[p].label).join(' → ')} />
        <ListRow to="/einstellungen/darstellung" icon="palette" color="#EC4899" title="Darstellung" detail={`${settings.theme === 'dark' ? 'Dunkel' : 'Hell'} · Töne ${settings.sounds ? 'an' : 'aus'} · Vibration ${settings.haptics ? 'an' : 'aus'}`} />
        <ListRow to="/einstellungen/daten" icon="database" color="#10B981" title="Daten" detail="Sichern und wiederherstellen" />
      </div>
      <div className={`${card} animate-pop mt-4 divide-y divide-slate-100 overflow-hidden p-0 dark:divide-slate-800`} style={{ animationDelay: '80ms' }}>
        <ListRow onClick={() => restartTour(updateSettings, navigate)} icon="sparkle" color="#F59E0B" title="Anleitung" detail="So funktioniert VocSnap" />
        <ListRow to="/einstellungen/info" icon="info" color="#64748B" title="Über VocSnap" />
      </div>
    </div>
  )
}

const TITLES: Record<string, string> = {
  profil: 'Profil',
  lernen: 'Lernen',
  scan: 'Foto-Scan',
  darstellung: 'Darstellung',
  daten: 'Daten',
  info: 'Über VocSnap',
}

export function SettingsGroupPage() {
  const { group = '' } = useParams()
  if (!TITLES[group]) return <Navigate to="/einstellungen" replace />
  return (
    <div className="space-y-4">
      <PageTitle title={TITLES[group]} back="/einstellungen" />
      {group === 'profil' && <ProfilesPage />}
      {group === 'lernen' && <LearnSettings />}
      {group === 'scan' && <ProviderSection />}
      {group === 'darstellung' && <LookSettings />}
      {group === 'daten' && <DataSection />}
      {group === 'info' && <About />}
    </div>
  )
}

function LearnSettings() {
  const { settings, updateSettings } = useApp()
  // Ausgeblendete Modi (z. B. Aussprache, wenn aus) bleiben hinten angehängt.
  const visible = settings.modeOrder.filter((m) => modeEnabled(m, settings))
  const move = (i: number, d: -1 | 1) => {
    const order = [...visible]
    ;[order[i], order[i + d]] = [order[i + d], order[i]]
    updateSettings({ modeOrder: [...order, ...settings.modeOrder.filter((m) => !order.includes(m))] })
  }
  const setLeitnerDays = (i: number, n: number) => {
    const next = [...settings.leitnerIntervals]
    next[i] = n
    updateSettings({ leitnerIntervals: next })
  }

  return (
    <>
      <Section title="Tagesziel">
        <label className="flex items-center gap-3">
          <NumberField
            className={`${input} w-24 text-center font-bold`}
            aria-label="Tagesziel"
            value={settings.dailyGoal}
            onChange={(dailyGoal) => updateSettings({ dailyGoal })}
          />
          <span>gewusste Vokabeln pro Tag</span>
        </label>
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
        <p className={`${muted} mt-2`}>
          {settings.flashcardConfirm === 'flip'
            ? 'Karte umdrehen und selbst bewerten.'
            : 'Rechts wischen = gewusst, links = nicht gewusst.'}
        </p>
      </Section>

      <Section title="Aussprache üben">
        <Toggle
          label="Lernmodus „Aussprache“"
          hint={
            canListen()
              ? 'Du sagst Wörter ins Mikrofon, die App prüft die Aussprache. Braucht Internet und Zugriff aufs Mikrofon.'
              : 'Dieser Browser kann keine Sprache erkennen. Am besten klappt es mit Chrome.'
          }
          checked={settings.pronunciation}
          onChange={(pronunciation) => updateSettings({ pronunciation })}
        />
      </Section>

      <Section title="Reihenfolge der Lernmodi">
        <ol className="space-y-2">
          {visible.map((id, i) => (
            <li key={id} className="flex items-center gap-2">
              <span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span>
              <span className="flex-1 font-semibold">{MODES.find((m) => m.id === id)?.label}</span>
              <button type="button" className={button} disabled={i === 0} onClick={() => move(i, -1)} aria-label="nach oben">
                ↑
              </button>
              <button
                type="button"
                className={button}
                disabled={i === visible.length - 1}
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
        <p className={`${muted} mb-3`}>Nach wie vielen Tagen ein Wort im jeweiligen Fach wieder drankommt.</p>
        <div className="grid grid-cols-5 gap-2">
          {settings.leitnerIntervals.map((d, i) => (
            <label key={i} className="text-center text-xs font-bold text-slate-500">
              Fach {i + 1}
              <NumberField
                className={`${input} mt-1 px-1 text-center`}
                value={d}
                max={365}
                onChange={(n) => setLeitnerDays(i, n)}
              />
            </label>
          ))}
        </div>
      </Section>
    </>
  )
}

function LookSettings() {
  const { settings, updateSettings } = useApp()
  return (
    <>
      <Section title="Design">
        <Choice<Settings['theme']>
          value={settings.theme}
          options={[
            { value: 'light', label: 'Hell' },
            { value: 'dark', label: 'Dunkel' },
          ]}
          onChange={(theme) => updateSettings({ theme })}
        />
      </Section>
      <Section title="Rückmeldung">
        <div className="space-y-3">
          <Toggle
            label="Töne"
            hint="Bei Antworten, Erfolgen und beim Start der App."
            checked={settings.sounds}
            onChange={(sounds) => updateSettings({ sounds })}
          />
          <Toggle
            label="Vibration"
            hint="Kurzes Vibrieren bei Antworten. Nur auf Android, nicht auf dem iPhone."
            checked={settings.haptics}
            onChange={(haptics) => updateSettings({ haptics })}
          />
        </div>
      </Section>
    </>
  )
}

// Einführung von vorn, auf der Startseite.
function restartTour(update: (p: Partial<Settings>) => void, navigate: (to: string) => void) {
  update({ onboarded: false, tour: null })
  navigate('/')
}

function About() {
  const { updateSettings } = useApp()
  const navigate = useNavigate()
  return (
    <>
      <section className={`${card} animate-pop flex flex-col items-center py-6 text-center`}>
        <Logo className="size-20 drop-shadow-lg" />
        <p className="mt-3 font-display text-3xl font-bold">
          Voc<span className="text-orange-500">Snap</span>
        </p>
        <p className={muted}>Fotografieren. Lernen. Können.</p>
      </section>
      <Section title="Deine Daten">
        <p className={muted}>
          Alles bleibt auf diesem Gerät, es gibt kein Konto und keinen Server. Fotos werden nach der Erkennung verworfen.
          Beim Scan mit Gemini oder Groq wird das Foto zur Erkennung an den Anbieter gesendet. Sichere deine Daten
          regelmäßig unter „Daten“.
        </p>
      </Section>
      <button type="button" className={`${button} flex w-full items-center justify-center gap-2 py-3`} onClick={() => restartTour(updateSettings, navigate)}>
        <Icon name="sparkle" className="size-5" /> Anleitung ansehen
      </button>
    </>
  )
}
