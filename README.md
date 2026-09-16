# Vice Chancellor Office (VC Office) Portal — Geeta University

Enterprise-grade digital governance, faculty task coordination, club charters, official event compliance reporting, and student leadership ecosystem for the **Office of the Vice Chancellor**, Geeta University.

---

## 🌟 Key Features

1. **Role-Based Workstations & Portals**:
   - **VC Office Administration (Super Admin)**: Executive control over tasks, event directives, official duty charts, core committee appointment orders, staff/student leaderboards, and financial forms.
   - **Faculty Workstation**: Duty chart acceptance, task execution with submission proof, student committee mentoring, club leadership supervision, and official 7-page event compliance reports.
   - **Student Portal**: Student core committees, club memberships, gamified task leaderboards, and direct grievance/query resolution.

2. **Official Compliance & Event Report Generation**:
   - Automated generation and printing of official university documents:
     - 7-Page Standardized Geeta University Event Report (with budget breakdown, photos, press releases, learning outcomes, and 3-tier signatures)
     - Official Faculty Duty Charts with institutional formatting
     - Official Student Core Committee Appointment Letters
     - Club Charters with KRAs and executive rosters

3. **Dynamic Forms & Live Syncing**:
   - Custom dynamic form builder supporting custom field schemas, UPI QR code payments with automated reference generation, and live Google Sheets API sync.

4. **Integrated Webmail & AI Communication**:
   - Built-in OAuth 2.0 Gmail integration with encrypted token storage.
   - Google Gemini Generative AI for drafting emails, improving announcements, and formal university communication assistance.

5. **Gamification & Performance Leaderboards**:
   - Automated points calculation and tiered leaderboards for students and faculty coordinators.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL database (Supabase ready)

### 1. Backend Setup (`dsw-backend`)
```bash
cd dsw-backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Verify DATABASE_URL and secret keys
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (`dsw-front`)
```bash
cd dsw-front
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy Async (asyncpg), PostgreSQL (Supabase pooler), Pydantic v2, PyJWT, Google Gemini AI, Jinja2, ReportLab.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti.
- **Database**: PostgreSQL with safe migrations, indexing, and transactional pooling.

---

## 📜 License
Internal Governance Software — Geeta University.
