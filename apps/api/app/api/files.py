from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_user
from app.db.database import get_db
from app.db.models import FileMetadata, Project
from app.schemas.schemas import FileUploadResponse
from app.services.openai_service import upload_file_to_openai

router = APIRouter(prefix="/projects/{project_id}/files", tags=["files"])

# Simple guardrail for MVP. (OpenAI allows much larger; tune as you prefer.)
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


def _verify_project_ownership(project_id: str, user_id: str, db: Session) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_project_ownership(project_id, user_id, db)

    # Read content (MVP approach).
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_UPLOAD_BYTES} bytes)",
        )

    # Upload to OpenAI Files API
    purpose = "user_data"

    try:
        openai_file = await upload_file_to_openai(
            filename=file.filename or "upload",
            content=content,
            content_type=file.content_type,
            purpose=purpose,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Persist metadata in your DB
    file_metadata = FileMetadata(
        project_id=project_id,
        user_id=user_id,
        filename=file.filename or "upload",
        mime_type=file.content_type,
        purpose=purpose,
        openai_file_id=openai_file.id,
        size_bytes=getattr(openai_file, "bytes", len(content)),
    )

    db.add(file_metadata)
    db.commit()
    db.refresh(file_metadata)

    return file_metadata


@router.get("", response_model=List[FileUploadResponse])
def list_files(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_project_ownership(project_id, user_id, db)

    return (
        db.query(FileMetadata)
        .filter(FileMetadata.project_id == project_id)
        .order_by(FileMetadata.created_at.desc())
        .all()
    )
