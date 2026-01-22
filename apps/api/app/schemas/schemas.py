from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Projects
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)

class ProjectUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    vector_store_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Prompts
class PromptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)

class PromptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)

class PromptResponse(BaseModel):
    id: str
    project_id: str
    name: str
    content: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Conversations
class ConversationCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)

class ConversationResponse(BaseModel):
    id: str
    project_id: str
    title: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Messages
class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)

# Files
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    openai_file_id: str
    vector_store_file_id: Optional[str] = None
    vector_store_file_status: Optional[str] = None
    size_bytes: Optional[int]
    mime_type: Optional[str] = None
    purpose: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
