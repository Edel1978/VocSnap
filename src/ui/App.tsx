import type { ReactNode } from 'react'
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext'
import { ErrorBoundary } from './ErrorBoundary'
import { Icon, type IconName } from './icons'
import { Logo } from './Logo'
import { AchievementsPage } from './pages/AchievementsPage'
import { ExamEditPage, ExamPage } from './pages/ExamPages'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage, NewLessonPage } from './pages/LessonPage'
import { GeneratePage } from './pages/GeneratePage'
import { PasteImportPage } from './pages/PasteImportPage'
import { ScanPage } from './pages/ScanPage'
import { ScanPickPage } from './pages/ScanPickPage'
import { Splash } from './Splash'
import { SettingsGroupPage, SettingsPage } from './pages/SettingsPage'
import { Tour } from './tour/Tour'
import { UpdateWatcher } from './UpdateWatcher'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/lernen', label: 'Lernen', icon: 'book' },
  { to: '/erfolge', label: 'Erfolge', icon: 'trophy' },
  { to: '/einstellungen', label: 'Mehr', icon: 'gear' },
]

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition-colors ${
    isActive
      ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300'
      : 'text-slate-400 dark:text-slate-500'
  }`

// Auf der Startseite übernimmt die Begrüßung den Kopf.
function Header() {
  const { profile } = useApp()
  if (useLocation().pathname === '/') return null
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
        <Logo className="size-9 drop-shadow" />
        <span>
          Voc<span className="text-orange-500">Snap</span>
        </span>
      </Link>
      {profile && (
        <Link
          to="/einstellungen/profil"
          aria-label="Profile"
          className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-xl dark:bg-slate-800"
        >
          {profile.avatar || '🙂'}
        </Link>
      )}
    </header>
  )
}

// Beim Seitenwechsel neu anfangen, damit ein Fehler nicht die ganze App blockiert.
function ErrorBoundaryForPath({ children }: { children: ReactNode }) {
  return <ErrorBoundary key={useLocation().pathname}>{children}</ErrorBoundary>
}

export function App() {
  return (
    <AppProvider>
      <Splash />
      <HashRouter>
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-20 size-64 rounded-full bg-indigo-200 opacity-50 blur-3xl dark:bg-indigo-900/40" />
          <div className="absolute top-80 -left-28 size-56 rounded-full bg-orange-200 opacity-50 blur-3xl dark:bg-orange-900/20" />
        </div>
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
          <Header />
          <main className="flex-1 px-4 pb-28">
            <ErrorBoundaryForPath>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<Navigate to="/einstellungen/profil" replace />} />
                <Route path="/scan" element={<ScanPickPage />} />
                <Route path="/lektion/neu" element={<NewLessonPage />} />
                <Route path="/lektion/:id" element={<LessonPage />} />
                <Route path="/lektion/:id/einfuegen" element={<PasteImportPage />} />
                <Route path="/lektion/:id/scan" element={<ScanPage />} />
                <Route path="/lektion/:id/ki" element={<GeneratePage />} />
                <Route path="/lernen" element={<LearnPage />} />
                <Route path="/erfolge" element={<AchievementsPage />} />
                <Route path="/pruefung/neu" element={<ExamEditPage />} />
                <Route path="/pruefung/:id" element={<ExamPage />} />
                <Route path="/pruefung/:id/bearbeiten" element={<ExamEditPage />} />
                <Route path="/einstellungen" element={<SettingsPage />} />
                <Route path="/einstellungen/:group" element={<SettingsGroupPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </ErrorBoundaryForPath>
          </main>
          <nav data-tour="nav" className="fixed inset-x-0 bottom-0 bg-white/90 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_-12px_rgb(79_70_229/0.35)] backdrop-blur dark:bg-slate-900/90">
            <div className="mx-auto flex max-w-xl gap-1">
              {TABS.map((t) => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'} className={tab}>
                  <Icon name={t.icon} />
                  {t.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
        <Tour />
        <UpdateWatcher />
      </HashRouter>
    </AppProvider>
  )
}
