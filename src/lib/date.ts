import type { LeaderboardPeriod } from './types'

/** Date du jour au format YYYY-MM-DD (UTC, cohérent avec le stockage des pas). */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Date de début (incluse) de la période, au format YYYY-MM-DD.
 * - daily   : aujourd'hui
 * - weekly  : lundi de la semaine en cours
 * - monthly : 1er jour du mois en cours
 */
export function periodStartISO(period: LeaderboardPeriod): string {
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )

  if (period === 'weekly') {
    const daysSinceMonday = (start.getUTCDay() + 6) % 7
    start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  } else if (period === 'monthly') {
    start.setUTCDate(1)
  }

  return start.toISOString().split('T')[0]
}

/** Formate une date ISO en libellé jour, ex. "Vendredi 9". */
export function formatDayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
