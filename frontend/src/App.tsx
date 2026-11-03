import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Role = 'PENDING' | 'ADMIN' | 'MANAGER' | 'DELIVERY_GUY' | 'CUSTOMER'
type Mode = 'login' | 'register'
type DeliveryStatus = 'REQUESTED' | 'ASSIGNED' | 'DELIVERED'

type AuthResponse = { accessToken: string; role: Role }
type Me = { username: string; role: Role }
type UserView = { id: number; username: string; role: Role; blocked: boolean; available: boolean }
type Delivery = {
  id: number
  productName: string
  weight: number
  destination: string
  status: DeliveryStatus
  customer: string
  deliveryGuy: string | null
}
type DeliveryPerson = { id: number; username: string }
type AdminDelivery = Delivery
const operationalRoles: Role[] = ['CUSTOMER', 'DELIVERY_GUY', 'MANAGER']

function isOperationalRole(value: string): value is Role {
  return operationalRoles.some((role) => role === value)
}

function roleLabel(role: Role): string {
  if (role === 'DELIVERY_GUY') return 'Delivery guy'
  if (role === 'CUSTOMER') return 'Customer'
  if (role === 'MANAGER') return 'Manager'
  return role
}

let accessToken: string | null = null

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(path, { ...options, headers, credentials: 'include' })
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data
      ? String(data.error)
      : 'Request failed'
    throw new Error(message)
  }
  return data as T
}

