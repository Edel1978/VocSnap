import { PROVIDERS, type ProviderId } from '../config/providers'
import type { ApiKeys } from './registry'
import { ScanError, type OcrProvider, type ScanErrorCode, type ScanRequest, type ScanResult } from './types'

export interface ChainAttempt {
  provider: ProviderId
  // undefined = erfolgreich.
  error?: ScanErrorCode
  message?: string
}

export class ChainError extends Error {
  constructor(public attempts: ChainAttempt[]) {
    super('Kein Anbieter konnte das Foto erkennen.')
    this.name = 'ChainError'
  }
}

export interface ChainDeps {
  create: (id: ProviderId, keys: ApiKeys) => OcrProvider
  now?: () => number
  sleep?: (ms: number) => Promise<unknown>
  // Wird vor jedem Anbieter aufgerufen, z. B. für die Anzeige.
  onTry?: (id: ProviderId) => void
}

// Zeitpunkt der letzten Anfrage je Anbieter, damit das Minutenlimit auch über mehrere Seiten hinweg nicht greift.
const lastCall = new Map<ProviderId, number>()

export function resetThrottle(): void {
  lastCall.clear()
}

export function hasKey(id: ProviderId, keys: ApiKeys): boolean {
  return !PROVIDERS[id].requiresKey || Boolean(keys[id]?.trim())
}

// Probiert die Anbieter der Reihe nach. Ohne Key wird übersprungen, bei jedem Fehler geht es zum nächsten.
export async function runChain(
  order: ProviderId[],
  keys: ApiKeys,
  req: ScanRequest,
  deps: ChainDeps,
): Promise<{ result: ScanResult; attempts: ChainAttempt[] }> {
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)))
  const attempts: ChainAttempt[] = []

  for (const id of order) {
    if (!hasKey(id, keys)) continue
    const gap = PROVIDERS[id].minIntervalMs ?? 0
    const last = lastCall.get(id)
    if (gap && last !== undefined && now() - last < gap) await sleep(gap - (now() - last))
    deps.onTry?.(id)
    try {
      const result = await deps.create(id, keys).recognize(req)
      if (PROVIDERS[id].online) lastCall.set(id, now())
      attempts.push({ provider: id })
      return { result, attempts }
    } catch (e) {
      if (PROVIDERS[id].online) lastCall.set(id, now())
      const code = e instanceof ScanError ? e.code : 'failed'
      attempts.push({ provider: id, error: code, message: e instanceof Error ? e.message : undefined })
    }
  }
  throw new ChainError(attempts)
}
