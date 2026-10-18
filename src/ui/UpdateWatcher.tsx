import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

// Neue Version nur auf ruhigen Seiten laden, nie mitten in einer Runde, beim Scan oder beim Eintragen.
const SAFE = /^\/(erfolge)?$/

let update: ((reload?: boolean) => Promise<void>) | null = null

export function UpdateWatcher() {
  const { pathname } = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    update ??= registerSW({ immediate: true, onNeedRefresh: () => setReady(true) })
  }, [])

  useEffect(() => {
    if (ready && SAFE.test(pathname)) void update?.(true)
  }, [ready, pathname])

  return null
}
