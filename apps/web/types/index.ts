export interface Project {
    id: string
    user_id: string
    name: string
    vector_store_id?: string | null
    created_at: string
    updated_at: string
  }
  
  export interface Prompt {
    id: string
    project_id: string
    name: string
    content: string
    is_active: boolean
    created_at: string
  }
  
  export interface Conversation {
    id: string
    project_id: string
    title: string | null
    created_at: string
  }
  
  export interface Message {
    id: string
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
  }
  
export interface FileMetadata {
    id: string
    filename: string
    openai_file_id: string
    vector_store_file_id?: string | null
    vector_store_file_status?: string | null
    size_bytes: number | null
    mime_type?: string | null
    purpose?: string | null
    created_at: string
  }
