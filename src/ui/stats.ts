import type { Store } from '../data/store'
import { computeStates } from '../learn/leitner'
import { computeStats, type Stats } from '../learn/motivation'

export type ProfileStats = Stats & { maxBox: number }

export async function loadStats(store: Store, profileId: string, dailyGoal: number): Promise<ProfileStats> {
  const events = await store.listReviewEvents(profileId)
  const boxes = [...computeStates(events).values()].map((s) => s.box)
  return { ...computeStats(events, dailyGoal), maxBox: Math.max(0, ...boxes) }
}
