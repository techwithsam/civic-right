"""
Source ingestion router (admin only).
Chunks and embeds government documents for RAG retrieval.
"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.gemini import embed_text, settings
from services.vector_store import store_embedding
import hashlib

router = APIRouter()

CHUNK_SIZE = 800  # characters per chunk
CHUNK_OVERLAP = 100


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


class IngestRequest(BaseModel):
    title: str
    organization: str
    url: str
    category: str  # roads | electricity | waste_flooding | policy | general
    content: str
    source_type: str = "official"  # official | credible_external


class IngestResponse(BaseModel):
    source_id: str
    chunks_stored: int
    message: str


@router.post("/", response_model=IngestResponse)
async def ingest_source(
    request: IngestRequest,
    x_admin_key: str = Header(default=""),
):
    # Basic admin key check
    if settings.admin_key and x_admin_key != settings.admin_key:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Generate deterministic source_id
    source_id = hashlib.sha256(request.url.encode()).hexdigest()[:16]

    # Chunk the content
    chunks = chunk_text(request.content)
    stored = 0

    for i, chunk in enumerate(chunks):
        embedding = await embed_text(chunk)
        await store_embedding(
            source_id=source_id,
            chunk_index=i,
            content=chunk,
            embedding=embedding,
            metadata={
                "title": request.title,
                "organization": request.organization,
                "url": request.url,
                "category": request.category,
                "source_type": request.source_type,
                "source_id": source_id,
            },
        )
        stored += 1

    return IngestResponse(
        source_id=source_id,
        chunks_stored=stored,
        message=f"Ingested '{request.title}' in {stored} chunks.",
    )
