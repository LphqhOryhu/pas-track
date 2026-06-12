import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayISO, periodStartISO } from '../lib/date'
import { QUESTS, type QuestType } from '../lib/quests'

interface Props {
  userId: string
  coins: number
  refreshToken: number
  onCoinsChange: (coins: number) => void
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
    </svg>
  )
}

/** Clé de période identique à celle calculée côté SQL (anti double-claim). */
function periodKey(type: QuestType): string {
  if (type === 'daily') return todayISO()
  if (type === 'weekly') return periodStartISO('weekly')
  return periodStartISO('monthly').slice(0, 7)
}

export default function QuestsMenu({ userId, coins, refreshToken, onCoinsChange }: Props) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<Record<QuestType, number>>({
    daily: 0,
    weekly: 0,
    monthly: 0,
  })
  const [claimed, setClaimed] = useState<Set<QuestType>>(new Set())
  const [claiming, setClaiming] = useState<QuestType | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setError('')

    const weekStart = periodStartISO('weekly')
    const monthStart = periodStartISO('monthly')
    const earliest = weekStart < monthStart ? weekStart : monthStart

    const [stepsRes, claimsRes] = await Promise.all([
      supabase.from('steps').select('date, count').eq('user_id', userId).gte('date', earliest),
      supabase.from('quest_claims').select('quest_type, period_key').eq('user_id', userId),
    ])

    if (stepsRes.error) {
      setError(stepsRes.error.message)
      return
    }

    const today = todayISO()
    let daily = 0
    let weekly = 0
    let monthly = 0
    for (const row of stepsRes.data ?? []) {
      if (row.date === today) daily += row.count
      if (row.date >= weekStart) weekly += row.count
      if (row.date >= monthStart) monthly += row.count
    }
    setProgress({ daily, weekly, monthly })

    const claimedSet = new Set<QuestType>()
    for (const claim of claimsRes.data ?? []) {
      const type = claim.quest_type as QuestType
      if (claim.period_key === periodKey(type)) claimedSet.add(type)
    }
    setClaimed(claimedSet)
  }, [userId])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const claimableCount = QUESTS.filter(
    (q) => progress[q.type] >= q.threshold && !claimed.has(q.type),
  ).length

  const claim = async (type: QuestType) => {
    setError('')
    setClaiming(type)
    const { data, error: rpcError } = await supabase.rpc('claim_quest', { quest_type: type })
    setClaiming(null)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setClaimed((prev) => new Set(prev).add(type))
    if (typeof data === 'number') onCoinsChange(data)
  }

  return (
    <div className="relative mr-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
      >
        <CoinIcon />
        {coins.toLocaleString('fr-FR')}
        {claimableCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {claimableCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Quêtes</h3>
            <ul className="space-y-3">
              {QUESTS.map((quest) => {
                const value = progress[quest.type]
                const pct = Math.min(100, Math.round((value / quest.threshold) * 100))
                const done = value >= quest.threshold
                const isClaimed = claimed.has(quest.type)

                return (
                  <li key={quest.type}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {quest.label}
                      </span>
                      {done ? (
                        isClaimed ? (
                          <span className="text-xs text-slate-400">Réclamée</span>
                        ) : (
                          <button
                            onClick={() => claim(quest.type)}
                            disabled={claiming === quest.type}
                            className="rounded-md bg-blue-500 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                          >
                            {claiming === quest.type ? '…' : 'Réclamer'}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">{pct}%</span>
                      )}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {value.toLocaleString('fr-FR')} / {quest.threshold.toLocaleString('fr-FR')} pas
                    </p>
                  </li>
                )
              })}
            </ul>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </>
      )}
    </div>
  )
}
