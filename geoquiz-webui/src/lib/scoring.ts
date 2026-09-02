/** Wilson score lower bound at 95% confidence (z = 1.96). Used for ranking only. */
const WILSON_Z = 1.96

export function wrongCount(correct: number, total: number): number {
  return Math.max(0, total - correct)
}

export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

/**
 * Wilson score interval lower bound for a binomial proportion.
 * Favors higher accuracy with more answers over short perfect runs.
 */
export function wilsonLowerBound(correct: number, total: number): number {
  if (total <= 0) return 0
  const n = total
  const p = correct / n
  const z = WILSON_Z
  const z2 = z * z
  const denominator = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)
  return (centre - margin) / denominator
}

export type RankableScore = {
  correct: number
  total: number
  created_at: string
}

export type AggregatableScore = RankableScore & {
  username: string
}

export type AggregatedUserScore = {
  username: string
  correct: number
  total: number
  created_at: string
}

/** Sort by Wilson (desc), then Answered (desc), then newer created_at. */
export function compareByWilsonRank(a: RankableScore, b: RankableScore): number {
  const wilsonDiff = wilsonLowerBound(b.correct, b.total) - wilsonLowerBound(a.correct, a.total)
  if (wilsonDiff !== 0) return wilsonDiff
  if (b.total !== a.total) return b.total - a.total
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

/** Sum correct/total per username; keep newest created_at for tie-breaks. */
export function aggregateScoresByUser(entries: AggregatableScore[]): AggregatedUserScore[] {
  const byUser = new Map<string, AggregatedUserScore>()

  for (const entry of entries) {
    const existing = byUser.get(entry.username)
    if (!existing) {
      byUser.set(entry.username, {
        username: entry.username,
        correct: entry.correct,
        total: entry.total,
        created_at: entry.created_at,
      })
      continue
    }

    existing.correct += entry.correct
    existing.total += entry.total
    if (new Date(entry.created_at).getTime() > new Date(existing.created_at).getTime()) {
      existing.created_at = entry.created_at
    }
  }

  return [...byUser.values()]
}
