import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    try {
      await api<{ message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      navigate('/login', {
        replace: true,
        state: { notice: 'Registration submitted. An admin must assign your role.' },
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    }
  }

  return (
    <main className="auth-card">
      <h1>Register</h1>
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
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
      <button className="link-button" onClick={() => navigate('/login')}>
        Have an account? Log in
      </button>
    </main>
  )
}
