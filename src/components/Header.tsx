import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type View = 'home' | 'profile'
export type Theme = 'light' | 'dark'

interface Props {
  session: Session | null
  theme: Theme
  onToggleTheme: () => void
  view: View
  onNavigate: (view: View) => void
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'dark' ? (
    // Soleil
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
    // Lune
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Header({ session, theme, onToggleTheme, view, onNavigate }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => session && onNavigate('home')}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
        >
          <img src="/walking.png" alt="" className="h-8 w-8" />
          <span>
            <span className="text-slate-900 dark:text-white">Pas</span>
            <span className="text-blue-500">_Track</span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            aria-label="Changer de thème"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ThemeIcon theme={theme} />
          </button>

          {session && (
            <>
              <button
                onClick={() => onNavigate(view === 'profile' ? 'home' : 'profile')}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {view === 'profile' ? 'Accueil' : 'Profil'}
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
