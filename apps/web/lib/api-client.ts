'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useMemo, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
const TOKEN_RETRY_DELAY_MS = 200
const TOKEN_RETRY_ATTEMPTS = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function errorMessageFromPayload(payload: unknown, fallback: string) {
  if (!payload) return fallback

  if (typeof payload === 'string') return payload

  if (typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail?: string }).detail
    if (detail) return detail
  }

  return fallback
}

export function useApiClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const inFlightTokenRef = useRef<Promise<string | null> | null>(null)

  const getAuthToken = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return null

    if (inFlightTokenRef.current) {
      return inFlightTokenRef.current
    }

    const tokenPromise = (async () => {
      for (let attempt = 0; attempt < TOKEN_RETRY_ATTEMPTS; attempt += 1) {
        const token = await getToken()
        if (token) return token
        await sleep(TOKEN_RETRY_DELAY_MS)
      }
      return null
    })()

    inFlightTokenRef.current = tokenPromise

    try {
      return await tokenPromise
    } finally {
      inFlightTokenRef.current = null
    }
  }, [getToken, isLoaded, isSignedIn])

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = await getAuthToken()

      if (!token) {
        throw new Error('Not authenticated')
      }

      const headers = new Headers(options.headers)
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
        const payload = await parseResponse(response)
        const message = errorMessageFromPayload(
          payload,
          `Request failed (HTTP ${response.status})`
        )
        throw new Error(message)
      }

      return parseResponse(response)
    },
    [getAuthToken]
  )

  return useMemo(
    () => ({
      fetchApi,
      getToken: getAuthToken,
      isLoaded,
      isSignedIn,
    }),
    [fetchApi, getAuthToken, isLoaded, isSignedIn]
  )
}
