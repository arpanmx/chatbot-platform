import { fetchWithAuth } from '@/lib/api'
import { Project, Conversation, Prompt } from '@/types'
import ProjectShell from '@/components/ProjectShell'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  let project: Project
  let conversations: Conversation[]
  let prompts: Prompt[]

  try {
    project = await fetchWithAuth(`/projects/${projectId}`)
    conversations = await fetchWithAuth(`/projects/${projectId}/conversations`)
    prompts = await fetchWithAuth(`/projects/${projectId}/prompts`)
  } catch (e: any) {
    if (typeof e?.message === 'string' && e.message.includes('Project not found')) {
      notFound()
    }
    throw e
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <UserButton />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-zinc-300 hover:text-zinc-100">
            ← Back to projects
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold mb-6">{project.name}</h1>

        <ProjectShell projectId={projectId} conversations={conversations} prompts={prompts} />
      </div>
    </div>
  )
}