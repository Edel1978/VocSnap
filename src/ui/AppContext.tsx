import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { VocSnapDb } from '../data/db'
import { getDeviceId } from '../data/device'
import { DexieStore } from '../data/dexieStore'
import type { Store } from '../data/store'
import type { Profile } from '../data/types'
import { localSettingsStore, type Settings } from '../settings/settings'

type ProfilesState = { state: 'loading' } | { state: 'error' } | { state: 'ready'; list: Profile[] }

interface AppContextValue {
  store: Store
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  profiles: ProfilesState
  // Aktives Profil, null wenn noch keins existiert oder noch geladen wird.
  profile: Profile | null
  reloadProfiles: () => Promise<void>
}

const Ctx = createContext<AppContextValue | null>(null)

const settingsStore = localSettingsStore()

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new DexieStore(new VocSnapDb(), getDeviceId()), [])
  const [settings, setSettings] = useState(() => settingsStore.load())
  const [profiles, setProfiles] = useState<ProfilesState>({ state: 'loading' })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'dark' ? '#0f172a' : '#f8fafc')
  }, [settings.theme])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      settingsStore.save(next)
      return next
    })
  }, [])

  const reloadProfiles = useCallback(async () => {
    try {
      const list = await store.listProfiles()
      list.sort((a, b) => a.created_at.localeCompare(b.created_at))
      setProfiles({ state: 'ready', list })
    } catch {
      setProfiles({ state: 'error' })
    }
  }, [store])

  useEffect(() => {
    void reloadProfiles()
  }, [reloadProfiles])

  const list = profiles.state === 'ready' ? profiles.list : []
  const profile = list.find((p) => p.id === settings.activeProfileId) ?? list[0] ?? null

  const value = useMemo<AppContextValue>(
    () => ({ store, settings, updateSettings, profiles, profile, reloadProfiles }),
    [store, settings, updateSettings, profiles, profile, reloadProfiles],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp außerhalb von AppProvider')
  return v
}
