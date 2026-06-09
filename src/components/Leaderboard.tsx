import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { periodStartISO } from '../lib/date'
import type { LeaderboardPeriod, LeaderboardRow } from '../lib/types'

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdo' },
  { value: 'monthly', label: 'Mensuel' },
]

interface Props {
  currentUserId: string
  /** Incrémenté par le parent pour forcer un rafraîchissement après une saisie. */
  refreshToken: number
}

export default function Leaderboard({ currentUserId, refreshToken }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const start = periodStartISO(period)
    const [stepsRes, profilesRes] = await Promise.all([
      supabase.from('steps').select('user_id, count').gte('date', start),
      supabase.from('profiles').select('id, username'),
    ])

    if (stepsRes.error || profilesRes.error) {
      setError(stepsRes.error?.message ?? profilesRes.error?.message ?? 'Erreur de chargement')
      setLoading(false)
      return
    }

    const totals = new Map<string, number>()
    for (const row of stepsRes.data ?? []) {
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.count)
    }

    const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.username]))

    const ranked = [...totals.entries()]
      .map(([userId, total]) => ({
        userId,
        username: nameById.get(userId) ?? 'Anonyme',
        total,
      }))
      .sort((a, b) => b.total - a.total)

    setRows(ranked)
    setLoading(false)
  }, [period])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard, refreshToken])

  const rankLabel = (rank: number) =>
    rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`

  return (
    <section>
      <h2 className="text-lg font-bold mb-3">Classement</h2>

      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              period === p.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucune donnée sur cette période.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={row.userId}
              className={`flex justify-between items-center border rounded px-3 py-2 ${
                row.userId === currentUserId ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 text-center">{rankLabel(i)}</span>
                <span className="font-medium">{row.username}</span>
              </span>
              <span className="font-bold">
                {row.total.toLocaleString('fr-FR')} pas
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
