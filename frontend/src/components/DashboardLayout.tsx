import type { ReactNode } from 'react'
import type { Me } from '../types'

type DashboardLayoutProps = {
  me: Me
  onLogout: () => Promise<void>
  children: ReactNode
}

export default function DashboardLayout({ me, onLogout, children }: DashboardLayoutProps) {
  return (
    <main className="dashboard">
      <header>
        <div>
          <h1>Delivery dashboard</h1>
          <p>{me.username} · {me.role}</p>
        </div>
        <button onClick={() => void onLogout()}>Log out</button>
      </header>
      {children}
    </main>
  )
}
