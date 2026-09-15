"""
RAG Q&A router.
Answers citizen questions about government policies using retrieved sources.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services.rag import answer_with_rag

router = APIRouter()


class AskRequest(BaseModel):
    question: str


class Source(BaseModel):
    title: str
    organization: str
    url: str
    source_id: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]


@router.post("/", response_model=AskResponse)
async def ask_question(request: AskRequest):
    result = await answer_with_rag(request.question)
    return AskResponse(
        answer=result["answer"],
        sources=[Source(**s) for s in result["sources"]],
    )
