interface Props {
  url?: string | null
  name: string
  /** Classes de taille/texte, ex. "h-8 w-8 text-xs". */
  className?: string
}

export default function Avatar({ url, name, className = '' }: Props) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 ${className}`}
    >
      {initial}
    </div>
  )
}
