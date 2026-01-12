import json
import re
from typing import AsyncGenerator
import google.generativeai as genai
from app.config import settings


if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.gemini_model) if settings.gemini_api_key else None

    def _build_system_prompt(self, dataset_context: dict | None) -> str:
        base_prompt = (
            "You are DataCanvas AI, an expert data analyst assistant. "
            "You help users understand datasets through analysis, visualization, and guidance.\n\n"
            "When creating visualizations:\n"
            "- Output the Vega-Lite spec inside ```vegalite ... ``` code blocks\n"
            "- Use the provided column names exactly\n"
            "- Choose chart types that match the data\n"
            "- Keep responses concise and practical\n"
        )

        if dataset_context:
            schema = dataset_context.get("schema_info", [])
            stats = dataset_context.get("statistics", {})
            warnings = dataset_context.get("warnings", [])
            context_str = (
                "\nCurrent Dataset Context:\n"
                f"- Columns: {json.dumps(schema)}\n"
                f"- Statistics: {json.dumps(stats)}\n"
                f"- Warnings: {json.dumps(warnings)}\n"
            )
            return base_prompt + context_str

        return base_prompt

    def _extract_chart_spec(self, text: str) -> tuple[str, dict | None]:
        pattern = r"```vegalite\\s*([\\s\\S]*?)\\s*```"
        match = re.search(pattern, text)
        if match:
            try:
                spec = json.loads(match.group(1))
                clean_text = re.sub(pattern, "[Chart Generated]", text)
                return clean_text, spec
            except json.JSONDecodeError:
                return text, None
        return text, None

    async def chat_stream(
        self,
        message: str,
        history: list,
        dataset_context: dict | None = None,
    ) -> AsyncGenerator[dict, None]:
        if not self.model:
            yield {"type": "error", "message": "Gemini API key not configured"}
            return

        system_prompt = self._build_system_prompt(dataset_context)
        gemini_history = []
        for msg in history[-10:]:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        chat = self.model.start_chat(history=gemini_history)
        full_message = f"{system_prompt}\n\nUser: {message}"

        try:
            response = chat.send_message(full_message, stream=True)
            full_text = ""
            for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield {"type": "text", "content": chunk.text}
            _, chart_spec = self._extract_chart_spec(full_text)
            if chart_spec:
                yield {"type": "chart", "spec": chart_spec}
        except Exception as exc:
            yield {"type": "error", "message": str(exc)}

    async def generate_chart(self, description: str, dataset_context: dict) -> dict:
        if not self.model:
            raise ValueError("Gemini API key not configured")

        prompt = (
            "Generate a Vega-Lite specification for the following visualization:\n\n"
            f"Description: {description}\n\n"
            f"Dataset columns: {json.dumps(dataset_context.get('schema_info', []))}\n\n"
            "Output ONLY the JSON Vega-Lite specification, no explanation."
        )
        response = self.model.generate_content(prompt)
        spec_text = response.text.strip()
        if spec_text.startswith("```"):
            spec_text = re.sub(r"```\\w*\\s*", "", spec_text).strip()
        return json.loads(spec_text)


gemini_service = GeminiService()
