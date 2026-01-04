import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.config import get_settings

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    dataset_context: dict | None = None


@router.post("/chat")
def chat(request: ChatRequest, user=Depends(get_current_user)):
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing GEMINI_API_KEY")

    try:
        import google.generativeai as genai
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini client missing: {exc}")

    prompt = "You are DataCanvas AI. Answer with concise analysis.\n"
    if request.dataset_context:
        prompt += f"Dataset context: {json.dumps(request.dataset_context)[:4000]}\n"
    prompt += f"User: {request.message}"

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)

    content = response.text if hasattr(response, "text") else str(response)
    return {"response": content}
