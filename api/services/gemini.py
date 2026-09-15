"""
Gemini 2.0 Flash Lite client for Civic-Right.
"""

import os
import google.generativeai as genai
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()


def get_gemini_client() -> genai.GenerativeModel:
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-2.0-flash-lite")


def get_embedding_model():
    genai.configure(api_key=settings.gemini_api_key)
    return "models/text-embedding-004"


async def embed_text(text: str) -> list[float]:
    """Generate embedding for a piece of text."""
    genai.configure(api_key=settings.gemini_api_key)
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


async def embed_query(query: str) -> list[float]:
    """Generate embedding for a search query."""
    genai.configure(api_key=settings.gemini_api_key)
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=query,
        task_type="retrieval_query",
    )
    return result["embedding"]
