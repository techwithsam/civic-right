"""
RAG Q&A router.
Answers citizen questions about government policies using grounded official sources.
"""

from typing import List, Optional, Union
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import answer_with_rag
from services.knowledge_base import load_manifest, get_document_content

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    topic: Optional[str] = None  # tax | electricity | infrastructure | None


class SourceItem(BaseModel):
    id: Optional[str] = None
    title: str
    organization: str
    url: str
    topic: Optional[str] = None
    source_type: str = "official"
    published_date: Optional[str] = None
    last_checked: Optional[str] = None


class SourceDetail(SourceItem):
    content: str


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
            id=item.get("id"),
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


@router.get("/sources/{source_id}", response_model=SourceDetail)
async def get_source_document(source_id: str):
    """Returns complete official policy document text and metadata."""
    manifest = load_manifest()
    doc_item = next((item for item in manifest if item.get("id") == source_id), None)
    if not doc_item:
        raise HTTPException(status_code=404, detail="Official source document not found")
    
    content = get_document_content(doc_item.get("file_name", ""))
    return SourceDetail(
        id=doc_item.get("id"),
        title=doc_item.get("title", ""),
        organization=doc_item.get("organization", ""),
        url=doc_item.get("url", ""),
        topic=doc_item.get("topic"),
        source_type=doc_item.get("source_type", "official"),
        published_date=doc_item.get("published_date"),
        last_checked=doc_item.get("last_checked"),
        content=content,
    )

