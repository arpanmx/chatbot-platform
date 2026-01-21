'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useMemo } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function useApiClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  const getTokenReady = useCallback(async () => {
    // If Clerk isn't ready yet, don't even try
    if (!isLoaded) return null
    if (!isSignedIn) return null

    // Token can be briefly unavailable right after redirect; retry a bit
    for (let i = 0; i < 5; i++) {
      const token = await getToken()
      if (token) return token
      await sleep(200)
    }
    return null
  }, [getToken, isLoaded, isSignedIn])

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = await getTokenReady()

      // If this is a protected API call and we don't have a token, fail fast.
      if (!token) {
        throw new Error('Not authenticated')
      }

      const headers = new Headers(options.headers)

      // If body is FormData, don't set Content-Type (browser sets boundary)
      const isFormData =
        typeof FormData !== 'undefined' && options.body instanceof FormData

      if (!isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      headers.set('Authorization', `Bearer ${token}`)

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const text = await response.text()
        try {
          const error
