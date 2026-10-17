import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { VocSnapDb } from '../data/db'
import { getDeviceId } from '../data/device'
import { DexieStore } from '../data/dexieStore'
import type { Store } from '../data/store'
import { localSettingsStore, type Settings } from '../settings/settings'

interface AppContextValue {
  store: Store
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
}

const Ctx = createContext<AppContextValue | null>(null)

const settingsStore = localSettingsStore()

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new DexieStore(new VocSnapDb(), getDeviceId()), [])
  const [settings, setSettings] = useState(() => settingsStore.load())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  const value = useMemo<AppContextValue>(
    () => ({
      store,
      settings,
      updateSettings: (patch) =>
        setSettings((prev) => {
          const next = { ...prev, ...patch }
          settingsStore.save(next)
          return next
        }),
    }),
    [store, settings],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp außerhalb von AppProvider')
  return v
}
