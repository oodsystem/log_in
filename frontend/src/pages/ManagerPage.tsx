import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import DashboardLayout from '../components/DashboardLayout'
import type { Delivery, DeliveryPerson, Me } from '../types'

type ManagerPageProps = {
  me: Me
  onLogout: () => Promise<void>
}

export default function ManagerPage({ me, onLogout }: ManagerPageProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([])
  const [search, setSearch] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    void api<Delivery[]>('/api/manager/deliveries')
      .then(setDeliveries)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load deliveries')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function showAvailable(deliveryId: number) {
    try {
      setSelectedDelivery(deliveryId)
      setDeliveryPeople(await api<DeliveryPerson[]>('/api/manager/delivery-guys'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load delivery personnel')
    }
  }

  async function assign(deliveryId: number, deliveryGuyId: string) {
    if (!deliveryGuyId) return

    try {
      await api(`/api/manager/deliveries/${deliveryId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryGuyId: Number(deliveryGuyId) }),
      })
      setSelectedDelivery(null)
      load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to assign delivery')
    }
  }

  const normalizedSearch = search.toLowerCase()
  const visibleDeliveries = deliveries.filter((delivery) =>
    `${delivery.productName} ${delivery.destination} ${delivery.customer}`
      .toLowerCase()
      .includes(normalizedSearch),
  )

  return (
    <DashboardLayout me={me} onLogout={onLogout}>
      <section>
        <h2>Manager operations</h2>
        <input
          placeholder="Search delivery requests"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {message && <p>{message}</p>}
        <h3>Delivery requests</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Customer</th><th>Weight</th>
              <th>Destination</th><th>Status</th><th>Assignment</th>
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
                <td>
                  {delivery.status === 'REQUESTED'
                    ? selectedDelivery === delivery.id
                      ? (
                        <select
                          defaultValue=""
                          onChange={(event) => {
                            void assign(delivery.id, event.target.value)
                          }}
                        >
                          <option value="">Select available delivery guy</option>
                          {deliveryPeople.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.username}
                            </option>
                          ))}
                        </select>
                      )
                      : (
                        <button onClick={() => void showAvailable(delivery.id)}>
                          Show available delivery guys
                        </button>
                      )
                    : delivery.deliveryGuy ?? 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  )
}
