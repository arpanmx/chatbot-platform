from __future__ import annotations

import json
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.db.models import Conversation, Message, Project, Prompt
from app.schemas.schemas import ChatRequest
from app.services.openai_service import stream_chat_completion

router = APIRouter(prefix="/conversations/{conversation_id}/chat", tags=["chat"])


def save_messages_after_stream(
    conversation_id: str,
    user_message: str,
    assistant_message: str,
    db: Session,
) -> None:
    """
    Persist the user + assistant messages after the stream completes.

    Note: This is intentionally a normal (sync) function.
    Declaring it async but calling it without await means it will never execute.
    """
    db.add(
        Message(
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )
    )

    db.add(
        Message(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_message,
        )
    )

    db.commit()


@router.post("")
async def chat_stream(
    conversation_id: str,
    chat_request: ChatRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1) Verify conversation exists
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2) Verify ownership via project
    project = (
        db.query(Project)
        .filter(Project.id == conversation.project_id, Project.user_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Not authorized")

    # 3) Get active prompt as system prompt (optional)
    active_prompt: Optional[Prompt] = (
        db.query(Prompt)
        .filter(Prompt.project_id == conversation.project_id, Prompt.is_active == True)  # noqa: E712
        .first()
    )
    system_prompt = active_prompt.content if active_prompt else None

    # 4) Load conversation history
    previous_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    messages = [{"role": msg.role, "content": msg.content} for msg in previous_messages]
    messages.append({"role": "user", "content": chat_request.message})

    # If this is the first message in the conversation, auto-title it
    if len(previous_messages) == 0:
        if not conversation.title or conversation.title.strip().lower() in ("new chat", "untitled"):
            conversation.title = chat_request.message.strip()[:60]
            db.commit()


    # We'll accumulate assistant text so we can save it after streaming finishes
    full_response = ""

    async def event_generator() -> AsyncGenerator[str, None]:
        nonlocal full_response

        # Optional: send an initial event so the client knows the stream is open
        yield f"data: {json.dumps({'type': 'start'})}\n\n"

        try:
            async for event in stream_chat_completion(
                messages,
                system_prompt,
                vector_store_id=project.vector_store_id,
            ):
                # If the client disconnects, stop work early
                if await request.is_disconnected():
                    break

                # Accumulate assistant text from token events
                # event is SSE formatted like: "data: {...}\n\n"
                if event.startswith("data: "):
                    raw = event[6:].strip()
                    try:
                        payload = json.loads(raw)
                        if payload.get("type") == "token":
                            full_response += payload.get("content", "")
                    except json.JSONDecodeError:
                        # Ignore malformed SSE payloads
                        pass

                yield event

        finally:
            # Save only if we actually have an assistant response
            # (if disconnected very early, you might not want to save an empty assistant msg)
            if full_response:
                save_messages_after_stream(
                    conversation_id=conversation_id,
                    user_message=chat_request.message,
                    assistant_message=full_response,
                    db=db,
                )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # helps with nginx proxy buffering
        },
    )
