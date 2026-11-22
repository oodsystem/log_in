import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, setAccessToken } from '../api'
import type { AuthResponse, Me } from '../types'
import { rolePath } from '../types'

type LoginPageProps = {
  onAuthenticated: (me: Me) => void
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: unknown } | null)?.notice

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    try {
      const auth = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setAccessToken(auth.accessToken)
      const me = await api<Me>('/api/me')
      onAuthenticated(me)
      navigate(rolePath(me.role), { replace: true })
    } catch (error) {
      setAccessToken(null)
      setMessage(error instanceof Error ? error.message : 'Request failed')
    }
  }

  return (
    <main className="auth-card">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <button type="submit">Log in</button>
      </form>
      {typeof notice === 'string' && <p>{notice}</p>}
      {message && <p>{message}</p>}
      <button className="link-button" onClick={() => navigate('/register')}>
        Need an account? Register
      </button>
    </main>
  )
}
