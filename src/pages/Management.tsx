import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayISO, formatDayLabel } from '../lib/date'
import Avatar from '../components/Avatar'
import ShopManager from '../components/ShopManager'
import type { Profile, StepEntry } from '../lib/types'

export default function Management() {
  const [users, setUsers] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<StepEntry[]>([])
  const [date, setDate] = useState(todayISO())
  const [count, setCount] = useState('')
  const [coinsInput, setCoinsInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role, coins')
        .order('username')

      if (fetchError) setError(fetchError.message)
      else setUsers((data as Profile[]) ?? [])
      setLoading(false)
    }
    loadUsers()
  }, [])

  const loadEntries = useCallback(async (userId: string) => {
    const { data, error: fetchError } = await supabase
      .from('steps')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setEntries(data ?? [])
  }, [])

  const selectUser = (user: Profile) => {
    setSelected(user)
    setEntries([])
    setError('')
    setDate(todayISO())
    setCount('')
    setCoinsInput(String(user.coins))
    loadEntries(user.id)
  }

  const saveCoins = async () => {
    if (!selected) return
    setError('')
    const value = Number(coinsInput)
    if (coinsInput === '' || Number.isNaN(value) || value < 0) {
      setError('Montant de pièces invalide')
      return
    }

    const { data, error: rpcError } = await supabase.rpc('admin_set_coins', {
      p_user_id: selected.id,
      p_coins: value,
    })
    if (rpcError) {
      setError(rpcError.message)
      return
    }

    const newBalance = typeof data === 'number' ? data : value
    setSelected({ ...selected, coins: newBalance })
    setUsers((prev) =>
      prev.map((u) => (u.id === selected.id ? { ...u, coins: newBalance } : u)),
    )
    setCoinsInput(String(newBalance))
  }

  const saveEntry = async () => {
    if (!selected) return
    setError('')
    const value = Number(count)
    if (!count || Number.isNaN(value) || value < 0) {
      setError('Nombre de pas invalide')
      return
    }

    const { error: saveError } = await supabase
      .from('steps')
      .upsert(
        { user_id: selected.id, date, count: value },
        { onConflict: 'user_id,date' },
      )

    if (saveError) {
      setError(saveError.message)
      return
    }
    setCount('')
    loadEntries(selected.id)
  }

  const deleteEntry = async (id: string) => {
    if (!selected) return
    setError('')
    const { error: deleteError } = await supabase.from('steps').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    loadEntries(selected.id)
  }

  const editEntry = (entry: StepEntry) => {
    setDate(entry.date)
    setCount(String(entry.count))
  }

  const wrap = 'mx-auto max-w-md px-4 py-8'
  if (loading) return <p className={`${wrap} text-sm text-slate-400`}>Chargement…</p>

  return (
    <div className={wrap}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Gestion</h1>

      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Utilisateurs
      </h2>
      <ul className="mb-8 space-y-2">
        {users.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => selectUser(user)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                selected?.id === user.id
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                  : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
              }`}
            >
              <Avatar url={user.avatar_url} name={user.username} className="h-8 w-8 text-xs" />
              <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                {user.username}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                {user.coins.toLocaleString('fr-FR')} pièces
              </span>
              {user.role === 'admin' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  admin
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Pièces de {selected.username}
          </h2>
          <div className="mb-6 flex gap-2">
            <input
              type="number"
              min="0"
              value={coinsInput}
              onChange={(e) => setCoinsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCoins()}
              placeholder="Solde de pièces"
              className="no-spinner w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={saveCoins}
              className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-600"
            >
              Définir
            </button>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Pas de {selected.username}
          </h2>

          <div className="mb-2 flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEntry()}
              placeholder="Pas"
              className="no-spinner w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={saveEntry}
              className="shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-600"
            >
              Valider
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <ul className="mt-4 space-y-2">
            {entries.length === 0 && (
              <li className="text-sm text-slate-400">Aucun pas enregistré.</li>
            )}
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {formatDayLabel(entry.date)}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {entry.count.toLocaleString('fr-FR')}
                  <span className="ml-1 text-sm font-normal text-slate-400">pas</span>
                </span>
                <span className="flex gap-3">
                  <button
                    onClick={() => editEntry(entry)}
                    className="text-sm text-blue-500 transition-colors hover:text-blue-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-sm text-slate-300 transition-colors hover:text-red-400 dark:text-slate-600"
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ShopManager />
    </div>
  )
}
