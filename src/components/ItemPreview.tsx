import { usernameStyle, type ShopItem } from '../lib/cosmetics'

export default function ItemPreview({ item }: { item: ShopItem }) {
  if (item.type === 'nameplate' || item.type === 'background') {
    return <div className="h-8 w-full rounded-md" style={{ background: item.value }} />
  }
  if (item.type === 'avatar_frame') {
    return (
      <span className="inline-flex rounded-full p-0.75" style={{ background: item.value }}>
        <span className="h-8 w-8 rounded-full bg-white dark:bg-slate-900" />
      </span>
    )
  }
  return (
    <span className="text-lg font-bold" style={usernameStyle(item)}>
      {item.title ?? 'Pseudo'}
    </span>
  )
}
