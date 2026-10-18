import { HashRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './AppContext'
import { ExamEditPage, ExamPage } from './pages/ExamPages'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage, NewLessonPage } from './pages/LessonPage'
import { PasteImportPage } from './pages/PasteImportPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { ScanPage } from './pages/ScanPage'
import { SettingsPage } from './pages/SettingsPage'

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex-1 py-3 text-center text-sm font-medium ${
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
          {profile.name}
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
              <Route path="/arbeit" element={<ExamEditPage />} />
              <Route path="/arbeit/:date" element={<ExamPage />} />
              <Route path="/einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mx-auto flex max-w-xl">
              <NavLink to="/" end className={tab}>
                Start
              </NavLink>
              <NavLink to="/lernen" className={tab}>
                Lernen
              </NavLink>
              <NavLink to="/einstellungen" className={tab}>
                Einstellungen
              </NavLink>
            </div>
          </nav>
        </div>
      </HashRouter>
    </AppProvider>
  )
}
