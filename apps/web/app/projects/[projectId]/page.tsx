import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProjectClientPage from '@/components/ProjectClientPage'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { projectId } = await params
  return <ProjectClientPage projectId={projectId} />
}


