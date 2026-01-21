'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useApiClient } from '@/lib/api-client'
import type { Message } from '@/types'

type SsePayload =
  | { type: 'token'; content: string }
  | { type: 'done'; content: string }
  | { type: 'error'; message: string }

function isSsePayload(x: unknown): x is SsePayload {
  return (
    !!x &&
    typeof x === 'object' &&
    'type' in x &&
    (x as any).type &&
    typeof (x as any).type === 'string'
  )
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function ChatInterface({
  projectId,
  initialConversationId,
}: {
  projectId: string
  initialConversationId?: string | null
}) {
  const { fetchApi, getToken } = useApiClient()

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [uiError, setUiError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Prevent the "conversationId changed" effect from immediately wiping optimistic messages
  // when we create a brand new conversation.
  const skipNextLoadRef = useRef(false)

  // Prevent state updates after unmount
  const mountedRef = useRef(true)

  const canSend = useMemo(
    () => !streaming && input.trim().length > 0,
    [streaming, input]
  )

  async function loadMessages(convId: string) {
    const msgs = await fetchApi(`/conversations/${convId}/messages`)
    if (!mountedRef.current) return
    setMessages(msgs as Message[])
  }

  function appendOptimisticUserMessage(convId: string, text: string) {
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
  }

  async function createConversationAndReturnId(): Promise<string> {
    const conv = await fetchApi(`/projects/${projectId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title: 'New Chat' }),
    })

    const id = (conv as any).id as string

    // IMPORTANT:
    // Setting conversationId triggers the loadMessages effect (which would return [])
    // and could wipe the optimistic message. So we skip the next load once.
    skipNextLoadRef.current = true
    setConversationId(id)

    // We intentionally do NOT call setMessages([]) here.
    // handleSend() will append the optimistic message immediately.
    return id
  }

  async function handleSend() {
    if (!canSend) return

    setUiError(null)

    const userText = input.trim()
    setInput('')
    setStreaming(true)
    setStreamingMessage('')

    // Ensure we have a conversation ID and send in this same click
    const convId = conversationId ?? (await createConversationAndReturnId())

    // Add user message immediately (optimistic)
    appendOptimisticUserMessage(convId, userText)

    // Stream assistant response
    const abortController = new AbortController()

    try {
      const token = await getToken()

      const response = await fetch(`${API_URL}/conversations/${convId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userText }),
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Stream failed (HTTP ${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by blank line "\n\n"
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const evt of events) {
          // Each event can have multiple lines; we only care about "data:"
          const lines = evt.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data:')) continue

            const jsonText = line.slice(5).trim()
            if (!jsonText) continue

            let parsed: unknown
            try {
              parsed = JSON.parse(jsonText)
            } catch {
              continue
            }

            if (!isSsePayload(parsed)) continue

            if (parsed.type === 'token') {
              full += parsed.content ?? ''
              if (mountedRef.current) setStreamingMessage(full)
            } else if (parsed.type === 'done') {
              full = parsed.content ?? full
              if (mountedRef.current) setStreamingMessage(full)
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message || 'Streaming error')
            }
          }
        }
      }

      // Pull saved messages from backend (user + assistant)
      await loadMessages(convId)
      if (!mountedRef.current) return

      setStreamingMessage('')
      inputRef.current?.focus()
    } catch (err: any) {
      if (!mountedRef.current) return
      // Keep optimistic user message visible; show an inline error
      setUiError(err?.message || 'Failed to send message')
    } finally {
      if (!mountedRef.current) return
      setStreaming(false)
    }
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Initial mount/unmount guard
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // If parent changes selected conversation (ProjectShell), update and load it.
  useEffect(() => {
    if (initialConversationId === undefined) return
    setConversationId(initialConversationId ?? null)
  }, [initialConversationId])

  // Load messages when conversationId changes, except when we intentionally skip
  // the first load right after creating a conversation (to avoid wiping optimistic msg).
  useEffect(() => {
    if (!conversationId) return

    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false
      return
    }

    loadMessages(conversationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  return (
    <div className="h-[70vh] rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
        <div className="text-sm text-zinc-300">
          {conversationId ? 'Chat' : 'Start a chat'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!conversationId && messages.length === 0 && (
          <div className="max-w-xl mx-auto mt-10 text-center text-zinc-300">
            <div className="text-xl font-semibold text-zinc-100">
              Message your agent
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Start by sending a message below.
            </div>
          </div>
        )}

        {uiError && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {uiError}
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={[
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700',
                ].join(' ')}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          )
        })}

        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-zinc-800 text-zinc-100 border border-zinc-700">
              <p className="whitespace-pre-wrap">{streamingMessage}</p>
              <span className="inline-block w-2 h-4 bg-zinc-100/80 animate-pulse ml-1 align-middle" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-3">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Message…"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-xl px-4 py-3 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}


