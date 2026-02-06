import json
import re
from typing import AsyncGenerator

from groq import Groq

from app.config import settings


class GroqService:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = settings.groq_model

    @property
    def is_configured(self) -> bool:
        return self.client is not None

    def _build_system_prompt(self, dataset_context: dict | None) -> str:
        base_prompt = (
            "You are DataCanvas AI, an expert data analyst assistant. You help users understand "
            "datasets through analysis, visualization, and machine learning guidance.\n\n"
            "Your capabilities:\n"
            "1. Answer questions about dataset structure, statistics, and patterns\n"
            "2. Generate visualizations by outputting Vega-Lite specifications in ```vegalite code blocks\n"
            "3. Provide data science guidance and ML model recommendations\n"
            "4. Help with feature engineering and preprocessing decisions\n"
            "5. Explain correlations, outliers, and data quality issues\n\n"
            "When creating visualizations:\n"
            "- Output valid Vega-Lite JSON specs inside ```vegalite ... ``` code blocks\n"
            "- Use the exact column names from the dataset\n"
            "- Choose appropriate chart types for the data type\n"
            "- Include proper titles, axis labels, and color schemes\n"
            "- For categorical data, use bar charts or pie charts\n"
            "- For numeric relationships, use scatter plots or line charts\n"
            "- For distributions, use histograms\n\n"
            "Be concise, accurate, and helpful. Always reference specific column names and statistics "
            "when relevant."
        )

        if dataset_context:
            schema = dataset_context.get("schema_info", [])
            stats = dataset_context.get("statistics", {})
            warnings = dataset_context.get("warnings", [])
            sample = dataset_context.get("sample_data", [])[:3]

            context_str = (
                "\n\nCurrent Dataset Context:\n"
                f"- Schema: {json.dumps(schema, indent=2)}\n"
                f"- Statistics: {json.dumps(stats, indent=2)}\n"
                f"- Data Quality Warnings: {json.dumps(warnings, indent=2)}\n"
                f"- Sample Data (first 3 rows): {json.dumps(sample, indent=2)}\n\n"
                "Use this context to provide accurate, data-specific answers."
            )
            return base_prompt + context_str

        return base_prompt

    def _extract_chart_spec(self, text: str) -> tuple[str, dict | None]:
        pattern = r"```vegalite\s*([\s\S]*?)\s*```"
        match = re.search(pattern, text)

        if match:
            try:
                spec = json.loads(match.group(1))
                clean_text = re.sub(pattern, "[Chart Generated]", text)
                return clean_text, spec
            except json.JSONDecodeError:
                pass

        return text, None

    async def chat_stream(
        self,
        message: str,
        history: list,
        dataset_context: dict | None = None,
    ) -> AsyncGenerator[dict, None]:
        if not self.client:
            yield {"type": "error", "message": "Groq API key not configured"}
            return

        system_prompt = self._build_system_prompt(dataset_context)
        messages = [{"role": "system", "content": system_prompt}]

        for msg in history[-10:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": message})

        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                max_tokens=2048,
                temperature=0.7,
            )

            full_text = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if not delta:
                    continue
                full_text += delta
                yield {"type": "text", "content": delta}

            _, chart_spec = self._extract_chart_spec(full_text)
            if chart_spec:
                yield {"type": "chart", "spec": chart_spec}

        except Exception as exc:
            yield {"type": "error", "message": str(exc)}

    async def generate_chart(self, description: str, dataset_context: dict) -> dict:
        if not self.client:
            raise ValueError("Groq API key not configured")

        prompt = (
            "Generate a Vega-Lite specification for the following visualization request:\n\n"
            f"Description: {description}\n\n"
            f"Dataset columns: {json.dumps(dataset_context.get('schema_info', []))}\n"
            f"Sample statistics: {json.dumps(dataset_context.get('statistics', {}))}\n\n"
            "Output ONLY the JSON Vega-Lite specification, nothing else. No explanation, no markdown, "
            "just valid JSON."
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Vega-Lite chart specification generator. Output only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
            temperature=0.3,
        )

        spec_text = response.choices[0].message.content.strip()
        if spec_text.startswith("```"):
            spec_text = re.sub(r"```\w*\s*", "", spec_text).strip()
        return json.loads(spec_text)

    async def analyze_dataset(self, dataset_context: dict) -> dict:
        if not self.client:
            raise ValueError("Groq API key not configured")

        prompt = (
            "Analyze this dataset and provide key insights:\n\n"
            f"Schema: {json.dumps(dataset_context.get('schema_info', []))}\n"
            f"Statistics: {json.dumps(dataset_context.get('statistics', {}))}\n"
            f"Warnings: {json.dumps(dataset_context.get('warnings', []))}\n\n"
            "Provide a JSON response with:\n"
            "{\n"
            '  "summary": "Brief 2-3 sentence overview",\n'
            '  "key_insights": ["insight1", "insight2", "insight3"],\n'
            '  "recommended_visualizations": [\n'
            '    {"type": "chart_type", "columns": ["col1", "col2"], "reason": "why"}\n'
            "  ],\n"
            '  "data_quality_issues": ["issue1", "issue2"],\n'
            '  "ml_recommendations": ["recommendation1"]\n'
            "}"
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a data analyst. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,
            temperature=0.5,
        )

        try:
            return json.loads(response.choices[0].message.content.strip())
        except json.JSONDecodeError:
            return {
                "summary": "Analysis failed",
                "key_insights": [],
                "recommended_visualizations": [],
            }


groq_service = GroqService()
