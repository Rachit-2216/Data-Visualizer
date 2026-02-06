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
    if not settings.groq_api_key:
        raise HTTPException(status_code=400, detail="Missing GROQ_API_KEY")

    try:
        from groq import Groq
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Groq client missing: {exc}")

    prompt = "You are DataCanvas AI. Answer with concise analysis.\n"
    if request.dataset_context:
        prompt += f"Dataset context: {json.dumps(request.dataset_context)[:4000]}\n"
    prompt += f"User: {request.message}"

    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "You are DataCanvas AI. Answer with concise analysis."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=800,
        temperature=0.7,
    )
    content = response.choices[0].message.content.strip()
    return {"response": content}
