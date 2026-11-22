let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
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
