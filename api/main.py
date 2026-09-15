"""
Civic-Right FastAPI AI Backend
Handles: issue classification, RAG Q&A, source ingestion
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import classify, ask, ingest

app = FastAPI(
    title="Civic-Right AI API",
    description="AI backend for civic issue classification and government information RAG",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://civic-right.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(ask.router, prefix="/ask", tags=["ask"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "civic-right-ai"}
