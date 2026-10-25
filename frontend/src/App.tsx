import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Mode = 'login' | 'register'

export default function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [me, setMe] = useState<string | null>(null)

  // When we have a token, ask the backend who we are
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401 || res.status === 403) {
          // token invalid or expired
          localStorage.removeItem('token')
          setToken(null)
          setMe(null)
          setMessage('Session expired. Please log in again.')
          return
        }
        const data = await res.json()
        setMe(data.username)
      })
      .catch(() => {
        if (!cancelled) setMessage('Cannot reach the server')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(data.error ?? 'Something went wrong')
        return
      }
      if (mode === 'login') {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setPassword('')
      } else {
        setMessage('Registered! You can log in now.')
        setMode('login')
      }
    } catch {
      setMessage('Cannot reach the server')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setMe(null)
    setMessage('')
  }

  if (token) {
    return (
      <div style={{ maxWidth: 320, margin: '80px auto' }}>
        <h2>{me ? `Hello, ${me}` : 'Loading...'}</h2>
        {message && <p>{message}</p>}
        <button onClick={logout}>Log out</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 320, margin: '80px auto' }}>
      <h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
      </p>
    </div>
  )
}