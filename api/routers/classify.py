"""
Issue classification router.
Accepts a free-text description, returns structured civic issue data.
"""

import json
from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini import get_gemini_client, settings

router = APIRouter()

CLASSIFY_PROMPT = """You are an AI assistant that helps classify civic issues reported by Nigerian citizens.

Given a free-text description of a civic issue, extract and return a JSON object with:
- category: one of "roads", "electricity", "waste_flooding"
- location: the location mentioned (city, area, LGA if identifiable)
- problem: a short 1-sentence description of the issue
- severity: one of "low", "medium", "high" (based on urgency/impact)
- title: a short title (max 8 words) for the report

If no clear location is mentioned, use null for location.
If the issue doesn't fit the categories, pick the closest one.

Return ONLY valid JSON, no markdown, no explanation.

Example output:
{"category": "roads", "location": "Elebu, Ibadan", "problem": "Potholes and severe road damage causing accidents", "severity": "high", "title": "Damaged road around Elebu"}
"""


class ClassifyRequest(BaseModel):
    description: str
    user_location: str | None = None  # optional: user's current known location


class ClassifyResponse(BaseModel):
    category: str
    location: str | None
    problem: str
    severity: str
    title: str
    raw_description: str


def _heuristic_classify(description: str, user_location: str | None) -> dict:
    desc_lower = description.lower()

    # Determine category
    electricity_words = ["power", "light", "electricity", "transformer", "wire", "voltage", "blackout", "nepa", "ibedc", "meter", "phase", "outage"]
    waste_words = ["flood", "flooding", "drain", "drainage", "water", "gutter", "waste", "refuse", "dump", "trash", "canal", "sewage", "dirt"]
    roads_words = ["road", "pothole", "potholes", "tar", "traffic", "bridge", "street", "culvert", "express", "asphalt", "crater"]

    if any(w in desc_lower for w in electricity_words):
        category = "electricity"
        default_title = "Electricity Outage or Infrastructure Fault"
    elif any(w in desc_lower for w in waste_words):
        category = "waste_flooding"
        default_title = "Waste or Drainage / Flooding Hazard"
    else:
        category = "roads"
        default_title = "Road or Infrastructure Damage"

    # Determine severity
    high_words = ["urgent", "danger", "hazardous", "fatal", "accident", "death", "destroy", "emergency", "collapse", "severe", "fire", "exploded", "overflowing"]
    low_words = ["minor", "small", "cleaning", "slight"]
    if any(w in desc_lower for w in high_words):
        severity = "high"
    elif any(w in desc_lower for w in low_words):
        severity = "low"
    else:
        severity = "medium"

    # Generate short title from first sentence
    first_sentence = description.split(".")[0].strip()
    words = first_sentence.split()
    title = " ".join(words[:8]) if len(words) > 0 else default_title

    return {
        "category": category,
        "location": user_location,
        "problem": description[:200],
        "severity": severity,
        "title": title,
    }


@router.post("/", response_model=ClassifyResponse)
async def classify_issue(request: ClassifyRequest):
    # If Gemini API key is not configured, use heuristic classifier
    if not settings.gemini_api_key or settings.gemini_api_key.strip() == "":
        data = _heuristic_classify(request.description, request.user_location)
        return ClassifyResponse(
            category=data["category"],
            location=data["location"],
            problem=data["problem"],
            severity=data["severity"],
            title=data["title"],
            raw_description=request.description,
        )

    try:
        model = get_gemini_client()
        context = f"User description: {request.description}"
        if request.user_location:
            context += f"\nUser's general location: {request.user_location}"

        response = model.generate_content(
            [CLASSIFY_PROMPT, context],
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 256,
            },
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        data = json.loads(text)
        return ClassifyResponse(
            category=data.get("category", "roads"),
            location=data.get("location") or request.user_location,
            problem=data.get("problem", request.description[:200]),
            severity=data.get("severity", "medium"),
            title=data.get("title", "Civic Issue"),
            raw_description=request.description,
        )
    except Exception as e:
        # Graceful fallback on LLM quota or parsing issue
        data = _heuristic_classify(request.description, request.user_location)
        return ClassifyResponse(
            category=data["category"],
            location=data["location"],
            problem=data["problem"],
            severity=data["severity"],
            title=data["title"],
            raw_description=request.description,
        )
