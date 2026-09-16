"""
Zero-config local vector store for Civic-Right.
Stores and searches document embeddings locally without external database dependencies.
"""

import os
import json
import math
from typing import List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORE_FILE = os.path.join(DATA_DIR, "documents.json")


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two numeric vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def _load_store() -> List[Dict[str, Any]]:
    """Load stored chunks from disk."""
    if not os.path.exists(STORE_FILE):
        return _init_default_documents()

    try:
        with open(STORE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not data:
                return _init_default_documents()
            return data
    except Exception as e:
        print(f"Warning: could not read {STORE_FILE} ({e}), initializing defaults.")
        return _init_default_documents()


def _save_store(chunks: List[Dict[str, Any]]) -> None:
    """Persist chunks to disk."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STORE_FILE, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)


def _init_default_documents() -> List[Dict[str, Any]]:
    """
    Initial seed of verified government notices and policies across
    Roads, Electricity, and Waste/Flooding.
    """
    from .gemini import _fallback_embedding

    default_docs = [
        {
            "source_id": "oysroma-road-charter",
            "chunk_index": 0,
            "content": (
                "Oyo State Road Maintenance Agency (OYSROMA) Public Infrastructure Charter: "
                "Roads across Ibadan (including Elebu, Ring Road, Dugbe, Iwo Road, and Sango) "
                "damaged by erosion, heavy rainfall, or heavy vehicle traffic are rehabilitated "
                "under the state rapid intervention framework. When citizens report potholes or road cave-ins, "
                "field engineers conduct inspection within 48 to 72 hours. Emergency patches and asphalt grading "
                "are scheduled to prevent fatal vehicular accidents."
            ),
            "metadata": {
                "title": "OYSROMA Road Maintenance & Pothole Rehabilitation Guidelines",
                "organization": "Oyo State Ministry of Works & Transport",
                "url": "https://oyostate.gov.ng/works",
                "category": "roads",
                "source_type": "official",
                "source_id": "oysroma-road-charter",
            },
        },
        {
            "source_id": "ibedc-service-charter",
            "chunk_index": 0,
            "content": (
                "Ibadan Electricity Distribution Company (IBEDC) Consumer Service Standards: "
                "Under Nigerian Electricity Regulatory Commission (NERC) service band regulations, "
                "Band A receives 20+ hours daily, Band B receives 16-20 hours, and Band C receives 12-16 hours. "
                "In the event of blown transformers, cable snapping, or feeder tripping, communities must log "
                "the incident via official channels. IBEDC technical response teams are mandated to inspect distribution "
                "substations within 24 hours. Consumers are strictly prohibited from contributing self-funded levies "
                "for utility-owned transformer replacement without formal IBEDC approval."
            ),
            "metadata": {
                "title": "IBEDC Customer Protection & Power Outage Resolution Protocol",
                "organization": "Ibadan Electricity Distribution Company (IBEDC)",
                "url": "https://ibedc.com/customer-charter",
                "category": "electricity",
                "source_type": "official",
                "source_id": "ibedc-service-charter",
            },
        },
        {
            "source_id": "ibedc-meter-replacement",
            "chunk_index": 1,
            "content": (
                "IBEDC Prepaid Meter Upgrade and Fault Resolution: "
                "Customers experiencing token rejection, burnt meter terminals, or phase loss must report to "
                "the nearest business hub. Faulty prepaid meters undergo technical evaluation within 5 working days. "
                "Where a meter is declared obsolete or damaged through network surge, replacement is processed under "
                "the National Mass Metering Programme guidelines. Energy theft and meter bypass carry severe penalties."
            ),
            "metadata": {
                "title": "IBEDC Prepaid Metering and Fault Replacement Procedures",
                "organization": "Ibadan Electricity Distribution Company (IBEDC)",
                "url": "https://ibedc.com/metering",
                "category": "electricity",
                "source_type": "official",
                "source_id": "ibedc-service-charter",
            },
        },
        {
            "source_id": "oyo-drainage-flooding-policy",
            "chunk_index": 0,
            "content": (
                "Oyo State Ministry of Environment Flood Alert and Waste Management Regulations: "
                "To prevent urban flooding in flood-prone LGAs (Ibadan North, Ibadan North-East, Ido, and Oluyole), "
                "primary rivers such as Ogunpa, Kudeti, and Ona are dredged annually before torrential rainy seasons. "
                "Dumping solid waste into gutters, stream channels, and drainage culverts is strictly illegal under "
                "the Oyo State Environmental Sanitation Law and attracts heavy fines or community service. "
                "Communities are urged to report clogged culverts and illegal dumpsites for immediate clearance."
            ),
            "metadata": {
                "title": "Oyo State Flood Prevention & Drainage Maintenance Advisory",
                "organization": "Oyo State Ministry of Environment & Natural Resources",
                "url": "https://oyostate.gov.ng/environment",
                "category": "waste_flooding",
                "source_type": "official",
                "source_id": "oyo-drainage-flooding-policy",
            },
        },
    ]

    # Pre-populate with fallback embeddings
    for doc_item in default_docs:
        doc_item["embedding"] = _fallback_embedding(doc_item["content"])

    _save_store(default_docs)
    return default_docs


async def store_embedding(
    source_id: str,
    chunk_index: int,
    content: str,
    embedding: List[float],
    metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """Store a document chunk + embedding in local storage."""
    chunks = _load_store()

    # Remove existing chunk with same source_id and chunk_index if it exists
    chunks = [
        c
        for c in chunks
        if not (c.get("source_id") == source_id and c.get("chunk_index") == chunk_index)
    ]

    new_entry = {
        "source_id": source_id,
        "chunk_index": chunk_index,
        "content": content,
        "embedding": embedding,
        "metadata": metadata,
    }
    chunks.append(new_entry)
    _save_store(chunks)
    return new_entry


async def search_similar(query_embedding: List[float], match_count: int = 5) -> List[Dict[str, Any]]:
    """
    Perform semantic search using cosine similarity across all stored chunks.
    """
    chunks = _load_store()
    if not chunks:
        return []

    scored_chunks = []
    for c in chunks:
        c_emb = c.get("embedding")
        if not c_emb:
            continue
        sim = _cosine_similarity(query_embedding, c_emb)
        scored_chunks.append({**c, "similarity": sim})

    # Sort descending by similarity score
    scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_chunks[:match_count]
