from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from database import db
from routers.auth import get_current_user
from anthropic import Anthropic
import os
import json
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _build_system_prompt(user: dict) -> str:
    now = datetime.now()
    birth = user.get("birth_data") or {}
    name = birth.get("name", "this person")
    return f"""You are a warm, knowledgeable Vedic astrology guide who knows {name}'s birth chart inside out. You're having a real conversation — not delivering a lecture.

Today is {now.strftime("%A, %B %d, %Y")} at {now.strftime("%H:%M")}.

{name.capitalize()}'s complete birth chart:
{json.dumps(user.get("chart_data"), indent=2)}

How to respond:
1. Keep it conversational and concise — 1 to 3 short paragraphs maximum. This is a chat, not an essay.
2. Always anchor your answer in their specific chart (mention the actual planet, sign, house, or dasha). Never speak generically.
3. Your audience is beginners to intermediates. Use plain language. Explain any Vedic term briefly in plain English right after you use it.
4. Never use dashes (-) anywhere in your response — not as bullet points, not as punctuation, not in any form.
5. No bullet points or lists of any kind — only flowing prose.
6. Say "this suggests" or "this points to" — never "this will happen".
7. Speak as "you" — warm and direct, slightly poetic but never flowery.
8. Be honest about challenges. Don't soften Saturn or 8th house themes.
9. Empower agency. Never create dependency."""


class ChatRequest(BaseModel):
    message: str
    session_id: str


@router.post("/stream")
def chat_stream(body: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not current_user.get("chart_data"):
        raise HTTPException(status_code=400, detail="No chart found. Generate your chart first.")

    # Load history for this session only
    history = (
        db.table("messages")
        .select("role, content")
        .eq("user_id", current_user["id"])
        .eq("session_id", body.session_id)
        .order("created_at")
        .limit(40)
        .execute()
        .data
    )

    db.table("messages").insert({
        "user_id": current_user["id"],
        "session_id": body.session_id,
        "role": "user",
        "content": body.message,
    }).execute()

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": body.message})

    system_prompt = _build_system_prompt(current_user)

    def generate():
        full_response = ""
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1000,
                system=system_prompt,
                messages=messages,
                temperature=0.7,
            ) as stream:
                for text in stream.text_stream:
                    full_response += text
                    yield f"data: {json.dumps({'text': text})}\n\n"

            db.table("messages").insert({
                "user_id": current_user["id"],
                "session_id": body.session_id,
                "role": "assistant",
                "content": full_response,
            }).execute()
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/sessions")
def get_sessions(current_user: dict = Depends(get_current_user)):
    """Return list of sessions with first user message as preview, ordered by latest activity."""
    # Get all user messages grouped by session
    result = (
        db.table("messages")
        .select("session_id, role, content, created_at")
        .eq("user_id", current_user["id"])
        .order("created_at")
        .execute()
    )

    sessions: dict = {}
    for msg in result.data:
        sid = msg["session_id"]
        if not sid:
            continue
        if sid not in sessions:
            sessions[sid] = {"session_id": sid, "preview": None, "last_at": msg["created_at"]}
        # First user message becomes the preview
        if sessions[sid]["preview"] is None and msg["role"] == "user":
            sessions[sid]["preview"] = msg["content"][:80]
        # Track latest message time for ordering
        sessions[sid]["last_at"] = msg["created_at"]

    # Sort by most recent activity
    sorted_sessions = sorted(sessions.values(), key=lambda s: s["last_at"], reverse=True)
    return sorted_sessions


@router.get("/history")
def chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    result = (
        db.table("messages")
        .select("id, role, content")
        .eq("user_id", current_user["id"])
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return result.data