export default function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    void api<AuthResponse>('/api/auth/refresh')
      .then((auth) => {
        accessToken = auth.accessToken
        return api<Me>('/api/me')
      })
      .then(setMe)
      .catch(() => { accessToken = null })
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      if (mode === 'register') {
        await api<{ message: string }>('/api/auth/register', {
          method: 'POST', body: JSON.stringify({ username, password }),
        })
        setMode('login')
        setMessage('Registration submitted. An admin must assign your role.')
      } else {
        const auth = await api<AuthResponse>('/api/auth/login', {
          method: 'POST', body: JSON.stringify({ username, password }),
        })
        accessToken = auth.accessToken
        setMe(await api<Me>('/api/me'))
        setPassword('')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    }
  }

  async function logout() {
    await api<void>('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    accessToken = null
    setMe(null)
  }

  if (!me) {
    return (
      <main className="auth-card">
        <h1>{mode === 'login' ? 'Log in' : 'Register'}</h1>
        <form onSubmit={handleSubmit}>
          <input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
        </form>
        {message && <p>{message}</p>}
        <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <header><div><h1>Delivery dashboard</h1><p>{me.username} · {me.role}</p></div><button onClick={logout}>Log out</button></header>
      {me.role === 'ADMIN' && <AdminPanel />}
      {me.role === 'MANAGER' && <ManagerPanel />}
      {me.role === 'DELIVERY_GUY' && <DeliveryPanel />}
      {me.role === 'CUSTOMER' && <CustomerPanel />}
    </main>
  )
}

function AdminPanel() {
  const [users, setUsers] = useState<UserView[]>([])
  const [pendingRoles, setPendingRoles] = useState<Record<number, Role>>({})
  const [roleChange, setRoleChange] = useState<{ user: UserView; role: Role } | null>(null)
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const load = () => {
    void Promise.all([api<UserView[]>('/api/admin/users'), api<AdminDelivery[]>('/api/admin/deliveries')])
      .then(([nextUsers, nextDeliveries]) => { setUsers(nextUsers); setDeliveries(nextDeliveries) })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load admin data'))
  }
  useEffect(load, [])
  async function setRole(id: number, role: Role) {
    try {
      await api<UserView>(`/api/admin/users/${id}/role`, {
        method: 'PATCH', body: JSON.stringify({ role }),
      })
      setMessage('Role updated')
      load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Update failed') }
  }
  async function setBlocked(id: number, blocked: boolean) {
    try {
      await api<UserView>(`/api/admin/users/${id}/block?blocked=${String(blocked)}`, { method: 'PATCH' })
      setMessage(blocked ? 'User blocked' : 'User unblocked')
      load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Update failed') }
  }
  function choosePendingRole(id: number, role: Role) {
    setPendingRoles((current) => ({ ...current, [id]: role }))
  }
  async function confirmRoleChange() {
    if (!roleChange) return
    await setRole(roleChange.user.id, roleChange.role)
    setRoleChange(null)
  }
  const pendingUsers = users.filter((user) => user.role === 'PENDING')
  const approvedUsers = users.filter((user) => user.role !== 'PENDING')
  const visibleDeliveries = deliveries.filter((delivery) => `${delivery.productName} ${delivery.destination} ${delivery.customer}`.toLowerCase().includes(search.toLowerCase()))
  const renderUserTable = (list: UserView[], pending: boolean) => <table><thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{list.map((user) => <tr key={user.id}>
    <td>{user.username}</td><td>{user.role}</td><td>{user.blocked ? 'Blocked' : pending ? 'Awaiting approval' : 'Active'}</td>
    <td>{user.role === 'ADMIN' ? <span>Protected admin</span> : pending ? <><select value={pendingRoles[user.id] ?? ''} onChange={(event) => { if (isOperationalRole(event.target.value)) choosePendingRole(user.id, event.target.value) }}><option value="" disabled>Select role</option><option value="CUSTOMER">Customer</option><option value="DELIVERY_GUY">Delivery guy</option><option value="MANAGER">Manager</option></select><button disabled={!pendingRoles[user.id]} onClick={() => { const role = pendingRoles[user.id]; if (role) void setRole(user.id, role) }}>Approve</button><button onClick={() => void setBlocked(user.id, true)}>Disapprove</button></> : <><span>Change role:</span>{operationalRoles.map((role) => <button key={role} disabled={role === user.role} onClick={() => setRoleChange({ user, role })}>{role === user.role ? `${roleLabel(role)} (current)` : roleLabel(role)}</button>)}<button onClick={() => void setBlocked(user.id, !user.blocked)}>{user.blocked ? 'Unblock' : 'Block'}</button></>}</td>
  </tr>)}</tbody></table>
  return <section><h2>Manage users and deliveries</h2><input placeholder="Search users or deliveries" value={search} onChange={(event) => setSearch(event.target.value)} />{message && <p>{message}</p>}<h3>Pending registrations</h3>{renderUserTable(pendingUsers.filter((user) => user.username.toLowerCase().includes(search.toLowerCase())), true)}<h3>Approved members</h3>{renderUserTable(approvedUsers.filter((user) => user.username.toLowerCase().includes(search.toLowerCase())), false)}<h3>All delivery information</h3><table><thead><tr><th>Product</th><th>Customer</th><th>Weight</th><th>Destination</th><th>Status</th><th>Delivery guy</th></tr></thead><tbody>{visibleDeliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.productName}</td><td>{delivery.customer}</td><td>{delivery.weight}</td><td>{delivery.destination}</td><td>{delivery.status}</td><td>{delivery.deliveryGuy ?? 'Unassigned'}</td></tr>)}</tbody></table>{roleChange && <div className="modal-backdrop" onClick={() => setRoleChange(null)}><div className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title" onClick={(event) => event.stopPropagation()}><h3 id="role-dialog-title">Change role?</h3><p>Do you want to change <strong>{roleChange.user.username}</strong> from <strong>{roleLabel(roleChange.user.role)}</strong> to <strong>{roleLabel(roleChange.role)}</strong>?</p><div className="modal-actions"><button onClick={() => void confirmRoleChange()}>Yes, change role</button><button onClick={() => setRoleChange(null)}>No, keep current role</button></div></div></div>}</section>
}

function ManagerPanel() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([])
  const [search, setSearch] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null)
  const load = () => { void api<Delivery[]>('/api/manager/deliveries').then(setDeliveries) }
  useEffect(load, [])
  async function showAvailable(deliveryId: number) { setSelectedDelivery(deliveryId); setDeliveryPeople(await api<DeliveryPerson[]>('/api/manager/delivery-guys')) }
  async function assign(deliveryId: number, deliveryGuyId: string) { if (!deliveryGuyId) return; await api(`/api/manager/deliveries/${deliveryId}/assign`, { method: 'PATCH', body: JSON.stringify({ deliveryGuyId: Number(deliveryGuyId) }) }); setSelectedDelivery(null); load() }
  const visibleDeliveries = deliveries.filter((delivery) => `${delivery.productName} ${delivery.destination} ${delivery.customer}`.toLowerCase().includes(search.toLowerCase()))
  return <section><h2>Manager operations</h2><input placeholder="Search delivery requests" value={search} onChange={(event) => setSearch(event.target.value)} /><h3>Delivery requests</h3><table><thead><tr><th>Product</th><th>Customer</th><th>Weight</th><th>Destination</th><th>Status</th><th>Assignment</th></tr></thead><tbody>{visibleDeliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.productName}</td><td>{delivery.customer}</td><td>{delivery.weight}</td><td>{delivery.destination}</td><td>{delivery.status}</td><td>{delivery.status === 'REQUESTED' && (selectedDelivery === delivery.id ? <select defaultValue="" onChange={(event) => void assign(delivery.id, event.target.value)}><option value="">Select available delivery guy</option>{deliveryPeople.map((person) => <option key={person.id} value={person.id}>{person.username}</option>)}</select> : <button onClick={() => void showAvailable(delivery.id)}>Show available delivery guys</button>)}{delivery.status !== 'REQUESTED' && (delivery.deliveryGuy ?? 'Unassigned')}</td></tr>)}</tbody></table></section>
}

