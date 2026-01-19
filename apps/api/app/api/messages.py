from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Conversation, Message, Project
from app.schemas.schemas import MessageResponse
from app.core.auth import get_current_user

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["messages"])

@router.get("", response_model=List[MessageResponse])
def list_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership via conversation -> project
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    project = db.query(Project).filter(
        Project.id == conversation.project_id,
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Not authorized")
    
    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()