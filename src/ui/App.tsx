import { HashRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext'
import { AchievementsPage } from './pages/AchievementsPage'
import { ExamEditPage, ExamPage } from './pages/ExamPages'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage, NewLessonPage } from './pages/LessonPage'
import { PasteImportPage } from './pages/PasteImportPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { ScanPage } from './pages/ScanPage'
import { SettingsPage } from './pages/SettingsPage'

// Einfache Linien-Icons als Platzhalter.
const TABS = [
  { to: '/', label: 'Start', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { to: '/lernen', label: 'Lernen', icon: 'M4 5h16v14H4zM8 9h8M8 13h5' },
  { to: '/erfolge', label: 'Erfolge', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4' },
  { to: '/einstellungen', label: 'Einstellungen', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2M17 7l1.5-1.5M5.5 18.5L7 17M17 17l1.5 1.5M5.5 5.5L7 7' },
]

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex-1 pt-2 pb-2 text-center text-xs font-medium ${
    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
  }`

function Header() {
  const { profile } = useApp()
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <Link to="/" className="text-xl font-bold tracking-tight">
        VocSnap
      </Link>
      {profile && (
        <Link to="/profile" className="max-w-40 truncate rounded-full bg-slate-200 px-3 py-1 text-sm dark:bg-slate-800">
          <span aria-hidden="true">{profile.avatar || '🙂'}</span> {profile.name}
        </Link>
      )}
    </header>
  )
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
          <Header />
          <main className="flex-1 px-4 pb-24">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilesPage />} />
              <Route path="/lektion/neu" element={<NewLessonPage />} />
              <Route path="/lektion/:id" element={<LessonPage />} />
              <Route path="/lektion/:id/einfuegen" element={<PasteImportPage />} />
              <Route path="/lektion/:id/scan" element={<ScanPage />} />
              <Route path="/lernen" element={<LearnPage />} />
              <Route path="/erfolge" element={<AchievementsPage />} />
              <Route path="/arbeit" element={<ExamEditPage />} />
              <Route path="/arbeit/:date" element={<ExamPage />} />
              <Route path="/einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mx-auto flex max-w-xl">
              {TABS.map((t) => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'} className={tab}>
                  <svg viewBox="0 0 24 24" className="mx-auto mb-0.5 size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </HashRouter>
    </AppProvider>
  )
}
