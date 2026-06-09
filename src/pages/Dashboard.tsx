import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayISO } from '../lib/date'
import type { StepEntry } from '../lib/types'
import Leaderboard from '../components/Leaderboard'

export default function Dashboard() {
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
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mes pas</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-gray-500"
        >
          Déconnexion
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="number"
          min="0"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveSteps()}
          className="border rounded px-3 py-2 w-full"
          placeholder="Nombre de pas aujourd'hui"
        />
        <button
          onClick={saveSteps}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sauver
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="mb-8">
        <Leaderboard currentUserId={userId} refreshToken={refreshToken} />
      </div>

      <h2 className="text-lg font-bold mb-3">Mon historique</h2>
      <ul className="space-y-2">
        {entries.length === 0 && (
          <li className="text-gray-400 text-sm">Aucune donnée pour le moment.</li>
        )}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex justify-between items-center border rounded px-3 py-2"
          >
            <span>{entry.date}</span>
            <span className="font-bold">{entry.count} pas</span>
            <button
              onClick={() => deleteEntry(entry.id)}
              className="text-red-400 text-sm"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
