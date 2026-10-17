import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> = { state: 'loading' } | { state: 'error'; error: unknown } | { state: 'ready'; data: T }

// Lädt Daten beim Einhängen und bei geänderten Abhängigkeiten neu.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): [AsyncState<T>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({ state: 'loading' })
  const [tick, setTick] = useState(0)
  const run = useCallback(load, deps)

  useEffect(() => {
    let alive = true
    run().then(
      (data) => alive && setState({ state: 'ready', data }),
      (error) => alive && setState({ state: 'error', error }),
    )
    return () => {
      alive = false
    }
  }, [run, tick])

  return [state, useCallback(() => setTick((t) => t + 1), [])]
}
