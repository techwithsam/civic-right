"""
Gemini 2.0 Flash Lite client and embeddings for Civic-Right.
"""

import os
import math
import hashlib
import google.generativeai as genai
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    admin_key: str = "civic-admin-secret"

    class Config:
        env_file = ".env"


settings = Settings()


def get_gemini_client() -> genai.GenerativeModel:
    if settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-2.0-flash-lite")


def _fallback_embedding(text: str, dim: int = 768) -> list[float]:
    """
    Deterministic pseudo-embedding for local development when GEMINI_API_KEY is not set.
    """
    vec = [0.0] * dim
    words = text.lower().split()
    for w in words:
        h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    # Normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


async def embed_text(text: str) -> list[float]:
    """Generate embedding for a piece of text using Gemini or local fallback."""
    if not settings.gemini_api_key:
        return _fallback_embedding(text)

    try:
        genai.configure(api_key=settings.gemini_api_key)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]
    except Exception as e:
        print(f"Warning: Gemini embed_content failed ({e}), using local embedding fallback.")
        return _fallback_embedding(text)


async def embed_query(query: str) -> list[float]:
    """Generate embedding for a search query using Gemini or local fallback."""
    if not settings.gemini_api_key:
        return _fallback_embedding(query)

    try:
        genai.configure(api_key=settings.gemini_api_key)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query",
        )
        return result["embedding"]
    except Exception as e:
        print(f"Warning: Gemini embed_query failed ({e}), using local embedding fallback.")
        return _fallback_embedding(query)
