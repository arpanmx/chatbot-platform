'use client'

import { Conversation } from '@/types'

export default function ConversationsList({
  initialConversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  initialConversations: Conversation[]
  selectedConversationId?: string | null
  onSelectConversation?: (conversationId: string) => void
  onNewConversation?: () => void
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-200">Conversations</h2>

        {onNewConversation && (
          <button
            type="button"
            onClick={onNewConversation}
            className="text-xs px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800"
          >
            New
          </button>
        )}
      </div>

      <div className="space-y-2">
        {initialConversations.map((conv) => {
          const active = conv.id === selectedConversationId
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelectConversation?.(conv.id)}
              className={[
                'w-full text-left p-3 rounded-xl border transition',
                active
                  ? 'border-blue-600 bg-blue-600/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900',
              ].join(' ')}
            >
              <p className="text-sm font-medium text-zinc-100">
                {conv.title || 'Untitled'}
              </p>
              <p className="text-xs text-zinc-400">
                {new Date(conv.created_at).toLocaleDateString()}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}