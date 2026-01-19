from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Project, Conversation
from app.schemas.schemas import ConversationCreate, ConversationResponse
from app.core.auth import get_current_user
from app.api.prompts import verify_project_ownership

router = APIRouter(prefix="/projects/{project_id}/conversations", tags=["conversations"])

@router.post("", response_model=ConversationResponse, status_code=201)
def create_conversation(
    project_id: str,
    conversation: ConversationCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    db_conversation = Conversation(
        project_id=project_id,
        title=conversation.title or "New Conversation"
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    return db.query(Conversation).filter(Conversation.project_id == project_id).all()