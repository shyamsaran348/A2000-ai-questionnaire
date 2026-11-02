# A2000 Multi-Department Discovery Questionnaire Platform

A Next.js 16 + TypeScript web application for conducting structured AI Enablement Discovery assessments across hospital departments (Front Office, Clinical, Pharmacy, Billing, HR, Diagnostics, Management/IT).

## Key Features

1. **Multi-Department Collaboration**:
   - Each section is assigned to a department owner with custom contact info.
   - Built-in sequential or parallel handoff workflows.
   - Read-only protection on previously completed sections prevents accidental overwrites while maintaining cross-department visibility.

2. **Server-Side Autosave & Resilience**:
   - Debounced optimistic autosave on input changes and blur events.
   - Visual status indicator (`Draft Autosaved`, `Saving...`, `Offline - retry`).

3. **Dynamic Real-Time Excel (.xlsx) Export**:
   - Generates multi-sheet Excel files on the fly via `exceljs`:
     - **Summary**: Hospital profile, status, % complete, department contact list.
     - **Responses**: Normalized master table of all questions, answers, and responder info.
     - **Section Tabs**: Clean, readable question/answer worksheets per section.
     - **Audit Trail**: Every handoff, return, and edit timestamped in Indian Standard Time (IST).

4. **Formatted Client PDF Export**:
   - Formatted client deliverable using `jspdf` and `jspdf-autotable`.
   - Incorporates A2000 branding (`#17324D` Navy header, `#C97835` Ochre accent, rupee formatting as `Rs.`).

5. **DPDP Act & Privacy Notice**:
   - Persistent banner warning users not to submit patient-identifiable data (PII/PHI).
   - Immutable audit logging on all revisions and state changes.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 24)
- PostgreSQL database (Neon Serverless recommended for Vercel)

### 2. Local Setup

```bash
# Clone and enter directory
cd Questionarre

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Migrations (Drizzle ORM)

When ready to connect to your live Neon Postgres instance:
```bash
# Generate SQL migrations
npx drizzle-kit generate

# Apply migrations to Neon database
npx drizzle-kit migrate
```

---

## Vercel Deployment

1. Push this repository to GitHub or GitLab.
2. Import the project into **Vercel**.
3. Under **Integrations / Storage**, add **Neon Postgres** (or provide `DATABASE_URL` under Environment Variables).
4. Add `RESEND_API_KEY` for email notifications.
5. Deploy!
