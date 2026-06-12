import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { periodStartISO } from '../lib/date'
import { resolveCosmetics, usernameStyle, type Cosmetics, type ShopItem } from '../lib/cosmetics'
import type { LeaderboardPeriod, LeaderboardRow } from '../lib/types'
import Avatar from './Avatar'

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdo' },
  { value: 'monthly', label: 'Mensuel' },
]

interface Props {
  currentUserId: string
  refreshToken: number
  onViewUser: (userId: string) => void
}

type RankedRow = LeaderboardRow & { cosmetics: Cosmetics }

/** Bordure podium pour le top 3, bordure neutre ensuite. */
const borderStyle = (rank: number) => {
  if (rank === 0) return 'border-2 border-amber-400'
  if (rank === 1) return 'border-2 border-slate-400'
  if (rank === 2) return 'border-2 border-orange-400'
  return 'border border-slate-100 dark:border-slate-800'
}

export default function Leaderboard({ currentUserId, refreshToken, onViewUser }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily')
  const [rows, setRows] = useState<RankedRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const start = periodStartISO(period)
    const [stepsRes, profilesRes, itemsRes] = await Promise.all([
      supabase.from('steps').select('user_id, count').gte('date', start),
      supabase
        .from('profiles')
        .select(
          'id, username, avatar_url, equipped_nameplate, equipped_avatar_frame, equipped_username',
        ),
      supabase.from('shop_items').select('*'),
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

    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
    const itemById = new Map((itemsRes.data ?? []).map((i) => [i.id, i as ShopItem]))

    const ranked: RankedRow[] = [...totals.entries()]
      .map(([userId, total]) => {
        const profile = profileById.get(userId)
        return {
          userId,
          username: profile?.username ?? 'Anonyme',
          avatarUrl: profile?.avatar_url ?? null,
          total,
          cosmetics: resolveCosmetics(profile ?? {}, itemById),
        }
      })
      .sort((a, b) => b.total - a.total)

    setRows(ranked)
    setLoading(false)
  }, [period])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard, refreshToken])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Classement</h2>

      <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune donnée sur cette période.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => {
            const plate = row.cosmetics.nameplate
            const bgClass = plate
              ? ''
              : row.userId === currentUserId
                ? 'bg-blue-50 dark:bg-blue-500/10'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60'

            return (
              <li key={row.userId}>
                <button
                  onClick={() => onViewUser(row.userId)}
                  style={plate ? { background: plate.value } : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${borderStyle(i)} ${bgClass} ${plate ? 'text-white' : ''}`}
                >
                  <Avatar
                    url={row.avatarUrl}
                    name={row.username}
                    frame={row.cosmetics.avatarFrame?.value}
                    className="h-8 w-8 text-xs"
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="truncate font-medium"
                      style={usernameStyle(row.cosmetics.username)}
                    >
                      {row.username}
                    </span>
                    {row.cosmetics.username?.title && (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          plate
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {row.cosmetics.username.title}
                      </span>
                    )}
                  </span>
                  <span className={`font-semibold ${plate ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {row.total.toLocaleString('fr-FR')}
                    <span className={`ml-1 text-sm font-normal ${plate ? 'text-white/70' : 'text-slate-400'}`}>
                      pas
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
