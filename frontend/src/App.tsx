import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, setAccessToken } from './api'
import AdminPage from './pages/AdminPage'
import CustomerPage from './pages/CustomerPage'
import DeliveryPage from './pages/DeliveryPage'
import LoginPage from './pages/LoginPage'
import ManagerPage from './pages/ManagerPage'
import RegisterPage from './pages/RegisterPage'
import type { Me, Role } from './types'
import { rolePath } from './types'

type ProtectedRouteProps = {
  me: Me | null
  role: Role
  children: (me: Me) => ReactNode
}

function ProtectedRoute({ me, role, children }: ProtectedRouteProps) {
  if (!me) return <Navigate to="/login" replace />
  if (me.role !== role) return <Navigate to={rolePath(me.role)} replace />
  return children(me)
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    void api<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' })
      .then((auth) => {
        setAccessToken(auth.accessToken)
        return api<Me>('/api/me')
      })
      .then(setMe)
      .catch(() => setAccessToken(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function logout() {
    await api<void>('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    setAccessToken(null)
    setMe(null)
    navigate('/login', { replace: true })
  }

  if (isLoading) {
    return <main className="auth-card"><p>Loading your account...</p></main>
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={me ? rolePath(me.role) : '/login'} replace />}
      />
      <Route
        path="/login"
        element={me
          ? <Navigate to={rolePath(me.role)} replace />
          : <LoginPage onAuthenticated={setMe} />}
      />
      <Route
        path="/register"
        element={me ? <Navigate to={rolePath(me.role)} replace /> : <RegisterPage />}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute me={me} role="ADMIN">
            {(currentMe) => <AdminPage me={currentMe} onLogout={logout} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute me={me} role="MANAGER">
            {(currentMe) => <ManagerPage me={currentMe} onLogout={logout} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute me={me} role="DELIVERY_GUY">
            {(currentMe) => <DeliveryPage me={currentMe} onLogout={logout} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer"
        element={
          <ProtectedRoute me={me} role="CUSTOMER">
            {(currentMe) => <CustomerPage me={currentMe} onLogout={logout} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={me ? rolePath(me.role) : '/login'} replace />}
      />
    </Routes>
  )
}
