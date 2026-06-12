import { useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import QuestsMenu from './QuestsMenu'

export type View = 'home' | 'profile' | 'shop' | 'management'
export type Theme = 'light' | 'dark'

interface Props {
  session: Session | null
  isAdmin: boolean
  coins: number
  questRefresh: number
  onCoinsChange: (coins: number) => void
  theme: Theme
  onToggleTheme: () => void
  view: View
  onNavigate: (view: View) => void
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

export default function Header({
  session,
  isAdmin,
  coins,
  questRefresh,
  onCoinsChange,
  theme,
  onToggleTheme,
  view,
  onNavigate,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (next: View) => {
    onNavigate(next)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between px-4 py-3">
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
          {session && (
            <QuestsMenu
              userId={session.user.id}
              coins={coins}
              refreshToken={questRefresh}
              onCoinsChange={onCoinsChange}
            />
          )}

          <button
            onClick={onToggleTheme}
            aria-label="Changer de thème"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ThemeIcon theme={theme} />
          </button>

          {session && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <MenuIcon />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <MenuItem active={view === 'home'} onClick={() => go('home')}>
                      Accueil
                    </MenuItem>
                    <MenuItem active={view === 'profile'} onClick={() => go('profile')}>
                      Profil
                    </MenuItem>
                    <MenuItem active={view === 'shop'} onClick={() => go('shop')}>
                      Boutique
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem active={view === 'management'} onClick={() => go('management')}>
                        Gestion
                      </MenuItem>
                    )}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        supabase.auth.signOut()
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
