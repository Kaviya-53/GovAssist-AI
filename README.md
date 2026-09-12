# GovAssist AI – Intelligent Government Scheme Eligibility & Document Assistant

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v3-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_%2B_SQLAlchemy-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![AI Engine](https://img.shields.io/badge/AI-Explainable_Rule_Engine-FF6F00.svg?style=flat)](#eligibility-engine)

A professional, hackathon/SIH-ready platform enabling Indian citizens to discover, cross-examine, and apply for Central and State government welfare schemes with transparent **Explainable AI (XAI)** decision breakdown and **automated Document Intelligence / OCR**.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Tech Stack](#tech-stack)
5. [Folder Structure](#folder-structure)
6. [Quick Start & Installation](#quick-start--installation)
7. [Demo Credentials](#demo-credentials)
8. [Eligibility Engine Design](#eligibility-engine-design)
9. [Document Intelligence & OCR Setup](#document-intelligence--ocr-setup)
10. [REST API Documentation](#rest-api-documentation)
11. [Troubleshooting & FAQs](#troubleshooting--faqs)
12. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview
Navigating over 500+ Indian welfare initiatives is fraught with bureaucratic friction, ambiguous criteria, and missing documentation. **GovAssist AI** solves this for 1.4 billion citizens by:
1. Converting raw identity and income documents into verified digital profile entities using local OCR and NLP regex pipelines.
2. Evaluating 16+ realistic Central/State schemes in real time using an explainable, deterministic rule engine.
3. Giving citizens clear reasons (Matched criteria, Disqualifiers, and Missing documents) rather than a "black-box" decision.
4. Providing a local, zero-API-cost AI Assistant answering questions like *"Which schemes am I eligible for?"* or *"Why was I disqualified for PMAY?"*.

---

## ✨ Key Features

- 🇮🇳 **16 Central & State Schemes Pre-Loaded**: High-impact schemes covering Agriculture, Healthcare, Housing, Education, Women Welfare, Employment/MSME, and Social Security.
- 🔍 **Local Document Intelligence**: Extracts Name, DOB/Age, Gender, ID numbers (Aadhaar/PAN), Annual Family Income, Social Category, and Domicile State from uploaded PDFs and images.
- 💡 **Explainable AI (XAI) Eligibility**:
  - Exact match percentage (0–100%).
  - Detailed list of matched requirements (green checkmarks).
  - Explicit disqualification reasons (red crosses).
  - Recommended missing documents (amber tags).
- 🤖 **Context-Aware Local Chatbot**: Natural language Q&A referencing the active database and the user's specific credentials without paid third-party APIs.
- 🏛️ **Administrative Command Center**: Complete scheme CRUD, policy criteria sliders, user directory, and interactive analytics charts (Recharts).
- ⚡ **1-Click SIH Hackathon Demo Quick-Fill**: Instant demo citizen and demo admin buttons for seamless evaluations.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│               Frontend: React 18 + Vite                │
│    (Tailwind CSS, Lucide Icons, Recharts, Axios)       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (JWT Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend: Python FastAPI                  │
│  ├── /auth: Salted Hash & JWT Token Generation         │
│  ├── /users: Profile & Socio-Economic Parameters       │
│  ├── /documents: PDF Parsing (PyPDF) & OCR (Tesseract) │
│  ├── /schemes: Scheme Catalog & Admin CRUD             │
│  ├── /eligibility: Multi-Criteria Explainable Engine   │
│  ├── /chat: Rule/Intent NLP Scheme Assistant           │
│  └── /admin: Aggregated Analytics & Telemetry          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Storage Layer: SQLite + SQLAlchemy           │
│   users | citizen_profiles | schemes | scheme_criteria │
│   documents | eligibility_results | applications       │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 | Ultra-fast SPA, responsive GovTech UI |
| **Icons & Charts** | Lucide React, Recharts | Government-fintech aesthetics & analytics |
| **HTTP Client** | Axios | Interceptors with automated JWT bearer tokens |
| **Backend** | Python 3.11, FastAPI, Uvicorn | High-performance asynchronous REST API |
| **Database** | SQLite, SQLAlchemy ORM | Local zero-configuration relational database |
| **Security** | PBKDF2-HMAC-SHA256, Python-Jose | Secure salted authentication & JWT sessions |
| **Document Processing** | PyPDF, Pillow, PyTesseract | PDF extraction, image processing, OCR fallback |
| **Data Validation** | Pydantic v2 | Strict request/response serialization |

---

## 📁 Folder Structure

```
GovAssist AI/
├── backend/
│   ├── main.py                # FastAPI app & REST endpoint handlers
│   ├── database.py            # SQLite engine & session dependency
│   ├── models.py              # SQLAlchemy database models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── auth.py                # Salted password hashing & JWT auth
│   ├── eligibility_engine.py  # Explainable rule-based classification
│   ├── document_service.py    # PyPDF + Tesseract OCR & regex extractor
│   ├── chatbot.py             # Local NLP context-aware chatbot
│   ├── seed.py                # Seeds 16 realistic schemes & demo users
│   ├── test_api.py            # Automated API integration test suite
│   ├── requirements.txt       # Python dependencies
│   ├── govassist.db           # SQLite database file (created on init)
│   └── uploads/               # User document storage directory
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, Badges, Toast, StatCards
│   │   ├── context/           # AuthContext (state, tokens, session)
│   │   ├── pages/             # 15 Complete dashboard & admin pages
│   │   ├── services/          # Centralized Axios API client
│   │   ├── App.jsx            # Main app coordinator
│   │   ├── index.css          # Tailwind CSS styles
│   │   └── main.jsx           # React DOM entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Quick Start & Installation

### Step 1: Backend Setup & Database Initialization

```bash
# Navigate to the backend directory
cd backend

# Install Python requirements
python -m pip install -r requirements.txt

# Seed the database (creates tables, admin, citizen, & 16 schemes)
python seed.py

# Launch the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend will be running at:* **`http://127.0.0.1:8000`**  
*Interactive Swagger API Docs:* **`http://127.0.0.1:8000/docs`**

---

### Step 2: Frontend Setup & Dev Server

Open a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (already prepared)
npm install

# Start the Vite development server
npm run dev
```
*Frontend will be running at:* **`http://localhost:5173`**

---

## 🔑 Demo Credentials

| Role | Email | Password | Pre-Loaded Profile |
|---|---|---|---|
| **Demo Citizen** | `citizen@govassist.in` | `Citizen@123` | Ramesh Kumar Sharma (Farmer, ₹1.8L income, OBC, UP) |
| **Demo Admin** | `admin@govassist.in` | `Admin@123` | Chief Admin Officer (Full CRUD & Governance Analytics) |

> 💡 *Tip: On both the Landing Page and Login Page, you can click the **1-Click Demo Citizen** or **Demo Admin** buttons to sign in instantly.*

---

## ⚙️ Eligibility Engine Design

Input: `CitizenProfile` + `Uploaded Documents`  
For every scheme, the engine evaluates:
1. **Age limits**: `min_age <= citizen.age <= max_age`
2. **Gender**: Matches women-only or open schemes
3. **Income threshold**: Compares family income against scheme ceilings (e.g. ₹2.5L for scholarships)
4. **Social category**: GEN, OBC, SC, ST, EWS
5. **Geographic State**: Checks domicile restrictions
6. **Socio-Economic status**: Farmer flag, Student status, Disability %, MSME Business owner, BPL ration card holder.
7. **Document cross-referencing**: Checks whether mandatory documents are verified in the vault.

**Output Classification**:
- `Eligible` (Score ≥ 75%, 0 hard disqualifiers)
- `Maybe Eligible` (Score 50%–74%, or missing supporting documents)
- `Not Eligible` (Violates mandatory criteria like gender mismatch or income ceiling)

---

## 📄 Document Intelligence & OCR Setup

- **PDF Documents**: Extracted automatically using native PDF text stream (`pypdf`).
- **Image Documents**: Processed via `PIL` and `pytesseract`.
- **Graceful Fallback**: If Tesseract OCR binary is not installed on the host machine, the engine uses **heuristic document intelligence** and marks the document for manual confirmation with a clear warning, ensuring the application **never crashes or freezes**.

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/register` | Register new citizen | Public |
| `POST` | `/auth/login` | Login and obtain JWT token | Public |
| `GET` | `/users/me` | Fetch current session profile | Authenticated |
| `GET` | `/users/profile` | Get citizen socio-economic parameters | Authenticated |
| `PUT` | `/users/profile` | Update profile & recalculate schemes | Authenticated |
| `POST` | `/documents/upload` | Upload PDF/Image for OCR analysis | Authenticated |
| `GET` | `/documents` | List uploaded user documents | Authenticated |
| `GET` | `/documents/{id}/analysis` | Get structured OCR extraction fields | Authenticated |
| `POST` | `/documents/{id}/sync-to-profile` | One-click autofill profile from OCR | Authenticated |
| `DELETE` | `/documents/{id}` | Delete document | Authenticated |
| `GET` | `/schemes` | List/Filter all active schemes | Public |
| `GET` | `/schemes/{id}` | Get scheme details & criteria | Public |
| `POST` | `/schemes` | Publish new scheme | Admin Only |
| `PUT` | `/schemes/{id}` | Update existing scheme criteria | Admin Only |
| `DELETE` | `/schemes/{id}` | Delete scheme | Admin Only |
| `POST` | `/eligibility/check` | Execute AI eligibility engine | Authenticated |
| `GET` | `/eligibility/results` | Fetch cached evaluation breakdown | Authenticated |
| `POST` | `/chat` | Context-aware AI chatbot assistant | Authenticated |
| `GET` | `/history` | View application & search audit log | Authenticated |
| `GET` | `/dashboard/stats` | Citizen dashboard metrics | Authenticated |
| `GET` | `/admin/stats` | Admin overview & chart telemetry | Admin Only |
| `GET` | `/admin/users` | Admin citizen directory | Admin Only |

---

## 🔧 Troubleshooting & FAQs

- **Q: `npm run dev` fails with path errors?**  
  *A:* We configured `package.json` scripts to invoke `node node_modules/vite/bin/vite.js` directly. This avoids Windows CMD batch bugs when spaces or ampersands exist in directory paths.
- **Q: Can I run without an internet connection?**  
  *A:* Yes! The AI rule engine, NLP chatbot, and SQLite database run completely offline on localhost with zero external API calls.
- **Q: How do I test with new schemes?**  
  *A:* Log in as Admin (`admin@govassist.in` / `Admin@123`), navigate to **Scheme Management**, and click **Add New Scheme**.

---

## 🔮 Future Enhancements
- Integration with DigiLocker API & UMANG Gateway.
- Multilingual voice interface (supporting Hindi, Tamil, Bengali, Telugu, Marathi).
- Geo-fenced district officer grievance escalation.