function DeliveryPanel() {
  const [available, setAvailable] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const load = () => { void api<Delivery[]>('/api/delivery/deliveries').then(setDeliveries) }
  useEffect(load, [])
  async function toggle() { const next = !available; await api('/api/delivery/availability?available=' + String(next), { method: 'PATCH' }); setAvailable(next) }
  async function delivered(id: number) { await api(`/api/delivery/deliveries/${id}/delivered`, { method: 'PATCH' }); load() }
  return <section><h2>Delivery work</h2><button onClick={() => void toggle()}>Available: {available ? 'yes' : 'no'}</button><table><thead><tr><th>Product</th><th>Weight</th><th>Destination</th><th>Status</th><th>Action</th></tr></thead><tbody>{deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.productName}</td><td>{delivery.weight}</td><td>{delivery.destination}</td><td>{delivery.status}</td><td>{delivery.status === 'ASSIGNED' && <button onClick={() => void delivered(delivery.id)}>Mark delivered</button>}</td></tr>)}</tbody></table></section>
}

function CustomerPanel() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [productName, setProductName] = useState('')
  const [weight, setWeight] = useState('')
  const [destination, setDestination] = useState('')
  const load = () => { void api<Delivery[]>('/api/customer/deliveries').then(setDeliveries) }
  useEffect(load, [])
  async function request(event: FormEvent) { event.preventDefault(); await api('/api/customer/deliveries', { method: 'POST', body: JSON.stringify({ productName, weight: Number(weight), destination }) }); setProductName(''); setWeight(''); setDestination(''); load() }
  return <section><h2>Request a delivery</h2><form onSubmit={(event) => void request(event)}><input placeholder="Product name" value={productName} onChange={(event) => setProductName(event.target.value)} required /><input type="number" min="0.01" step="0.01" placeholder="Weight" value={weight} onChange={(event) => setWeight(event.target.value)} required /><input placeholder="Destination" value={destination} onChange={(event) => setDestination(event.target.value)} required /><button type="submit">Request delivery</button></form><h2>My deliveries</h2><table><thead><tr><th>Product</th><th>Weight</th><th>Destination</th><th>Status</th><th>Delivery guy</th></tr></thead><tbody>{deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.productName}</td><td>{delivery.weight}</td><td>{delivery.destination}</td><td>{delivery.status}</td><td>{delivery.deliveryGuy ?? 'Not assigned'}</td></tr>)}</tbody></table></section>
}
