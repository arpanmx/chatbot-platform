'use client'

import { useState } from 'react'
import { useApiClient } from '@/lib/api-client'
import { Prompt } from '@/types'

export default function PromptsManager({
  projectId,
  initialPrompts,
}: {
  projectId: string
  initialPrompts: Prompt[]
}) {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const { fetchApi } = useApiClient()

  async function handleCreate() {
    try {
      const newPrompt = await fetchApi(`/projects/${projectId}/prompts`, {
        method: 'POST',
        body: JSON.stringify({ name, content }),
      })
      setPrompts((prev) => [newPrompt, ...prev])
      setName('')
      setContent('')
      setIsAdding(false)
    } catch (error) {
      alert('Error: ' + (error as Error).message)
    }
  }

  async function handleActivate(promptId: string) {
    try {
      await fetchApi(`/projects/${projectId}/prompts/${promptId}/activate`, {
        method: 'POST',
      })
      setPrompts((prev) => prev.map((p) => ({ ...p, is_active: p.id === promptId })))
    } catch (error) {
      alert('Error: ' + (error as Error).message)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-zinc-200">System prompt</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className={[
              'p-3 rounded-xl border',
              prompt.is_active
                ? 'border-blue-600 bg-blue-600/10'
                : 'border-zinc-800 bg-zinc-900/40',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-zinc-100 truncate">
                    {prompt.name}
                  </h3>
                  {prompt.is_active && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-200 border border-blue-600/30">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {prompt.content}
                </p>
              </div>

              {!prompt.is_active && (
                <button
                  onClick={() => handleActivate(prompt.id)}
                  className="shrink-0 text-xs px-2 py-1 rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
            <h2 className="text-lg font-semibold mb-4">New system prompt</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prompt name"
              className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 mb-3"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="System prompt content…"
              className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 h-32 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
              >
                Create
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


