import { useState } from 'react'
import { supabase } from '../lib/supabase'

const fakeEmail = (username: string) => `${username}@passtracker.local`

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
    <div className="p-4 max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">
        {isRegister ? 'Créer un compte' : 'Connexion'}
      </h1>

      <input
        type="text"
        placeholder="Pseudo"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="border rounded px-3 py-2 w-full mb-3"
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="border rounded px-3 py-2 w-full mb-3"
      />

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-3 disabled:opacity-50"
      >
        {isRegister ? "S'inscrire" : 'Se connecter'}
      </button>

      <button
        onClick={() => {
          setIsRegister(!isRegister)
          setError('')
        }}
        className="text-sm text-gray-500 w-full text-center"
      >
        {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button>
    </div>
  )
}
