# ASSUMPTIONS & DESIGN DECISIONS

This document logs all technical and architectural assumptions made during the implementation of the **DSW Geeta University Digital Portal**, as instructed by the Master Build Prompt.

---

## 1. Database & Storage Architecture
- **Local Development DB**: Uses SQLite with `sqlite+aiosqlite://` for zero-setup local dev while preserving standard SQLAlchemy 2.0 async models compatible with PostgreSQL (`postgresql+asyncpg://`).
- **File Upload Storage**: Implemented local file upload router with static file hosting (`/uploads/...`) for local testing, while maintaining an abstracted upload service ready for Vercel Blob / AWS S3 integration.
- **Google Sheets API**: Implemented a mock/fallback Google Sheets sync engine that writes to `dynamic_form_responses` and gracefully simulates or executes Google Sheets API appends using base64 credentials when configured.

## 2. Authentication & Authorization
- **Initial DSW Super Admin**: Seeded with default credentials:
  - **Email**: `admin@geeta.edu.in`
  - **Password**: `Admin@123`
- **Faculty Initial Accounts**: Seeded default faculty accounts:
  - **Email**: `faculty@geeta.edu.in` / `Password`: `Faculty@123`
- **Student Initial Accounts**: Seeded default student accounts:
  - **Email**: `student@geeta.edu.in` / `Password`: `Student@123` (Roll Number: `GU2026001`)
- **Student Auth Flow**: Allows roll number + email sign in / claim account. Public registration and feedback forms do NOT require any login.

## 3. Leaderboard & Ledger Scoring Rules
- **Faculty Performance Ledger**:
  - Task approved on time: **+10 points**
  - Task approved late: **+5 points**
  - Task declined by admin: **-3 points**
- **Student Points Ledger**:
  - Dynamic points per leaderboard task upon admin approval.
  - Manual award/deduction capability (+/- points with mandatory reason note).
  - All totals computed strictly as `SUM(points)` from ledger tables.

## 4. UI / Branding Aesthetics
- **Color Scheme**: Deep Navy (`#0f172a`), Royal Indigo (`#3b82f6`), Crimson Accent (`#e11d48`), Emerald (`#10b981`), Amber (`#f59e0b`).
- **Design Features**: Dark mode support, glassmorphism, responsive sidebar layout per role (`/admin`, `/faculty`, `/student`), rich interactive widgets, live toast notifications, and leaderboard gamification (badges, podium highlight).
