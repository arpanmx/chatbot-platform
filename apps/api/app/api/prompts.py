from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Project, Prompt
from app.schemas.schemas import PromptCreate, PromptUpdate, PromptResponse
from app.core.auth import get_current_user

router = APIRouter(prefix="/projects/{project_id}/prompts", tags=["prompts"])

def verify_project_ownership(project_id: str, user_id: str, db: Session) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    project_id: str,
    prompt: PromptCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    db_prompt = Prompt(project_id=project_id, name=prompt.name, content=prompt.content)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.get("", response_model=List[PromptResponse])
def list_prompts(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    return db.query(Prompt).filter(Prompt.project_id == project_id).all()

@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    project_id: str,
    prompt_id: str,
    prompt_update: PromptUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.project_id == project_id
    ).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt_update.name is not None:
        prompt.name = prompt_update.name
    if prompt_update.content is not None:
        prompt.content = prompt_update.content
    
    db.commit()
    db.refresh(prompt)
    return prompt

@router.post("/{prompt_id}/activate", response_model=PromptResponse)
def activate_prompt(
    project_id: str,
    prompt_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    
    # Deactivate all prompts in project
    db.query(Prompt).filter(Prompt.project_id == project_id).update({"is_active": False})
    
    # Activate target prompt
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.project_id == project_id
    ).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    prompt.is_active = True
    db.commit()
    db.refresh(prompt)
    return prompt

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    project_id: str,
    prompt_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_project_ownership(project_id, user_id, db)
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.project_id == project_id
    ).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db.delete(prompt)
    db.commit()
    return None