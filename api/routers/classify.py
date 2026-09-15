"""
Issue classification router.
Accepts a free-text description, returns structured civic issue data.
"""

import json
from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini import get_gemini_client

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


@router.post("/", response_model=ClassifyResponse)
async def classify_issue(request: ClassifyRequest):
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

    # Parse JSON from response
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    data = json.loads(text)

    return ClassifyResponse(
        category=data.get("category", "roads"),
        location=data.get("location"),
        problem=data.get("problem", request.description[:200]),
        severity=data.get("severity", "medium"),
        title=data.get("title", "Civic Issue"),
        raw_description=request.description,
    )
