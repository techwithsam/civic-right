"""
Civic Knowledge Base service.
Loads, manages, and searches the 12 official Nigerian government documents.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional

KB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_base")
MANIFEST_PATH = os.path.join(KB_DIR, "manifest.json")


def load_manifest() -> List[Dict[str, Any]]:
    """Load the metadata manifest for all curated official documents."""
    if not os.path.exists(MANIFEST_PATH):
        return []
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_document_content(file_name: str) -> str:
    """Read full markdown text of a knowledge base document."""
    file_path = os.path.join(KB_DIR, file_name)
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def search_knowledge_base(
    query: str,
    topic: Optional[str] = None,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Search curated documents using lexical and semantic keyword scoring.
    Returns matched documents with content excerpts and metadata.
    """
    manifest = load_manifest()
    if not manifest:
        return []

    # Clean query tokens
    query_tokens = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]
    scored = []

    # Topic expansion terms
    topic_keywords = {
        "tax": ["tax", "firs", "vat", "cit", "withholding", "wht", "jtb", "levy", "haulage", "small business", "exemption", "50m", "turnover"],
        "electricity": ["electricity", "power", "nerc", "disco", "ibedc", "ekedc", "tariff", "band", "meter", "estimated", "billing", "disconnection", "transformer"],
        "infrastructure": ["road", "pothole", "highway", "ferma", "works", "transport", "flood", "drainage", "gutter", "oysroma", "erosion", "culvert"],
    }

    for item in manifest:
        file_name = item.get("file_name", "")
        doc_topic = item.get("topic", "").lower()
        title = item.get("title", "").lower()
        content = get_document_content(file_name)
        content_lower = content.lower()

        # Score calculation
        score = 0.0

        # Topic filter / bonus
        if topic and topic.lower() == doc_topic:
            score += 15.0

        # Title match
        for token in query_tokens:
            if token in title:
                score += 8.0

        # Content match frequency
        for token in query_tokens:
            occurrences = content_lower.count(token)
            if occurrences > 0:
                score += min(occurrences * 1.5, 12.0)

        # Related topic keywords match
        for kw in topic_keywords.get(doc_topic, []):
            if kw in query.lower():
                score += 3.0

        if score > 0.0:
            scored.append({
                "id": item.get("id"),
                "title": item.get("title"),
                "organization": item.get("organization"),
                "topic": item.get("topic"),
                "source_type": item.get("source_type", "official"),
                "url": item.get("url"),
                "published_date": item.get("published_date"),
                "last_checked": item.get("last_checked"),
                "file_name": file_name,
                "content": content,
                "score": score,
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
