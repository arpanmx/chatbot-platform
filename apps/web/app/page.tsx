import { fetchWithAuth } from '@/lib/api'
import { Project } from '@/types'
import Link from 'next/link'
import CreateProjectForm from '@/components/CreateProjectForm'
import { auth } from '@clerk/nextjs/server'
import HeaderUserMenu from '@/components/HeaderUserMenu'

export default async function HomePage() {
  const { isAuthenticated, redirectToSignIn } = await auth()
  if (!isAuthenticated) return redirectToSignIn()

  const projects: Project[] = await fetchWithAuth('/projects')

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
            <CreateProjectForm />
            <HeaderUserMenu />
          </div>
        </div>

        {/* Content */}
        {projects.length === 0 ? (
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
