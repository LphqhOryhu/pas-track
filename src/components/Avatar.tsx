interface Props {
  url?: string | null
  name: string
  /** Classes de taille/texte, ex. "h-8 w-8 text-xs". */
  className?: string
  /** Valeur CSS d'un cadre cosmétique (dégradé/couleur), optionnel. */
  frame?: string | null
}

export default function Avatar({ url, name, className = '', frame }: Props) {
  const inner = url ? (
    <img src={url} alt={name} className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )

  if (!frame) return inner

  return (
    <span
      className="inline-flex shrink-0 rounded-full p-0.75"
      style={{ background: frame }}
    >
      <span className="rounded-full bg-white p-0.5 dark:bg-slate-900">{inner}</span>
    </span>
  )
}
