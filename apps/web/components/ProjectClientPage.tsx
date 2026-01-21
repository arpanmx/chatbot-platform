'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { useApiClient } from '@/lib/api-client'
import ProjectShell from '@/components/ProjectShell'
import type { Project, Conversation, Prompt } from '@/types'

export default function ProjectClientPage({ projectId }: { projectId: string }) {
  const { fetchApi } = useApiClient()

  const [project, setProject] = useState<Project | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, c, pr] = await Promise.all([
        fetchApi(`/projects/${projectId}`),
        fetchApi(`/projects/${projectId}/conversations`),
        fetchApi(`/projects/${projectId}/prompts`),
      ])

      setProject(p as Project)
      setConversations(c as Conversation[])
      setPrompts(pr as Prompt[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [projectId])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-zinc-300 hover:text-zinc-100">
            ← Back to projects
          </Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-300">
            Loading…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-4 text-red-200">
            {error}
            <button
              onClick={load}
              className="ml-3 underline text-red-100 hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : !project ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-300">
            Project not found.
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">
              {project.name}
            </h1>

            <ProjectShell
              projectId={projectId}
              conversations={conversations}
              prompts={prompts}
            />
          </>
        )}
      </div>
    </div>
  )
}
