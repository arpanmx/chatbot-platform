from __future__ import annotations

import json
from typing import Any, AsyncGenerator, Dict, List, Optional

from openai import AsyncOpenAI
from app.core.config import settings


def _get_client() -> AsyncOpenAI:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def _sse(payload: Dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _to_responses_input(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert stored chat history into Responses API input.

    Use plain string content (role/content), which avoids content-part type mismatches
    across user vs assistant roles.
    """
    out: List[Dict[str, Any]] = []

    for m in messages:
        role = m.get("role")
        content = m.get("content")
        if not role or content is None:
            continue

        # If already a string, keep it.
        if isinstance(content, str):
            out.append({"role": role, "content": content})
            continue

        # If you ever stored "parts", extract any text fields and join them.
        if isinstance(content, list):
            texts: List[str] = []
            for part in content:
                if isinstance(part, dict):
                    # handle possible schemas: {"type":"text","text":"..."}, etc.
                    if "text" in part:
                        texts.append(str(part["text"]))
            out.append({"role": role, "content": "\n".join(texts) if texts else str(content)})
            continue

        # Fallback
        out.append({"role": role, "content": str(content)})

    return out



async def stream_chat_completion(
    messages: List[Dict[str, Any]],
    system_prompt: Optional[str] = None,
    *,
    # keep these in signature if you want, but do NOT send temperature to gpt-5-mini
    temperature: Optional[float] = None,
    max_output_tokens: Optional[int] = None,
    vector_store_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    client = _get_client()

    merged_system_prompt = system_prompt
    filtered_messages: List[Dict[str, Any]] = []
    for m in messages:
        if m.get("role") == "system":
            if not merged_system_prompt and m.get("content"):
                merged_system_prompt = str(m["content"])
            continue
        filtered_messages.append(m)

    input_items = _to_responses_input(filtered_messages)
    full_text = ""

    try:
        # Build kwargs and ONLY include supported fields.
        # gpt-5-mini currently rejects temperature -> don't send it.
        kwargs: Dict[str, Any] = {
            "model": "gpt-5-mini",
            "input": input_items,
            "instructions": merged_system_prompt,
            "stream": True,
        }
        if vector_store_id:
            kwargs["tools"] = [{"type": "file_search"}]
            kwargs["tool_resources"] = {
                "file_search": {"vector_store_ids": [vector_store_id]}
            }
        if max_output_tokens is not None:
            kwargs["max_output_tokens"] = max_output_tokens

        try:
            stream = await client.responses.create(**kwargs)
        except TypeError as exc:
            if "tool_resources" not in str(exc):
                raise
            kwargs.pop("tool_resources", None)
            if vector_store_id:
                kwargs["tools"] = [
                    {"type": "file_search", "vector_store_ids": [vector_store_id]}
                ]
            stream = await client.responses.create(**kwargs)

        async for event in stream:
            event_type = getattr(event, "type", None)

            if event_type == "response.output_text.delta":
                delta = getattr(event, "delta", "")
                if delta:
                    full_text += delta
                    yield _sse({"type": "token", "content": delta})

            elif event_type == "response.refusal.delta":
                delta = getattr(event, "delta", "")
                if delta:
                    yield _sse({"type": "refusal", "content": delta})

            elif event_type == "response.completed":
                break

        yield _sse({"type": "done", "content": full_text})

    except Exception as e:
        yield _sse({"type": "error", "message": str(e)})


async def upload_file_to_openai(
    *,
    filename: str,
    content: bytes,
    content_type: Optional[str] = None,
    purpose: str = "user_data",
    expires_after_seconds: Optional[int] = None,
):
    client = _get_client()

    file_param = (filename, content, content_type or "application/octet-stream")

    kwargs: Dict[str, Any] = {"file": file_param, "purpose": purpose}
    if expires_after_seconds is not None:
        kwargs["expires_after"] = {"anchor": "created_at", "seconds": expires_after_seconds}

    return await client.files.create(**kwargs)


async def create_vector_store(*, name: str):
    client = _get_client()
    return await client.vector_stores.create(name=name)


async def add_file_to_vector_store(*, vector_store_id: str, file_id: str):
    client = _get_client()
    return await client.vector_stores.files.create(
        vector_store_id=vector_store_id,
        file_id=file_id,
    )


async def get_vector_store_file(*, vector_store_id: str, file_id: str):
    client = _get_client()
    return await client.vector_stores.files.retrieve(
        vector_store_id=vector_store_id,
        file_id=file_id,
    )
