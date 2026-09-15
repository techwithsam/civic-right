"""
Vector store operations using Supabase pgvector.
Handles storing and searching document embeddings for RAG.
"""

from supabase import create_client, Client
from .gemini import settings


def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def store_embedding(
    source_id: str,
    chunk_index: int,
    content: str,
    embedding: list[float],
    metadata: dict,
) -> dict:
    """Store a document chunk + embedding in Supabase."""
    client = get_supabase()
    result = (
        client.table("document_chunks")
        .insert(
            {
                "source_id": source_id,
                "chunk_index": chunk_index,
                "content": content,
                "embedding": embedding,
                "metadata": metadata,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else {}


async def search_similar(query_embedding: list[float], match_count: int = 5) -> list[dict]:
    """
    Semantic search using pgvector cosine similarity.
    Requires the `match_documents` RPC function in Supabase.
    """
    client = get_supabase()
    result = client.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
        },
    ).execute()
    return result.data or []
