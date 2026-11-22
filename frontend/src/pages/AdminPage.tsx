import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import DashboardLayout from '../components/DashboardLayout'
import type { Delivery, Me, Role, UserView } from '../types'
import { isOperationalRole, operationalRoles, roleLabel } from '../types'

type AdminPageProps = {
  me: Me
  onLogout: () => Promise<void>
}

export default function AdminPage({ me, onLogout }: AdminPageProps) {
  const [users, setUsers] = useState<UserView[]>([])
  const [pendingRoles, setPendingRoles] = useState<Record<number, Role>>({})
  const [roleChange, setRoleChange] = useState<{ user: UserView; role: Role } | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    void Promise.all([
      api<UserView[]>('/api/admin/users'),
      api<Delivery[]>('/api/admin/deliveries'),
    ])
      .then(([nextUsers, nextDeliveries]) => {
        setUsers(nextUsers)
        setDeliveries(nextDeliveries)
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load admin data')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setRole(id: number, role: Role) {
    try {
      await api<UserView>(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setMessage('Role updated')
      load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update failed')
    }
  }

  async function setBlocked(id: number, blocked: boolean) {
    try {
      await api<UserView>(`/api/admin/users/${id}/block?blocked=${String(blocked)}`, {
        method: 'PATCH',
      })
      setMessage(blocked ? 'User blocked' : 'User unblocked')
      load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update failed')
    }
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
  const normalizedSearch = search.toLowerCase()
  const visibleDeliveries = deliveries.filter((delivery) =>
    `${delivery.productName} ${delivery.destination} ${delivery.customer}`
      .toLowerCase()
      .includes(normalizedSearch),
  )

  function renderUserTable(list: UserView[], pending: boolean) {
    return (
      <table>
        <thead>
          <tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                {user.blocked ? 'Blocked' : pending ? 'Awaiting approval' : 'Active'}
              </td>
              <td>
                {user.role === 'ADMIN'
                  ? <span>Protected admin</span>
                  : pending
                    ? (
                      <>
                        <select
                          value={pendingRoles[user.id] ?? ''}
                          onChange={(event) => {
                            if (isOperationalRole(event.target.value)) {
                              choosePendingRole(user.id, event.target.value)
                            }
                          }}
                        >
                          <option value="" disabled>Select role</option>
                          <option value="CUSTOMER">Customer</option>
                          <option value="DELIVERY_GUY">Delivery guy</option>
                          <option value="MANAGER">Manager</option>
                        </select>
                        <button
                          disabled={!pendingRoles[user.id]}
                          onClick={() => {
                            const role = pendingRoles[user.id]
                            if (role) void setRole(user.id, role)
                          }}
                        >
                          Approve
                        </button>
                        <button onClick={() => void setBlocked(user.id, true)}>
                          Disapprove
                        </button>
                      </>
                    )
                    : (
                      <>
                        <span>Change role:</span>
                        {operationalRoles.map((role) => (
                          <button
                            key={role}
                            disabled={role === user.role}
                            onClick={() => setRoleChange({ user, role })}
                          >
                            {role === user.role
                              ? `${roleLabel(role)} (current)`
                              : roleLabel(role)}
                          </button>
                        ))}
                        <button onClick={() => void setBlocked(user.id, !user.blocked)}>
                          {user.blocked ? 'Unblock' : 'Block'}
                        </button>
                      </>
                    )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <DashboardLayout me={me} onLogout={onLogout}>
      <section>
        <h2>Manage users and deliveries</h2>
        <input
          placeholder="Search users or deliveries"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {message && <p>{message}</p>}

        <h3>Pending registrations</h3>
        {renderUserTable(
          pendingUsers.filter((user) => user.username.toLowerCase().includes(normalizedSearch)),
          true,
        )}

        <h3>Approved members</h3>
        {renderUserTable(
          approvedUsers.filter((user) => user.username.toLowerCase().includes(normalizedSearch)),
          false,
        )}

        <h3>All delivery information</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Customer</th><th>Weight</th>
              <th>Destination</th><th>Status</th><th>Delivery guy</th>
            </tr>
          </thead>
          <tbody>
            {visibleDeliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>{delivery.productName}</td>
                <td>{delivery.customer}</td>
                <td>{delivery.weight}</td>
                <td>{delivery.destination}</td>
                <td>{delivery.status}</td>
                <td>{delivery.deliveryGuy ?? 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {roleChange && (
        <div className="modal-backdrop" onClick={() => setRoleChange(null)}>
          <div
            className="role-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="role-dialog-title">Change role?</h3>
            <p>
              Do you want to change <strong>{roleChange.user.username}</strong> from{' '}
              <strong>{roleLabel(roleChange.user.role)}</strong> to{' '}
              <strong>{roleLabel(roleChange.role)}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={() => void confirmRoleChange()}>Yes, change role</button>
              <button onClick={() => setRoleChange(null)}>No, keep current role</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
