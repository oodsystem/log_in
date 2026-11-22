export type Role = 'PENDING' | 'ADMIN' | 'MANAGER' | 'DELIVERY_GUY' | 'CUSTOMER'
export type DeliveryStatus = 'REQUESTED' | 'ASSIGNED' | 'DELIVERED'

export type AuthResponse = { accessToken: string; role: Role }
export type Me = { username: string; role: Role }
export type UserView = {
  id: number
  username: string
  role: Role
  blocked: boolean
  available: boolean
}
export type Delivery = {
  id: number
  productName: string
  weight: number
  destination: string
  status: DeliveryStatus
  customer: string
  deliveryGuy: string | null
}
export type DeliveryPerson = { id: number; username: string }

export const operationalRoles: Role[] = ['CUSTOMER', 'DELIVERY_GUY', 'MANAGER']

export function isOperationalRole(value: string): value is Role {
  return operationalRoles.some((role) => role === value)
}

export function roleLabel(role: Role): string {
  if (role === 'DELIVERY_GUY') return 'Delivery guy'
  if (role === 'CUSTOMER') return 'Customer'
  if (role === 'MANAGER') return 'Manager'
  return role
}

export function rolePath(role: Role): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'MANAGER') return '/manager'
  if (role === 'DELIVERY_GUY') return '/delivery'
  if (role === 'CUSTOMER') return '/customer'
  return '/login'
}
