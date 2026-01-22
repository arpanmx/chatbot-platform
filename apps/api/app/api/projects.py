from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Project
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.core.auth import get_current_user
from app.services.openai_service import create_vector_store

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        vector_store = await create_vector_store(name=project.name)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    db_project = Project(
        name=project.name,
        user_id=user_id,
        vector_store_id=vector_store.id,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(Project.user_id == user_id).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.name = project_update.name
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None
