import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { COSMETIC_LABELS, COSMETIC_ORDER, type CosmeticType, type ShopItem } from '../lib/cosmetics'

const EMPTY = { type: 'nameplate' as CosmeticType, name: '', price: '', value: '', title: '' }

export default function ShopManager() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error: fetchError } = await supabase
      .from('shop_items')
      .select('*')
      .order('type')
      .order('price')
    if (fetchError) setError(fetchError.message)
    else setItems((data as ShopItem[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const saveItem = async () => {
    setError('')
    const price = Number(form.price)
    if (!form.name.trim() || !form.value.trim() || Number.isNaN(price) || price < 0) {
      setError('Nom, valeur et prix valides requis')
      return
    }

    const payload = {
      type: form.type,
      name: form.name.trim(),
      price,
      value: form.value.trim(),
      title: form.title.trim() || null,
    }

    setSaving(true)
    const { error: saveError } = editingId
      ? await supabase.from('shop_items').update(payload).eq('id', editingId)
      : await supabase.from('shop_items').insert(payload)
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }
    setForm(EMPTY)
    setEditingId(null)
    load()
  }

  const startEdit = (item: ShopItem) => {
    setError('')
    setEditingId(item.id)
    setForm({
      type: item.type,
      name: item.name,
      price: String(item.price),
      value: item.value,
      title: item.title ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
  }

  const deleteItem = async (id: string) => {
    setError('')
    const { error: deleteError } = await supabase.from('shop_items').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    if (editingId === id) cancelEdit()
    load()
  }

  const inputClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Boutique (catalogue)
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CosmeticType })}
          className={inputClass}
        >
          {COSMETIC_ORDER.map((t) => (
            <option key={t} value={t}>
              {COSMETIC_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          placeholder="Prix (pièces)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className={inputClass}
        />
        <input
          placeholder="Nom"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`${inputClass} col-span-2`}
        />
        <input
          placeholder="Valeur CSS (ex: linear-gradient(90deg,#f59e0b,#ef4444))"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className={`${inputClass} col-span-2`}
        />
        <input
          placeholder="Titre (optionnel, type Pseudo & titres)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`${inputClass} col-span-2`}
        />
        <div className="col-span-2 flex gap-2">
          <button
            onClick={saveItem}
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {editingId ? "Mettre à jour l'article" : "Ajouter l'article"}
          </button>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
              editingId === item.id
                ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <span className="shrink-0">
              {item.type === 'username' ? (
                <span className="text-sm font-bold" style={{ color: item.value.includes('gradient') ? undefined : item.value }}>
                  Aa
                </span>
              ) : (
                <span className="block h-6 w-10 rounded" style={{ background: item.value }} />
              )}
            </span>
            <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
              {item.name}
              <span className="ml-2 text-xs text-slate-400">{COSMETIC_LABELS[item.type]}</span>
            </span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-300">
              {item.price}
            </span>
            <button
              onClick={() => startEdit(item)}
              className="text-sm text-blue-500 transition-colors hover:text-blue-600"
            >
              Modifier
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="text-sm text-slate-300 transition-colors hover:text-red-400 dark:text-slate-600"
            >
              Suppr.
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
