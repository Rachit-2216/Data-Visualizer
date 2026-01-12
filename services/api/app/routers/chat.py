import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.middleware.auth import get_current_user, require_auth, AuthenticatedUser
from app.models.schemas import ChatMessage, ConversationCreate
from app.services.gemini import gemini_service
from app.services.supabase import supabase_service


router = APIRouter()


@router.get("/conversations")
async def list_conversations(user: AuthenticatedUser = Depends(require_auth)):
    result = await supabase_service.get_conversations(user.user_id)
    return {"conversations": result.data or []}


@router.post("/conversations")
async def create_conversation(
    payload: ConversationCreate,
    user: AuthenticatedUser = Depends(require_auth),
):
    result = await supabase_service.create_conversation(
        user_id=user.user_id,
        project_id=payload.project_id,
        dataset_version_id=payload.dataset_version_id,
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create conversation")
    return {"conversation": result.data[0]}


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    user: AuthenticatedUser = Depends(require_auth),
):
    result = await supabase_service.get_conversation_messages(conversation_id)
    return {"messages": result.data or []}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    message: ChatMessage,
    user: AuthenticatedUser = Depends(require_auth),
):
    if not gemini_service:
        raise HTTPException(status_code=503, detail="Gemini service not configured")

    async def generate():
        try:
            await supabase_service.add_message(
                conversation_id=conversation_id,
                role="user",
                content=message.content,
            )

            messages_result = await supabase_service.get_conversation_messages(conversation_id)
            history = messages_result.data or []

            dataset_context = None
            if message.dataset_version_id:
                try:
                    profile = await supabase_service.get_profile(message.dataset_version_id)
                    dataset_context = profile.data
                except Exception:
                    dataset_context = None

            full_response = ""
            chart_spec = None

            async for chunk in gemini_service.chat_stream(
                message=message.content,
                history=history,
                dataset_context=dataset_context,
            ):
                if chunk.get("type") == "text":
                    full_response += chunk["content"]
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk.get("type") == "chart":
                    chart_spec = chunk["spec"]
                    yield f"data: {json.dumps(chunk)}\n\n"

            await supabase_service.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_response,
                chart_spec=chart_spec,
            )

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("")
async def quick_chat(
    message: ChatMessage,
    user: Optional[AuthenticatedUser] = Depends(get_current_user),
):
    _ = user
    async def generate():
        try:
            dataset_context = None
            if message.dataset_version_id:
                try:
                    profile = await supabase_service.get_profile(message.dataset_version_id)
                    dataset_context = profile.data
                except Exception:
                    dataset_context = None

            async for chunk in gemini_service.chat_stream(
                message=message.content,
                history=[],
                dataset_context=dataset_context,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
