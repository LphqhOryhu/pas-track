import { useState } from 'react'
import { supabase } from '../lib/supabase'

const fakeEmail = (username: string) => `${username}@passtracker.local`

const inputClass =
  'mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!username.trim() || !password) {
      setError('Pseudo et mot de passe requis')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail(username),
          password,
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, username })
          if (profileError) {
            setError(profileError.message)
            return
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: fakeEmail(username),
          password,
        })
        if (signInError) {
          setError('Identifiant ou mot de passe incorrect')
          return
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="mb-8 text-center">
        <img src="/walking.png" alt="" className="mx-auto mb-4 h-24 w-24" />
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-slate-900 dark:text-white">Pas</span>
          <span className="text-blue-500">_Track</span>
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
          {isRegister ? 'Créer un compte' : 'Connexion'}
        </h2>

        <input
          type="text"
          placeholder="Pseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className={inputClass}
        />

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mb-3 w-full rounded-xl bg-blue-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {isRegister ? "S'inscrire" : 'Se connecter'}
        </button>

        <button
          onClick={() => {
            setIsRegister(!isRegister)
            setError('')
          }}
          className="w-full text-center text-sm text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
        >
          {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  )
}
