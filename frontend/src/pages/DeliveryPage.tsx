import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import DashboardLayout from '../components/DashboardLayout'
import type { Delivery, Me } from '../types'

type DeliveryPageProps = {
  me: Me
  onLogout: () => Promise<void>
}

export default function DeliveryPage({ me, onLogout }: DeliveryPageProps) {
  const [available, setAvailable] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    void api<Delivery[]>('/api/delivery/deliveries')
      .then(setDeliveries)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load deliveries')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleAvailability() {
    const next = !available
    try {
      await api(`/api/delivery/availability?available=${String(next)}`, { method: 'PATCH' })
      setAvailable(next)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update availability')
    }
  }

  async function markDelivered(id: number) {
    try {
      await api(`/api/delivery/deliveries/${id}/delivered`, { method: 'PATCH' })
      load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update delivery')
    }
  }

  return (
    <DashboardLayout me={me} onLogout={onLogout}>
      <section>
        <h2>Delivery work</h2>
        {message && <p>{message}</p>}
        <button onClick={() => void toggleAvailability()}>
          Available: {available ? 'yes' : 'no'}
        </button>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Weight</th><th>Destination</th>
              <th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>{delivery.productName}</td>
                <td>{delivery.weight}</td>
                <td>{delivery.destination}</td>
                <td>{delivery.status}</td>
                <td>
                  {delivery.status === 'ASSIGNED' && (
                    <button onClick={() => void markDelivered(delivery.id)}>
                      Mark delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  )
}
