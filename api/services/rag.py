"""
RAG pipeline: retrieve relevant chunks, build context, call Gemini.
"""

from .gemini import get_gemini_client, embed_query
from .vector_store import search_similar

SYSTEM_PROMPT = """You are a civic information assistant for Nigerian citizens.
Your job is to explain government policies, announcements, and public information 
clearly and accurately.

STRICT RULES:
1. Answer ONLY from the provided source documents. Do not invent facts.
2. If the sources don't contain enough information to answer the question, 
   say clearly: "The available official sources don't provide enough information 
   on this topic."
3. Always cite the source(s) you used at the end of your answer.
4. Use plain, simple language that any Nigerian citizen can understand.
5. Structure your answer with: What changed | What it means for you | What to do next
   (only include sections that are relevant to the question)
"""


async def answer_with_rag(question: str) -> dict:
    """
    Full RAG pipeline:
    1. Embed the question
    2. Retrieve similar document chunks
    3. Build context
    4. Ask Gemini to answer from context only
    5. Return answer + sources
    """
    # Step 1: Embed the question
    query_embedding = await embed_query(question)

    # Step 2: Retrieve relevant chunks
    chunks = await search_similar(query_embedding, match_count=5)

    if not chunks:
        return {
            "answer": "The available official sources don't have information on this topic yet. Please check back later or visit a relevant government website directly.",
            "sources": [],
        }

    # Step 3: Build context string
    context_parts = []
    sources_seen = set()
    sources = []

    for chunk in chunks:
        context_parts.append(chunk["content"])
        meta = chunk.get("metadata", {})
        source_id = meta.get("source_id", "")
        if source_id not in sources_seen:
            sources_seen.add(source_id)
            sources.append(
                {
                    "title": meta.get("title", "Government Source"),
                    "organization": meta.get("organization", ""),
                    "url": meta.get("url", ""),
                    "source_id": source_id,
                }
            )

    context = "\n\n---\n\n".join(context_parts)

    # Step 4: Build prompt and call Gemini
    prompt = f"""
Source Documents:
{context}

---

Citizen Question: {question}

Please answer the question based ONLY on the source documents above. 
Follow the system instructions strictly.
"""

    model = get_gemini_client()
    response = model.generate_content(
        [SYSTEM_PROMPT, prompt],
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 1024,
        },
    )

    return {
        "answer": response.text,
        "sources": sources,
    }
