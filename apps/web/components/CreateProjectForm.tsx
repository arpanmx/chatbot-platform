'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApiClient } from '@/lib/api-client'

export default function CreateProjectForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { fetchApi } = useApiClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    try {
      await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      setName('')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      alert('Failed to create project: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
      >
        New Project
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
            <h2 className="text-lg font-semibold mb-4">Create project</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}