from __future__ import annotations

import os
from typing import Any
from dotenv import load_dotenv
from google import genai
from PIL import Image

load_dotenv()


class GeminiExplanationService:
    def __init__(self, model_name: str | None = None) -> None:
        self.api_key = os.environ.get("GEMINI_API_KEY")
        # gemini-3.5-flash-lite / gemini-3.8-flash provide fast multimodal explanations
        self.model_name = model_name or os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
        self._client: genai.Client | None = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not set in your environment or .env file.")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def explain(self, image: Image.Image, result: dict[str, Any]) -> str:
        label = result.get("result", "Unknown")
        confidence = result.get("confidence", 0.0)
        probabilities = result.get("probabilities", {})
        real_prob = probabilities.get("real", 0.0)
        ai_prob = probabilities.get("ai_generated", 0.0)

        prompt = (
            f"You are an AI forensics assistant. A classifier predicted this image is '{label}' "
            f"with {confidence}% confidence (Real: {real_prob}%, AI-generated: {ai_prob}%).\n\n"
            f"Explain in 2-3 concise sentences why this image fits this classification based on its visual details:\n"
            f"- If AI Generated: mention signs like texture smoothing, irregular symmetries, unnatural lighting, or synthetic artifacts.\n"
            f"- If Real: mention realistic camera traits like natural sensor grain, authentic lighting/shadows, and optical depth-of-field.\n"
            f"Write directly in plain text without headers, bullet points, or markdown formatting."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[image, prompt],
            )
            return response.text.strip() if response.text else "No explanation generated."
        except Exception as error:
            # Graceful fallback: model classification still succeeds even if Gemini is unreachable
            return (
                f"Classified as {label} with {confidence}% confidence. "
                "Detailed AI explanation is temporarily unavailable."
            )
