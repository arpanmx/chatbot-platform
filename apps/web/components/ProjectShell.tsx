'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'
import ConversationsList from '@/components/ConversationsList'
import PromptsManager from '@/components/PromptsManager'
import { Conversation, Prompt } from '@/types'

export default function ProjectShell({
  projectId,
  conversations,
  prompts,
}: {
  projectId: string
  conversations: Conversation[]
  prompts: Prompt[]
}) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id ?? null
  )
  const [chatKey, setChatKey] = useState(0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <PromptsManager projectId={projectId} initialPrompts={prompts} />

        <ConversationsList
          initialConversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={() => {
            // Let ChatInterface create a new conversation on next send
            setSelectedConversationId(null)
            setChatKey((k) => k + 1)
          }}
        />
      </div>

      <div className="lg:col-span-3">
        <ChatInterface
          key={chatKey}
          projectId={projectId}
          initialConversationId={selectedConversationId}
        />
      </div>
    </div>
  )
}