import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { computeProfileStats, type ProfileStats } from '../lib/stats'
import Avatar from '../components/Avatar'

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
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const [profileRes, stepsRes] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url').eq('id', userId).single(),
        supabase.from('steps').select('user_id, date, count'),
      ])

      if (profileRes.data) {
        setUsername(profileRes.data.username ?? '')
        setAvatarUrl(profileRes.data.avatar_url ?? null)
      }
      if (stepsRes.error) setError(stepsRes.error.message)
      else setStats(computeProfileStats(stepsRes.data ?? [], userId))
      setLoading(false)
    }
    load()
  }, [userId])

  const saveUsername = async () => {
    setError('')
    setMessage('')
    const name = username.trim()
    if (!name) {
      setError('Le pseudo ne peut pas être vide')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: name })
      .eq('id', userId)
    setSaving(false)

    if (updateError) {
      setError(updateError.code === '23505' ? 'Ce pseudo est déjà pris' : updateError.message)
      return
    }
    setMessage('Profil mis à jour')
  }

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    setError('')
    setMessage('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choisis un fichier image')
      return
    }

    setUploading(true)
    const path = `${userId}/avatar`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
    setUploading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    // Cache-busting pour afficher tout de suite la nouvelle image
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    setMessage('Photo mise à jour')
  }

  const wrap = 'mx-auto max-w-md px-4 py-8'

  if (loading) return <p className={`${wrap} text-sm text-slate-400`}>Chargement…</p>

  return (
    <div className={wrap}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Mon profil</h1>

      <div className="mb-6 flex flex-col items-center">
        <Avatar url={avatarUrl} name={username} className="h-24 w-24 text-3xl" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-3 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600 disabled:opacity-50"
        >
          {uploading ? 'Envoi…' : 'Changer la photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="hidden"
        />
      </div>

      <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">Pseudo</label>
      <div className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          onClick={saveUsername}
          disabled={saving}
          className="shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {stats && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Statistiques
          </h2>

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
              ≈ {(stats.distanceKm / MARATHON_KM).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}{' '}
              marathon{stats.distanceKm / MARATHON_KM > 1 ? 's' : ''} · {stats.daysLogged} jour
              {stats.daysLogged > 1 ? 's' : ''} enregistré{stats.daysLogged > 1 ? 's' : ''}
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
        </>
      )}
    </div>
  )
}
