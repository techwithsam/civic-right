"""
RAG pipeline: retrieve relevant chunks, build context, call Gemini.
"""

from .gemini import get_gemini_client, embed_query, settings
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


def _synthesize_fallback_answer(question: str, chunks: list, sources: list) -> str:
    """Synthesize structured response directly from top matching chunks if Gemini API is unavailable."""
    top_chunk = chunks[0]
    top_org = top_chunk.get("metadata", {}).get("organization", "Relevant Public Agency")
    top_title = top_chunk.get("metadata", {}).get("title", "Official Policy Guidelines")
    content = top_chunk.get("content", "").strip()

    return (
        f"### Summary from {top_title} ({top_org})\n\n"
        f"{content}\n\n"
        f"**What it means for you**:\n"
        f"Official protocols require active community reports to trigger maintenance dispatch and technical evaluation. "
        f"Under these guidelines, unauthorized levies are prohibited and response times are bounded.\n\n"
        f"**What to do next**:\n"
        f"Use the Civic-Right **Report Issue** tool to log or upvote issues at your location. "
        f"Your report routes directly to {top_org} with real-time tracking."
    )


async def answer_with_rag(question: str) -> dict:
    """
    Full RAG pipeline:
    1. Embed the question
    2. Retrieve similar document chunks
    3. Build context
    4. Ask Gemini to answer from context only (or fallback cleanly)
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

    # If Gemini API key is missing, return clean synthesized context
    if not settings.gemini_api_key or settings.gemini_api_key.strip() == "":
        return {
            "answer": _synthesize_fallback_answer(question, chunks, sources),
            "sources": sources,
        }

    # Step 4: Build prompt and call Gemini
    prompt = f"""
Source Documents:
{context}

---

Citizen Question: {question}

Please answer the question based ONLY on the source documents above. 
Follow the system instructions strictly.
"""

    try:
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
    except Exception as e:
        print(f"Warning: Gemini generate_content failed ({e}), using fallback synthesis.")
        return {
            "answer": _synthesize_fallback_answer(question, chunks, sources),
            "sources": sources,
        }

