import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeProfileStats, type ProfileStats } from '../lib/stats'

const MARATHON_KM = 42.195

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

export default function Profile({ userId }: { userId: string }) {
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from('steps')
        .select('user_id, date, count')

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }
      setStats(computeProfileStats(data ?? [], userId))
      setLoading(false)
    }
    load()
  }, [userId])

  const wrap = 'mx-auto max-w-md px-4 py-8'

  if (loading) return <p className={`${wrap} text-sm text-slate-400`}>Chargement…</p>
  if (error) return <p className={`${wrap} text-sm text-red-500`}>{error}</p>
  if (!stats) return null

  const marathons = stats.distanceKm / MARATHON_KM
  const plural = (n: number) => (n > 1 ? 's' : '')

  return (
    <div className={wrap}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Mon profil</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pas totaux" value={stats.totalSteps.toLocaleString('fr-FR')} />
        <StatCard label="Moyenne / jour" value={stats.averagePerDay.toLocaleString('fr-FR')} />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Distance parcourue</p>
        <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          {stats.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
        </p>
        <p className="mt-1 text-sm text-slate-400">
          ≈ {marathons.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} marathon
          {plural(marathons)} · {stats.daysLogged} jour{plural(stats.daysLogged)} enregistré
          {plural(stats.daysLogged)}
        </p>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Premières places
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Quotidien" value={String(stats.dailyWins)} />
        <StatCard label="Hebdo" value={String(stats.weeklyWins)} />
        <StatCard label="Mensuel" value={String(stats.monthlyWins)} />
      </div>
    </div>
  )
}
