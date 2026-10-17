import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider } from './AppContext'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex-1 py-3 text-center text-sm font-medium ${
    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
  }`

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
          <header className="px-4 pt-4 pb-2">
            <h1 className="text-xl font-bold tracking-tight">VocSnap</h1>
          </header>
          <main className="flex-1 px-4 pb-24">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mx-auto flex max-w-xl">
              <NavLink to="/" end className={tab}>
                Start
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
