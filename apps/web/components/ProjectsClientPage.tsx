'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CreateProjectForm from '@/components/CreateProjectForm'
import HeaderUserMenu from '@/components/HeaderUserMenu'
import { useApiClient } from '@/lib/api-client'
import type { Project } from '@/types'

export default function ProjectsClientPage() {
  const { fetchApi } = useApiClient()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setError(null)
      const data = await fetchApi('/projects')
      setProjects(data as Project[])
    } catch (e) {
      setError((e as Error).message)
      setProjects([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Projects</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Create an agent and start chatting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CreateProjectForm onCreated={load}/>
            <HeaderUserMenu />
          </div>
        </div>

        {/* Content */}
        {projects === null ? (
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
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-300">
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-950 p-5 hover:bg-zinc-900 transition"
              >
                <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                  {project.name}
                </h2>
                <p className="text-sm text-zinc-400">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
