# Civic-Right 🏛️
### *Information You Can Trust — Empowering Citizens, Holding Institutions Accountable*

[![OSF × Andela Hackathon](https://img.shields.io/badge/OSF%20%C3%97%20Andela-Hackathon%202026-059669?style=for-the-badge)](https://osf-hackathon.vercel.app/)
[![Track](https://img.shields.io/badge/Track-Transparency%20%26%20Accountability-2563EB?style=for-the-badge)](https://osf-hackathon.vercel.app/brief)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-7C3AED?style=for-the-badge)](https://deepmind.google/technologies/gemini/)

Built for the **OSF × Andela "Information You Can Trust" Hackathon 2026**.

---

## 🔗 Submission Links & Media

| Resource | Link |
| :--- | :--- |
| 🎥 **Demo Video** | [Watch on YouTube](https://youtu.be/7DrsiL65VcM) |
| 📊 **Pitch Deck & Presentation** | [View Google Slides](https://docs.google.com/presentation/d/1X6UOaapI0D6nOLd2Q4iv736tgPcNFtFJKucBZshJIz4/edit?usp=sharing) |
| 🌐 **Live Quick Tunnel** | Run `npm run tunnel` to expose a live public URL instantly via Cloudflare |

---

## 📌 Problem & Solution

In many African communities, vital public information is fragmented and municipal bureaucracies are opaque. When public services fail — blackouts, collapsed roads, or urban flooding — citizens don't know who is responsible, how to report it, or whether action is being taken.

**Civic-Right** bridges this gap with a **two-way, verified civic accountability platform**:
1. **Government $\rightarrow$ Citizen (Verified Policy RAG)**: Grounded AI explains official government gazettes, electricity tariff orders, and tax reforms in plain language with clickable citations.
2. **Citizen $\rightarrow$ Government (Actionable Issue Reporting)**: Citizens describe problems in plain text; AI categorizes the issue, detects nearby duplicates for community upvoting, and routes reports directly to the responsible authority with real-time status tracking.

> Targeted focus areas: 🚧 **Roads & Infrastructure** · ⚡ **Electricity** · 🌊 **Waste & Urban Flooding**

---

## 💡 Two Core Workflows

### 1. Citizen Issue Reporting & Government Accountability Loop
```text
[Citizen Report] 
      │
      ▼
[AI Classification] (Category: Roads/Power/Waste · Severity: Low/Med/High)
      │
      ▼
[Duplicate Check] ──(Found nearby?)──► [Citizen Upvotes / Confirms Existing Issue]
      │ (New Issue)
      ▼
[Route to Authority] (e.g., Oyo Ministry of Works, IBEDC, Waste Authority)
      │
      ▼
[Government Dashboard] ──► [Official Updates Status & Adds Progress Note]
      │
      ▼
[Real-Time Citizen Tracking] (Live timeline update on citizen's device)
```

### 2. Verified Policy Inquiry (RAG)
```text
[Citizen Policy Question] (e.g., "What does the 2025 tax reform mean for my small business?")
      │
      ▼
[Semantic Knowledge Base Retrieval] (12 Official Nigerian Government Gazettes)
      │
      ▼
[Gemini 2.5 Flash Grounded Synthesis] (Strict anti-hallucination prompt guard)
      │
      ▼
[Structured Response] (Summary Pill · Plain-English Breakdown · Action Checklist)
      │
      ▼
[Official Source Modal] (Read verified gazette in-app or visit official agency portal)
```

---

## ✨ Key Features

- **Zero-Hallucination Policy RAG**: Powered by Google Gemini 2.5 Flash and a curated knowledge base of 12 official Nigerian government gazettes (FIRS, NERC, FERMA, JTB, Ministry of Finance).
- **In-App Official Source Reader**: Citizens can read the full text of policy documents and regulatory orders inside the app without hitting 404s or broken ministry links.
- **Smart Duplicate Detection**: Nearby reports are surfaced to prevent municipal inbox clutter. Citizens upvote existing issues to elevate them on the government dashboard.
- **Role-Gated Government Portal**: Public registration is citizen-only. Government accounts are provisioned administratively to prevent impersonation.
- **Real-Time Progress Tracking**: Powered by Firestore snapshot listeners — when a government official updates a status or posts an update note, citizens see it instantly.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.17+
- Python 3.11+
- Google Gemini API Key ([Get one free at Google AI Studio](https://aistudio.google.com/))

### 1. Setup Backend (`api/`)
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Add your Gemini API key
echo "GEMINI_API_KEY=your_gemini_key_here" > .env

# Run FastAPI backend (port 8000)
uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend (`web/`)
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Next.js automatically proxies `/api/ai/*` to the FastAPI backend.

### 3. Instant Public Deployment (Cloudflare Tunnel)
To share the running app with judges or external reviewers without hosting setup:
```bash
# In project root:
npm run tunnel
```
Share the generated `https://<random-name>.trycloudflare.com` URL. The built-in proxy enables both frontend and AI backend to work through the single URL.

---

## 👥 Demo Accounts for Reviewers

| Persona | Email | Password | Role & Screen |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen.demo@civicright.ng` | `DemoCitizenPass2026!` | Citizen feed & reports (`/home`) |
| **Official** | `works@oyostate.gov.ng` | `SecurePass2026!` | Government triage dashboard (`/dashboard`) |

*(Optional: Run `node seed.js` from root anytime to populate realistic demo reports).*

---

## 🏆 Hackathon Judging Criteria Alignment

| Criterion | Civic-Right Implementation |
| :--- | :--- |
| **Uniqueness** | Closed-loop civic tech: combines verified RAG policy advice with crowd-deduplicated civic reporting and verified government response. |
| **Scalability** | Partitioned cleanly by State and LGA. Easily adaptable to any African municipality by loading local gazettes and authority directories. |
| **Trust & Verification** | Strictly grounded in official documents with zero-hallucination guardrails and in-app verifiable source citations. |
| **Presentation & Polish** | Bespoke *Civic Slate* design system, mobile-first navigation, full loading/skeleton states, and real-time reactive UI. |

---

*“Information you can trust is the foundation of a society that works.”*
