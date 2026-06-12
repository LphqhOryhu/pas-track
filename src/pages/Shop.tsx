import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COSMETIC_LABELS, COSMETIC_ORDER, type ShopItem } from '../lib/cosmetics'
import ItemPreview from '../components/ItemPreview'

interface Props {
  userId: string
  coins: number
  onCoinsChange: (coins: number) => void
}

export default function Shop({ userId, coins, onCoinsChange }: Props) {
  const [items, setItems] = useState<ShopItem[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [itemsRes, ownedRes] = await Promise.all([
        supabase.from('shop_items').select('*').order('type').order('price'),
        supabase.from('user_items').select('item_id').eq('user_id', userId),
      ])

      if (itemsRes.error) setError(itemsRes.error.message)
      else setItems((itemsRes.data as ShopItem[]) ?? [])
      setOwned(new Set((ownedRes.data ?? []).map((r) => r.item_id)))
      setLoading(false)
    }
    load()
  }, [userId])

  const buy = async (item: ShopItem) => {
    setError('')
    setBusy(item.id)
    const { data, error: rpcError } = await supabase.rpc('buy_item', { p_item_id: item.id })
    setBusy(null)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setOwned((prev) => new Set(prev).add(item.id))
    if (typeof data === 'number') onCoinsChange(data)
  }

  const wrap = 'mx-auto max-w-md px-4 py-8'
  if (loading) return <p className={`${wrap} text-sm text-slate-400`}>Chargement…</p>

  return (
    <div className={wrap}>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Boutique</h1>
      <p className="mb-6 text-sm text-slate-400">
        Achète tes cosmétiques ici, puis équipe-les depuis ton profil.
      </p>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {COSMETIC_ORDER.map((type) => {
        const group = items.filter((i) => i.type === type)
        if (group.length === 0) return null
        return (
          <section key={type} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {COSMETIC_LABELS[type]}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {group.map((item) => {
                const isOwned = owned.has(item.id)
                const tooPoor = coins < item.price
                const working = busy === item.id

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

                    {isOwned ? (
                      <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-center text-sm font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Possédé
                      </span>
                    ) : (
                      <button
                        onClick={() => buy(item)}
                        disabled={working || tooPoor}
                        className="rounded-lg bg-amber-500 px-2 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                      >
                        {item.price.toLocaleString('fr-FR')} pièces
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {items.length === 0 && (
        <p className="text-sm text-slate-400">La boutique est vide pour le moment.</p>
      )}
    </div>
  )
}
