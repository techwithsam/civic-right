"""
RAG Q&A router.
Answers citizen questions about government policies using grounded official sources.
"""

from typing import List, Optional, Union
from fastapi import APIRouter
from pydantic import BaseModel
from services.rag import answer_with_rag
from services.knowledge_base import load_manifest

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    topic: Optional[str] = None  # tax | electricity | infrastructure | None


class SourceItem(BaseModel):
    title: str
    organization: str
    url: str
    topic: Optional[str] = None
    source_type: str = "official"
    published_date: Optional[str] = None
    last_checked: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    summary: str
    what_to_do: Union[str, List[str]]
    sources: List[SourceItem]


@router.post("/", response_model=AskResponse)
async def ask_question(request: AskRequest):
    result = await answer_with_rag(request.question, topic=request.topic)
    return AskResponse(
        answer=result.get("answer", ""),
        summary=result.get("summary", ""),
        what_to_do=result.get("what_to_do", ""),
        sources=[SourceItem(**s) for s in result.get("sources", [])],
    )


@router.get("/sources", response_model=List[SourceItem])
async def list_sources():
    """Returns all official government sources in the Civic Knowledge Base."""
    manifest = load_manifest()
    return [
        SourceItem(
            title=item.get("title", ""),
            organization=item.get("organization", ""),
            url=item.get("url", ""),
            topic=item.get("topic"),
            source_type=item.get("source_type", "official"),
            published_date=item.get("published_date"),
            last_checked=item.get("last_checked"),
        )
        for item in manifest
    ]
