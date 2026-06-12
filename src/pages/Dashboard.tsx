import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayISO, formatDayLabel } from '../lib/date'
import type { StepEntry } from '../lib/types'
import Leaderboard from '../components/Leaderboard'

export default function Dashboard({
  onViewUser,
  onStepsChange,
}: {
  onViewUser: (userId: string) => void
  onStepsChange: () => void
}) {
  const [steps, setSteps] = useState('')
  const [entries, setEntries] = useState<StepEntry[]>([])
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  const fetchSteps = useCallback(async (uid: string) => {
    const { data, error: fetchError } = await supabase
      .from('steps')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(7)

    if (fetchError) {
      setError(fetchError.message)
      return
    }
    setEntries(data ?? [])
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
        await fetchSteps(data.user.id)
      }
    }
    init()
  }, [fetchSteps])

  const saveSteps = async () => {
    setError('')
    const count = Number(steps)
    if (!userId || !steps || Number.isNaN(count) || count < 0) {
      setError('Entre un nombre de pas valide')
      return
    }

    const { error: saveError } = await supabase
      .from('steps')
      .upsert({ user_id: userId, date: todayISO(), count }, { onConflict: 'user_id,date' })

    if (saveError) {
      setError(saveError.message)
      return
    }
    setSteps('')
    await fetchSteps(userId)
    setRefreshToken((t) => t + 1)
    onStepsChange()
  }

  const deleteEntry = async (id: string) => {
    setError('')
    const { error: deleteError } = await supabase.from('steps').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await fetchSteps(userId)
    setRefreshToken((t) => t + 1)
    onStepsChange()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Mes pas</h1>

      <div className="mb-2 flex gap-2">
        <input
          type="number"
          min="0"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveSteps()}
          className="no-spinner w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          placeholder="Nombre de pas aujourd'hui"
        />
        <button
          onClick={saveSteps}
          className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Sauver
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="mb-8 mt-6">
        <Leaderboard currentUserId={userId} refreshToken={refreshToken} onViewUser={onViewUser} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Mon historique
      </h2>
      <ul className="space-y-2">
        {entries.length === 0 && (
          <li className="text-sm text-slate-400">Aucune donnée pour le moment.</li>
        )}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="text-slate-600 dark:text-slate-300">{formatDayLabel(entry.date)}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {entry.count.toLocaleString('fr-FR')}
              <span className="ml-1 text-sm font-normal text-slate-400">pas</span>
            </span>
            <button
              onClick={() => deleteEntry(entry.id)}
              className="text-sm text-slate-300 transition-colors hover:text-red-400 dark:text-slate-600"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
