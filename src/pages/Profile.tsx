import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { computeProfileStats, type ProfileStats } from '../lib/stats'
import {
  COSMETIC_LABELS,
  COSMETIC_ORDER,
  usernameStyle,
  type Cosmetics,
  type CosmeticType,
  type ShopItem,
} from '../lib/cosmetics'
import Avatar from '../components/Avatar'
import ItemPreview from '../components/ItemPreview'

const MARATHON_KM = 42.195

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

interface Props {
  userId: string
  editable: boolean
  onBack?: () => void
}

export default function Profile({ userId, editable, onBack }: Props) {
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [itemById, setItemById] = useState<Map<string, ShopItem>>(new Map())
  const [owned, setOwned] = useState<ShopItem[]>([])
  const [equipped, setEquipped] = useState<Record<CosmeticType, string | null>>({
    nameplate: null,
    background: null,
    avatar_frame: null,
    username: null,
  })
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [profileRes, stepsRes, itemsRes, ownedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'username, avatar_url, equipped_nameplate, equipped_background, equipped_avatar_frame, equipped_username',
          )
          .eq('id', userId)
          .single(),
        supabase.from('steps').select('user_id, date, count'),
        supabase.from('shop_items').select('*'),
        supabase.from('user_items').select('item_id').eq('user_id', userId),
      ])

      const items = (itemsRes.data as ShopItem[]) ?? []
      const byId = new Map(items.map((i) => [i.id, i]))
      setItemById(byId)

      if (profileRes.data) {
        setUsername(profileRes.data.username ?? '')
        setAvatarUrl(profileRes.data.avatar_url ?? null)
        setEquipped({
          nameplate: profileRes.data.equipped_nameplate,
          background: profileRes.data.equipped_background,
          avatar_frame: profileRes.data.equipped_avatar_frame,
          username: profileRes.data.equipped_username,
        })
      }

      const ownedIds = new Set((ownedRes.data ?? []).map((r) => r.item_id))
      setOwned(items.filter((i) => ownedIds.has(i.id)))

      if (stepsRes.error) setError(stepsRes.error.message)
      else setStats(computeProfileStats(stepsRes.data ?? [], userId))
      setLoading(false)
    }
    load()
  }, [userId])

  const equip = async (item: ShopItem) => {
    setError('')
    const { error: rpcError } = await supabase.rpc('equip_item', { p_item_id: item.id })
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setEquipped((prev) => ({ ...prev, [item.type]: item.id }))
  }

  const unequip = async (type: CosmeticType) => {
    setError('')
    const { error: rpcError } = await supabase.rpc('unequip_type', { p_type: type })
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setEquipped((prev) => ({ ...prev, [type]: null }))
  }

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
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    setMessage('Photo mise à jour')
  }

  const wrap = 'mx-auto max-w-md px-4 py-8'
  if (loading) return <p className={`${wrap} text-sm text-slate-400`}>Chargement…</p>

  const cosmetics: Cosmetics = {
    nameplate: equipped.nameplate ? itemById.get(equipped.nameplate) : undefined,
    background: equipped.background ? itemById.get(equipped.background) : undefined,
    avatarFrame: equipped.avatar_frame ? itemById.get(equipped.avatar_frame) : undefined,
    username: equipped.username ? itemById.get(equipped.username) : undefined,
  }

  return (
    <div className={wrap}>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Retour
        </button>
      )}

      <div className="mb-6">
        <div
          className={`h-24 rounded-2xl ${cosmetics.background ? '' : 'bg-slate-100 dark:bg-slate-800'}`}
          style={cosmetics.background ? { background: cosmetics.background.value } : undefined}
        />
        <div className="-mt-12 flex flex-col items-center">
          <Avatar
            url={avatarUrl}
            name={username}
            frame={cosmetics.avatarFrame?.value}
            className="h-24 w-24 border-4 border-white text-3xl dark:border-slate-950"
          />
          {editable ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600 disabled:opacity-50"
            >
              {uploading ? 'Envoi…' : 'Changer la photo'}
            </button>
          ) : (
            <>
              <p
                className="mt-3 text-xl font-bold text-slate-900 dark:text-white"
                style={usernameStyle(cosmetics.username)}
              >
                {username}
              </p>
              {cosmetics.username?.title && (
                <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {cosmetics.username.title}
                </span>
              )}
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="hidden"
        />
      </div>

      {editable && (
        <>
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

          <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Mes cosmétiques
          </h2>
          {owned.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucun cosmétique
            </p>
          ) : (
            COSMETIC_ORDER.map((type) => {
              const group = owned.filter((i) => i.type === type)
              if (group.length === 0) return null
              return (
                <div key={type} className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {COSMETIC_LABELS[type]}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.map((item) => {
                      const isEquipped = equipped[type] === item.id
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex h-10 items-center justify-center">
                            <ItemPreview item={item} />
                          </div>
                          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.name}
                          </span>
                          {isEquipped ? (
                            <button
                              onClick={() => unequip(type)}
                              className="rounded-lg border border-blue-300 px-2 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
                            >
                              Équipé · retirer
                            </button>
                          ) : (
                            <button
                              onClick={() => equip(item)}
                              className="rounded-lg bg-blue-500 px-2 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                            >
                              Équiper
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

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
