# Civic-Right 🏛️
### *Information You Can Trust — Empowering Citizens, Holding Institutions Accountable*

[![OSF × Andela Hackathon](https://img.shields.io/badge/OSF%20%C3%97%20Andela-Hackathon%202026-059669?style=for-the-badge)](https://osf-hackathon.vercel.app/)
[![Challenge Track](https://img.shields.io/badge/Track-Transparency%20%26%20Accountability-2563EB?style=for-the-badge)](https://osf-hackathon.vercel.app/brief)
[![Cross Track](https://img.shields.io/badge/Cross--Track-Stability%20%26%20Social%20Cohesion-0D9488?style=for-the-badge)](https://osf-hackathon.vercel.app/brief)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20%2B%20RAG-7C3AED?style=for-the-badge)](https://deepmind.google/technologies/gemini/)

Built for the **OSF × Andela "Information You Can Trust" Hackathon 2026**.

---

## 📌 Executive Summary

For millions of citizens across African communities, essential civic information is fragmented, outdated, or buried behind opaque bureaucracies. When public infrastructure fails — a collapsed bridge, prolonged electricity blackout, or clogged drainage causing urban flooding — citizens do not know which agency is responsible, how to report it effectively, or whether their government is taking action.

**Civic-Right** closes this accountability gap by providing a **two-way, verified civic tech platform**:
1. **Government $\rightarrow$ Citizen (Verified Information)**: An AI-powered RAG (Retrieval-Augmented Generation) engine grounded *strictly* in verified government publications, public utilities announcements, and policies, providing accurate answers with traceable source citations.
2. **Citizen $\rightarrow$ Government (Actionable Accountability)**: An intelligent civic issue reporting pipeline that uses AI to parse, categorize, and deduplicate community reports, routing them to the correct local authority with real-time status tracking.

Targeted at three critical everyday infrastructure areas:
> 🚧 **Roads & Infrastructure** · ⚡ **Electricity** · 🌊 **Waste & Urban Flooding**

---

## 🎯 Alignment with OSF Hackathon Brief

### Selected Tracks
* **Primary Track — Transparency & Accountability**: Makes municipal decisions, agency responsibilities, and public works progress visible and open to scrutiny in real time.
* **Cross Track — Stability & Social Cohesion**: Prevents friction and local disputes by providing a single source of truth on shared public utilities (power schedules, road works, drainage clearing).

### Operating Constraints Addressed
| Hackathon Constraint | How Civic-Right Addresses It |
| :--- | :--- |
| **Trust & Verification** | Zero-hallucination RAG. The AI assistant answers *strictly* from embedded government documents and clearly cites the publisher, title, and link. |
| **Low Bandwidth & Basic Devices** | Lightweight, mobile-first Next.js 16 client, minimal bundle overhead, cached client states, and instant UI feedback. |
| **Clear Next Steps** | Citizens are never left stranded. Every answer and report gives clear actionable pathways: assigned government agency, official contact details, and resolution timelines. |
| **Local Relevance** | Geographically scoped to Local Government Areas (LGAs) and verified local bodies (e.g. Oyo State OYSROMA, IBEDC, Waste Management Authority), easily extensible across any African state or nation. |
| **Privacy & Security** | Granular Firebase security rules, protected citizen identity, and role-based access for citizens vs. verified government officials. Public registration is citizen-only; government accounts require administrative provisioning. |
| **Accessibility & Plain Language** | Gemini translates dense civil service policy language into clear, structured takeaways: *What Changed*, *What It Means For You*, and *What To Do Next*. |

---

## 💡 Two Core End-to-End Workflows

### Flow 1: Citizen Issue Reporting & Government Action Loop
```text
CITIZEN                                      GOVERNMENT
Report issue
     │
     ▼
AI identifies category + location
     │
     ▼
Check existing nearby issues
   ┌─┴────────────────┐
   ▼                  ▼
[Existing Issue?]   [New Issue?]
   │                  │
Confirm / Upvote    Create Report
   │                  │
   └─────────┬────────┘
             ▼
Responsible authority routed (e.g., OYSROMA, IBEDC)
             │
             ▼
Government Dashboard receives prioritised report
             │
             ▼
Official acknowledges & updates status (Assigned → In Progress → Resolved)
             │
             ▼
Citizen sees real-time progress timeline & official notes
```

### Flow 2: Verified Citizen Policy Inquiry (RAG)
```text
CITIZEN
Ask about policy (e.g., "What does the new tax reform mean for my small business?")
     │
     ▼
Semantic Knowledge Base Search (Curated Official Gazettes & Portals)
     │
     ▼
Official government sources retrieved (Ministry of Finance, NERC, FIRS, FERMA)
     │
     ▼
Gemini 2.5 Flash synthesis (strict ground-truth prompt guard)
     │
     ▼
Plain-language explanation (Summary | Full Answer | What To Do checklist)
     │
     ▼
Official Sources with in-app Gazette Reader & verified Ministry links
```

---

## 💡 Key Features

### 1. 🔍 Ask AI — Verified Government Information (RAG)
- Citizens ask natural-language questions about government policies, electricity tariff schedules, flood alerts, or road construction plans.
- Powered by **Google Gemini 2.5 Flash** with a curated **Civic Knowledge Base** of 12 official Nigerian government documents.
- **Retrieval-Augmented Generation (RAG)**: Answers are retrieved from and grounded strictly in verified publications — no hallucination.
- Structured response format: **Summary**, full explanation, **What To Do** action list, and official source citations with publication dates.
- **Zero Hallucinations**: If official documents don't cover the question, the system transparently admits it.

### 2. 📢 Smart Issue Reporting & Deduplication
- **Free-text reporting**: Citizens simply describe what they see (*"Huge crater in the middle of Elebu market road causing traffic"*).
- **AI Classification**: Fast automated extraction of category, severity level, problem summary, and location.
- **Community Deduplication**: Before creating duplicate tickets, the system checks for existing reports within proximity and allows citizens to **confirm / upvote** the existing issue to boost its priority.

### 3. 🗺️ Community Issues Feed & Real-Time Tracking
- Citizens view active issues in their Local Government Area (LGA).
- Real-time Firestore subscriptions notify users as the status updates from:
  $$\text{Reported} \longrightarrow \text{Community Confirmed} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved}$$

### 4. 🏛️ Government Official Dashboard
- Dedicated portal for municipal authorities.
- Prioritizes issues based on citizen confirmation counts and AI severity scoring.
- Enables public officials to acknowledge issues, update progress notes, and signal resolution back to the community.
- **Account Protection**: Public registration is citizen-only. Government accounts are provisioned via secure administrative command to prevent unverified actors from claiming official agency identities.

---

## 🛠️ Architecture & Tech Stack

```
civic-right/
├── web/                       # Next.js 16 Web Application
│   ├── app/
│   │   ├── (auth)/            # Login & Citizen Registration
│   │   ├── (citizen)/         # Home, Report, Community Issues, Ask AI
│   │   └── (gov)/             # Authority Dashboard & Management
│   ├── lib/firebase/          # Auth context, Firestore data layer
│   └── app/globals.css        # Civic-Slate design system & tokens
├── api/                       # Python FastAPI Backend
│   ├── data/
│   │   └── documents.json     # Seeded official government source embeddings
│   ├── routers/
│   │   ├── classify.py        # Gemini free-text issue classifier
│   │   ├── ask.py             # RAG citizen inquiry router
│   │   └── ingest.py          # Document chunking & embedding ingestion
│   └── services/
│       ├── gemini.py          # Gemini 2.0 Flash Lite client & embeddings
│       ├── rag.py             # Semantic context builder & prompt guard
│       └── vector_store.py    # Zero-config local vector store & cosine search
├── scripts/
│   └── create-gov-user.mjs    # Admin CLI tool to securely provision government officials
├── firestore.rules            # Granular database security rules
└── seed.js                    # Demo seed script with realistic data
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (Turbopack, App Router) | Fast, responsive, server & client rendered application |
| **Styling & Design** | Vanilla CSS + Tailwind CSS v4 | Bespoke *Civic Slate* theme with high contrast & dark aesthetics |
| **Icons & Typography** | Phosphor Icons + Plus Jakarta Sans | Clear visual hierarchy and accessible civic typography |
| **Database & Auth** | Firebase Auth & Cloud Firestore | Real-time synchronization and user role management |
| **Backend API** | Python 3.11 + FastAPI | Async high-performance AI backend |
| **LLM & Embeddings** | Google Gemini 2.5 Flash + `google-genai` SDK | Fast, high-quality civic answer synthesis with structured JSON output |
| **Civic Knowledge Base** | 12 Official Nigerian Government Documents (local RAG) | Tax Reform (FIRS/JTB), Electricity (NERC), Infrastructure (FERMA/OYSROMA) — zero external DB required |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+
- **Python**: 3.11+
- **Firebase Project**: (configured with Auth and Firestore)
- **Google Gemini API Key**: [Get a Gemini API Key](https://aistudio.google.com/) — used for Gemini 2.5 Flash answer synthesis and text embeddings.
  - *(Optional for local testing — built-in lexical search and structured fallback synthesis are included)*

---

### 1. Clone Repository
```bash
git clone https://github.com/techwithsam/civic-right.git
cd civic-right
```

---

### 2. Frontend Setup (`web/`)
```bash
cd web
npm install

# Create local environment config
cp .env.local.example .env.local
```

Configure `web/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="civic-right.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="civic-right"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="civic-right.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_AI_API_URL="http://localhost:8000"
```

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Backend AI Setup (`api/`)
```bash
cd ../api

# Create and activate Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies (zero external DB required!)
pip install -r requirements.txt
```

Configure `api/.env`:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
ADMIN_KEY="civic-admin-secret"
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
Interactive Swagger docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

> **Note**: The Civic Knowledge Base (`api/knowledge_base/`) is pre-seeded with 12 official Nigerian government documents. No external database setup is required.

---

### 4. Provisioning Government Accounts (Admin CLI)
To maintain security and prevent unverified public users from claiming official authority roles, government accounts are provisioned via administrative CLI:

```bash
# From the project root:
node scripts/create-gov-user.mjs <email> <password> "<Full Name>" "<Agency Name>" "<State>" "<LGA>"

# Example:
node scripts/create-gov-user.mjs works@oyostate.gov.ng SecurePass2026! "Engr. Tunde Adeleke" "Oyo State Ministry of Works" "Oyo" "Ibadan North"
```

Government officials can then log in at `/login` and access their dedicated portal at `/dashboard`.

---

### 5. Seed Demo Data (Optional)
To populate Firestore with demo authorities and realistic community issues:
```bash
node seed.js
```

---

## 🏆 How Civic-Right Meets the Judging Criteria

| Criterion | Civic-Right Implementation |
| :--- | :--- |
| **1. Uniqueness** | Rather than a passive bulletin board or a generic chatbot, Civic-Right implements a **closed-loop civic operating model**. It merges RAG-verified policy retrieval with crowd-deduplicated civic issue reporting and verifiable government workflows. |
| **2. Scalability** | The data model is partitioned cleanly by `state` and `lga` (Local Government Area). Adapting Civic-Right from Ibadan, Nigeria to Nairobi, Kenya or Accra, Ghana requires simply ingesting that municipality's gazettes and seeding its local agency directory. |
| **3. AI Coding Usage** | Built end-to-end using advanced AI agentic workflows: automated Next.js UI scaffolding, Gemini 2.5 Flash structured RAG prompting, curated 12-document official Nigerian civic knowledge base, and automated build validation. |
| **4. Presentation & Polish** | Features a custom-crafted design system (*Civic Slate*), smooth state transitions, mobile-first navigation, full error states, resilient offline/fallback handlers, and clean production build verification (`npm run build`). |

---

## 👥 Hackathon Team & Acknowledgements
- **Team**: Civic-Right
- **Event**: OSF × Andela Hackathon 2026 (*Information you can trust*)
- **Special Thanks**: [Open Society Foundations](https://www.opensocietyfoundations.org/) & [Andela](https://andela.com/) for empowering African developers to build technology for transparency and social cohesion.

---

*“Information you can trust is the foundation of a society that works.”*
