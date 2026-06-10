import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Management from './pages/Management'
import Header, { type Theme, type View } from './components/Header'

function initialTheme(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [view, setView] = useState<View>('home')
  const [viewedUserId, setViewedUserId] = useState('')
  const [profileHasBack, setProfileHasBack] = useState(false)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setView('home')
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      return
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'))
  }, [session])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const ownId = session?.user.id ?? ''

  // Navigation depuis le header : "Profil" ouvre toujours son propre profil.
  const handleNavigate = (next: View) => {
    if (next === 'profile') {
      setViewedUserId(ownId)
      setProfileHasBack(false)
    }
    setView(next)
  }

  // Clic sur un utilisateur dans le classement : ouvre son profil avec retour.
  const viewUser = (id: string) => {
    setViewedUserId(id)
    setProfileHasBack(true)
    setView('profile')
  }

  if (loading) return null

  const renderContent = () => {
    if (!session) return <Login />
    if (view === 'profile') {
      const targetId = viewedUserId || ownId
      return (
        <Profile
          userId={targetId}
          editable={targetId === ownId}
          onBack={profileHasBack ? () => setView('home') : undefined}
        />
      )
    }
    if (view === 'management' && isAdmin) return <Management />
    return <Dashboard onViewUser={viewUser} />
  }

  return (
    <div className="min-h-screen">
      <Header
        session={session}
        isAdmin={isAdmin}
        theme={theme}
        onToggleTheme={toggleTheme}
        view={view}
        onNavigate={handleNavigate}
      />
      {renderContent()}
    </div>
  )
}
