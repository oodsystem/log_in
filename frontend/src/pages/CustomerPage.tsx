import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api'
import DashboardLayout from '../components/DashboardLayout'
import type { Delivery, Me } from '../types'

type CustomerPageProps = {
  me: Me
  onLogout: () => Promise<void>
}

export default function CustomerPage({ me, onLogout }: CustomerPageProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [productName, setProductName] = useState('')
  const [weight, setWeight] = useState('')
  const [destination, setDestination] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    void api<Delivery[]>('/api/customer/deliveries')
      .then(setDeliveries)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load deliveries')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function request(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    try {
      await api('/api/customer/deliveries', {
        method: 'POST',
        body: JSON.stringify({ productName, weight: Number(weight), destination }),
      })
      setProductName('')
      setWeight('')
      setDestination('')
      load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to request delivery')
    }
  }

  return (
    <DashboardLayout me={me} onLogout={onLogout}>
      <section>
        <h2>Request a delivery</h2>
        {message && <p>{message}</p>}
        <form onSubmit={(event) => void request(event)}>
          <input
            placeholder="Product name"
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Weight"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            required
          />
          <input
            placeholder="Destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          />
          <button type="submit">Request delivery</button>
        </form>

        <h2>My deliveries</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Weight</th><th>Destination</th>
              <th>Status</th><th>Delivery guy</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>{delivery.productName}</td>
                <td>{delivery.weight}</td>
                <td>{delivery.destination}</td>
                <td>{delivery.status}</td>
                <td>{delivery.deliveryGuy ?? 'Not assigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  )
}
