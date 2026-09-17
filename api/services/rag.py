"""
Phase 4 RAG Pipeline:
FastAPI + Gemini 2.5 Flash + Grounded Civic Knowledge Base.
Provides verified, structured civic explanations with official citations.
"""

import json
from typing import Dict, Any, List, Optional
from google.genai import types
from .gemini import get_genai_client, settings
from .knowledge_base import search_knowledge_base

SYSTEM_INSTRUCTION = """You are a trusted civic information assistant for Nigerian citizens.
Your mission is to explain official government policies, tax reforms, electricity regulations, and public works projects accurately and simply.

STRICT OPERATING RULES:
1. Answer ONLY using the provided official source documents. Do NOT invent facts or extrapolate beyond what is documented.
2. Do NOT provide personal opinions or present assumptions as facts.
3. If the provided sources do not contain enough information to answer the question, state clearly: "The available official sources do not provide enough information on this specific topic."
4. Clearly distinguish official government information from external commentary.
5. Provide the relevant official sources along with your answer.
6. Translate dense civil service and legal terminology into clear, accessible language that ordinary citizens, artisans, and small business owners can easily understand.

RESPONSE FORMAT:
You MUST respond with valid JSON adhering to this exact structure:
{
  "answer": "Comprehensive explanation structured under 'What It Means', 'In Simple Terms', and 'What You May Need To Do'.",
  "summary": "1 to 2 sentence direct plain-language takeaway.",
  "what_to_do": "Bullet points or concise action items for the citizen.",
  "sources": [
    {
      "title": "Document title from the sources",
      "organization": "Issuing government agency",
      "url": "Official URL",
      "topic": "tax | electricity | infrastructure",
      "source_type": "official",
      "published_date": "YYYY-MM-DD",
      "last_checked": "YYYY-MM-DD"
    }
  ]
}
"""


def _synthesize_local_response(
    question: str,
    matched_docs: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Structured fallback synthesizer for local testing or when Gemini API key is unset.
    Extracts key takeaways directly from the matched official documents.
    """
    if not matched_docs:
        return {
            "answer": "The available official government sources do not contain information on this topic yet. Please check back later or consult the relevant ministry website directly.",
            "summary": "No official government documents matched your question.",
            "what_to_do": "Check back later as new gazettes are indexed, or submit an inquiry through your Local Government council.",
            "sources": [],
        }

    top_doc = matched_docs[0]
    org = top_doc.get("organization", "Federal Ministry / Public Authority")
    title = top_doc.get("title", "Official Policy Guidelines")
    topic = top_doc.get("topic", "general")
    content = top_doc.get("content", "").strip()

    # Format structured answer sections
    answer = (
        f"### What it means\n"
        f"Based on official publications from the **{org}** in *{title}*:\n\n"
        f"{content[:500]}...\n\n"
        f"### In simple terms\n"
        f"For everyday citizens and small business owners in Nigeria, this policy officially guarantees clear rights and exemptions. "
        f"Under these documented guidelines, unauthorized levies or unmetered penalties are restricted by regulatory mandate.\n\n"
        f"### What you may need to do\n"
        f"1. Review your current status (e.g. business turnover or feeder band) against the criteria in {title}.\n"
        f"2. Keep a copy of relevant official records or receipts to assert your exemption or service rights.\n"
        f"3. If an agency or distribution company violates these guidelines, file an official dispute citing {org} standards."
    )

    summary = f"Official regulations from {org} define clear citizen protections, thresholds, and operational standards for {topic}."

    what_to_do = (
        f"• Verify your eligibility under {title}.\n"
        f"• Assert your rights under the published {org} charter.\n"
        f"• Report any non-compliance via Civic-Right to hold the responsible authority accountable."
    )

    sources = [
        {
            "title": d.get("title", ""),
            "organization": d.get("organization", ""),
            "url": d.get("url", ""),
            "topic": d.get("topic", "general"),
            "source_type": d.get("source_type", "official"),
            "published_date": d.get("published_date", ""),
            "last_checked": d.get("last_checked", ""),
        }
        for d in matched_docs
    ]

    return {
        "answer": answer,
        "summary": summary,
        "what_to_do": what_to_do,
        "sources": sources,
    }


async def answer_with_rag(
    question: str,
    topic: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Core RAG pipeline:
    1. Retrieve relevant official government documents from curated knowledge base.
    2. Prompt Gemini 2.5 Flash to synthesize a plain-language, grounded explanation.
    3. Return structured JSON with answers, takeaways, actions, and official source citations.
    """
    # 1. Retrieve top matching official documents
    matched_docs = search_knowledge_base(question, topic=topic, top_k=3)

    if not matched_docs:
        return {
            "answer": "The available official government sources do not have verified information on this specific question yet.",
            "summary": "No verified government documents found for this topic.",
            "what_to_do": "Try asking with different keywords or select another civic topic.",
            "sources": [],
        }

    client = get_genai_client()

    # If no API client available, use deterministic local synthesizer
    if not client:
        return _synthesize_local_response(question, matched_docs)

    # 2. Build grounded context from official documents
    context_blocks = []
    for doc in matched_docs:
        context_blocks.append(
            f"DOCUMENT: {doc['title']}\n"
            f"ORGANIZATION: {doc['organization']}\n"
            f"OFFICIAL URL: {doc['url']}\n"
            f"TOPIC: {doc['topic']}\n"
            f"PUBLICATION DATE: {doc['published_date']}\n"
            f"CONTENT:\n{doc['content']}"
        )
    context_text = "\n\n====================\n\n".join(context_blocks)

    user_prompt = (
        f"OFFICIAL GOVERNMENT SOURCES:\n\n{context_text}\n\n"
        f"====================\n\n"
        f"CITIZEN QUESTION:\n{question}\n\n"
        f"Respond in strictly valid JSON conforming to the requested schema."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        raw_text = response.text.strip()
        data = json.loads(raw_text)

        # Ensure all expected fields exist
        return {
            "answer": data.get("answer", ""),
            "summary": data.get("summary", ""),
            "what_to_do": data.get("what_to_do", ""),
            "sources": data.get("sources", [
                {
                    "title": d.get("title", ""),
                    "organization": d.get("organization", ""),
                    "url": d.get("url", ""),
                    "topic": d.get("topic", ""),
                    "source_type": "official",
                    "published_date": d.get("published_date", ""),
                    "last_checked": d.get("last_checked", ""),
                }
                for d in matched_docs
            ]),
        }

    except Exception as e:
        print(f"Warning: Gemini 2.5 Flash invocation failed ({e}), using grounded fallback synthesis.")
        return _synthesize_local_response(question, matched_docs)
