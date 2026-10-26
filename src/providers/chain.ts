import { PROVIDERS, type ProviderId } from '../config/providers'
import type { ApiKeys } from './registry'
import { ScanError, type GenerateRequest, type OcrProvider, type ScanErrorCode, type ScanRequest, type ScanResult, type ScannedWord } from './types'

export interface ChainAttempt {
  provider: ProviderId
  // undefined = erfolgreich.
  error?: ScanErrorCode
  message?: string
}

export class ChainError extends Error {
  constructor(
    public attempts: ChainAttempt[],
    message = 'Kein Anbieter konnte das Foto erkennen.',
  ) {
    super(message)
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
export function runChain(
  order: ProviderId[],
  keys: ApiKeys,
  req: ScanRequest,
  deps: ChainDeps,
): Promise<{ result: ScanResult; attempts: ChainAttempt[] }> {
  return tryEach(order, keys, deps, (p) => p.recognize(req), 'Kein Anbieter konnte das Foto erkennen.')
}

// KI-Wortliste: wie runChain, aber nur Anbieter, die Listen erstellen können.
export function runGenerate(
  order: ProviderId[],
  keys: ApiKeys,
  req: GenerateRequest,
  deps: ChainDeps,
): Promise<{ result: ScannedWord[]; attempts: ChainAttempt[] }> {
  return tryEach(
    order.filter((id) => PROVIDERS[id].generates),
    keys,
    deps,
    (p) => p.generate!(req),
    'Kein Anbieter konnte eine Wortliste erstellen.',
  )
}

async function tryEach<T>(
  order: ProviderId[],
  keys: ApiKeys,
  deps: ChainDeps,
  call: (p: OcrProvider) => Promise<T>,
  failure: string,
): Promise<{ result: T; attempts: ChainAttempt[] }> {
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
      const result = await call(deps.create(id, keys))
      if (PROVIDERS[id].online) lastCall.set(id, now())
      attempts.push({ provider: id })
      return { result, attempts }
    } catch (e) {
      if (PROVIDERS[id].online) lastCall.set(id, now())
      const code = e instanceof ScanError ? e.code : 'failed'
      attempts.push({ provider: id, error: code, message: e instanceof Error ? e.message : undefined })
    }
  }
  throw new ChainError(attempts, failure)
}
