import { auth } from '@clerk/nextjs/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const { getToken } = await auth()
  const token = await getToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(error.detail || error.message || `HTTP ${response.status}`)
    } catch {
      throw new Error(text || `HTTP ${response.status}`)
    }
  }

  if (response.status === 204) return null
  return response.json()
}

export async function getAuthToken() {
  const { getToken } = await auth()
  return await getToken()
}