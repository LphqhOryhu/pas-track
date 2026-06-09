interface StepRow {
  user_id: string
  date: string
  count: number
}

export interface ProfileStats {
  totalSteps: number
  daysLogged: number
  averagePerDay: number
  distanceKm: number
  dailyWins: number
  weeklyWins: number
  monthlyWins: number
}

/** Longueur de foulée moyenne utilisée pour convertir les pas en distance. */
const STRIDE_METERS = 0.75

/** Clé de semaine ISO (lundi → dimanche), ex. "2026-W24". */
function isoWeekKey(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Compte les périodes (regroupées par `keyOf`) où l'utilisateur a le plus de pas.
 * En cas d'égalité au sommet, chaque ex-aequo est compté gagnant.
 */
function countWins(
  rows: StepRow[],
  userId: string,
  keyOf: (date: string) => string,
): number {
  const byPeriod = new Map<string, Map<string, number>>()
  for (const row of rows) {
    const key = keyOf(row.date)
    let users = byPeriod.get(key)
    if (!users) {
      users = new Map()
      byPeriod.set(key, users)
    }
    users.set(row.user_id, (users.get(row.user_id) ?? 0) + row.count)
  }

  let wins = 0
  for (const users of byPeriod.values()) {
    let max = 0
    for (const total of users.values()) max = Math.max(max, total)
    const mine = users.get(userId) ?? 0
    if (mine > 0 && mine === max) wins++
  }
  return wins
}

export function computeProfileStats(rows: StepRow[], userId: string): ProfileStats {
  const mine = rows.filter((r) => r.user_id === userId)
  const totalSteps = mine.reduce((sum, r) => sum + r.count, 0)
  const daysLogged = mine.length

  return {
    totalSteps,
    daysLogged,
    averagePerDay: daysLogged ? Math.round(totalSteps / daysLogged) : 0,
    distanceKm: (totalSteps * STRIDE_METERS) / 1000,
    dailyWins: countWins(rows, userId, (d) => d),
    weeklyWins: countWins(rows, userId, isoWeekKey),
    monthlyWins: countWins(rows, userId, (d) => d.slice(0, 7)),
  }
}
