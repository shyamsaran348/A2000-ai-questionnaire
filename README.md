# A2000 | AI Enablement — Questionnaires

Next.js 16 + TypeScript application for A2000 AI Enablement discovery questionnaires across industry verticals (Healthcare, Food & Beverage, Jewellery, Finance & FinTech, Manufacturing, and Restaurants).

Used by clients and consultants to assess business operations, current software systems, and departmental workflows to identify practical opportunities for AI adoption and process automation.

---

## Table of Contents
1. [Supported Industries & Live Routes](#1-supported-industries--live-routes)
2. [Key System Features](#2-key-system-features)
   - [Security Access Code & Gate](#security-access-code--gate)
   - [Real-Time Continuous Autosave](#real-time-continuous-autosave)
   - [Strict Form Validation Rules](#strict-form-validation-rules)
   - [Branded PDF & Excel Generation](#branded-pdf--excel-generation)
   - [Backend Storage & Submissions](#backend-storage--submissions)
3. [Architecture & Project Structure](#3-architecture--project-structure)
4. [Data Model & Schema Definition](#4-data-model--schema-definition)
5. [How to Add a New Industry (Agent & Developer Guide)](#5-how-to-add-a-new-industry-agent--developer-guide)
6. [API Route Reference](#6-api-route-reference)
7. [Local Development & Setup](#7-local-development--setup)
8. [Production Deployment (Vercel & AWS)](#8-production-deployment-vercel--aws)

---

## 1. Supported Industries & Live Routes

| Industry | Route | Case Code | Description | Key Focus Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Portal Home** | `/` | — | Central industry directory & draft tracker | All 6 industry selection cards, live draft detection |
| **Hospital & Healthcare** | `/hospital` | `A2000-HOSPITAL` | Healthcare & tertiary hospital discovery | HIS/EMR, Front desk, Clinical charts, Pharmacy, Diagnostics, Insurance |
| **Food & Beverage** | `/food-and-beverage` | `A2000-FB` | FMCG, Food processing & Spices discovery | Procurement, Recipe consistency, Batch QA, Distributor sales, Swiggy/Zomato |
| **Jewellery & Gems** | `/jewellery` | `A2000-JW` | Jewellery manufacturing & retail discovery | CAD design, Casting, Purity testing, Bullion, Showroom POS, Stock security |
| **Finance & FinTech** | `/finance` | `A2000-FN` | Banking, NBFC, Lending & Wealth discovery | Onboarding & KYC, Credit underwriting, AML, Payments reconciliation, Fraud |
| **Manufacturing** | `/food-and-beverage` | `A2000-MFG` | Discrete & Process Manufacturing | Production scheduling, Machine downtime, Quality checks, Inventory |
| **Restaurants & HoReCa** | `/food-and-beverage` | `A2000-REST` | Food Services & Cloud Kitchens | Central kitchen yield, Dine-in POS, Delivery app reconciliation, Wastage |

---

## 2. Key System Features

### Security Access Code & Gate
- All questionnaire pages and the home portal are wrapped in `<SecurityGate />` (`src/components/SecurityGate.tsx`).
- **Valid Access Codes**: `A2000` (also accepts `A2000AI`, `A2000-2026`, `ENABLE2026`).
- **Zero-Friction Link Sharing**: Consultants can share direct links with the code in the query string:
  ```
  https://<domain>/?code=A2000
  https://<domain>/finance?code=A2000
  https://<domain>/jewellery?code=A2000
  ```
  Visiting with `?code=A2000` automatically validates, stores in `localStorage` (`a2000_access_code`) and sets an `a2000_access=granted` cookie for 7 days.
- **Copy Link Feature**: The gate UI includes a "Copy Access Link" button that automatically appends `?code=A2000` to the current URL for instant sharing with clients.

### Real-Time Continuous Autosave
- **Client Persistence**: Every keystroke, radio toggle, or checkbox selection is debounced (600ms) and saved to `localStorage` under `a2000_draft_[industry]` (e.g. `a2000_draft_finance`).
- **Automatic Hydration**: Reloading the page or revisiting later seamlessly restores all completed answers.
- **Status Indicator**: The top floating navigation bar shows a real-time status:
  - `Saving...` with an animated spinner during active typing.
  - `✓ Saved at [Time]` once written to storage.
- **Home Page Draft Tracker**: The Home portal detects active local drafts and marks cards with a yellow `Draft in Progress` badge and a `Resume Form` button.
- **Clear Form**: Clicking "Clear" prompts for confirmation, then purges both component state and the `localStorage` draft.

### Strict Form Validation Rules
- **Required Fields**: Fields marked `required: true` must be filled before PDF download. On failure, the page smoothly scrolls to the first invalid field.
- **Dedicated Email & Phone Validation**:
  - Email fields validate against standard regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
  - Phone fields strip non-digits and require at least **10 digits**.
- **Mandatory "Other" Specification**:
  - Whenever a user selects the "Other" option in a radio or checkbox list, a dedicated typed text input (`customOther`) appears.
  - Submitting without entering details for "Other" flags an error: `"Please specify details for 'Other'."`
- **Radio Deselection**: Clicking an already-selected radio button deselects it (toggle behavior), preventing accidental locks.

### Branded PDF & Excel Generation
- **Executive PDF (`src/lib/services/pdf.ts`)**:
  - Generated client-side using `jspdf` and `jspdf-autotable`.
  - Corporate A2000 Navy header (`#17324D`), Ochre accent line (`#C97835`), and top-right **CONFIDENTIAL** badge.
  - Dynamic table rows grouped by Section and Department.
  - Formats custom "Other" answers as `Other: [Details]`.
  - Automatically names output file: `[ClientName]_[CaseCode].pdf`.
- **Structured Excel (`src/lib/services/excel.ts`)**:
  - Multi-tab `.xlsx` workbook generated via `exceljs`.
  - Includes `Summary`, `Responses`, department breakdown, and audit timestamps.

### Backend Storage & Submissions
- When a user clicks **Download PDF**, the page triggers a silent background `POST /api/questionnaire/submit`.
- Submissions are persistently recorded in:
  1. Local JSON files under `tmp/submissions/[caseCode]_[timestamp].json`.
  2. Memory store (`src/lib/services/store.ts`).
  3. PostgreSQL (Neon Serverless) when `DATABASE_URL` is configured.

---

## 3. Architecture & Project Structure

```
Questionarre/
├── .dockerignore                       # Docker build exclusions
├── Dockerfile                          # Multi-stage production container build (Node 20 Alpine)
├── AWS_DEPLOYMENT.md                   # Step-by-step AWS hosting instructions (Amplify, App Runner, EC2)
├── README.md                           # Master system documentation (this file)
├── AGENTS.md                           # AI agent and Next.js version-specific guidelines
├── package.json                        # Dependencies (Next 16.4.3, React 19, jsPDF, ExcelJS, Drizzle)
├── tsconfig.json                       # TypeScript configuration
├── public/                             # Static assets
│   └── a2000-logo.png                  # Official A2000 corporate logo
└── src/
    ├── components/
    │   └── SecurityGate.tsx            # Access gate with code verification & URL auto-unlock
    ├── lib/
    │   ├── data/                       # Questionnaire seed data definitions
    │   │   ├── hospital-seed.ts        # Hospital & Healthcare sections (12 sections)
    │   │   ├── food-beverage-seed.ts   # Food & Beverage / FMCG sections (12 sections)
    │   │   ├── jewellery-seed.ts       # Jewellery & Gems sections (12 sections)
    │   │   └── finance-seed.ts         # Finance & FinTech sections (12 sections)
    │   ├── db/                         # Database layer
    │   │   ├── schema.ts               # Drizzle PostgreSQL schema (organizations, cases, answers)
    │   │   ├── neon.ts                 # Neon serverless client & bootstrap helper
    │   │   └── index.ts                # Drizzle ORM instance
    │   └── services/                   # Business logic services
    │       ├── pdf.ts                  # Formatted A2000 Confidential PDF generator
    │       ├── excel.ts                # Multi-worksheet Excel (.xlsx) generator
    │       └── store.ts                # In-memory store fallback for answers
    └── app/
        ├── layout.tsx                  # Root layout with Tailwind CSS CDN & typography
        ├── globals.css                 # Global stylesheet
        ├── page.tsx                    # Discovery Portal Home (Industry directory)
        ├── hospital/
        │   └── page.tsx                # Hospital questionnaire page
        ├── food-and-beverage/
        │   └── page.tsx                # Food & Beverage questionnaire page
        ├── jewellery/
        │   └── page.tsx                # Jewellery industry questionnaire page
        ├── finance/
        │   └── page.tsx                # Finance & FinTech questionnaire page
        └── api/
            ├── questionnaire/
            │   ├── submit/route.ts     # Save submission to disk/db & query responses
            │   └── autosave/route.ts   # Live server autosave receiver
            ├── cases/
            │   ├── route.ts            # Neon/Memory answer upsert & fetch
            │   └── handoff/route.ts    # Section status workflow handoffs
            └── export/
                └── excel/route.ts      # Stream Excel workbook download
```

---

## 4. Data Model & Schema Definition

Each questionnaire is represented as an array of `SectionDefinition` objects, defined in `src/lib/data/hospital-seed.ts`:

```typescript
export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDefinition {
  key: string;                                                         // Unique key (e.g. fn_q1_company_name)
  label: string;                                                       // Question label
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "rating_grid" | "number";
  placeholder?: string;
  options?: QuestionOption[] | string[];                               // For radio and checkbox
  gridColumns?: string[];                                              // Rating grid scale (e.g. 1 to 5)
  gridRows?: string[];                                                 // Rating grid categories
  helpText?: string;
  required?: boolean;                                                  // Required validation
}

export interface SectionDefinition {
  number: number;
  key: string;
  title: string;
  defaultDepartment: string;
  description: string;
  questions: QuestionDefinition[];
}
```

### Answer Storage Structure
The form state (`answers`) maps each question key to an answer object:
```typescript
{
  "fn_q1_company_name": {
    "value": "Apex Financial Services",
    "department": "Executive / Management"
  },
  "fn_q1_org_type": {
    "value": ["Fintech / financial technology platform", "Other"],
    "customOther": "AI Lending API Aggregator",
    "department": "Executive / Management"
  },
  "fn_q12_priority_rating": {
    "value": {
      "Operational efficiency": 5,
      "Risk / fraud / compliance": 4,
      "Customer experience": 5
    },
    "department": "Executive / Sign-off"
  }
}
```

---

## 5. How to Add a New Industry (Agent & Developer Guide)

Follow this 3-step guide whenever you need to add a new industry vertical (e.g., `real-estate`, `automotive`, `logistics`):

### Step 1: Create the Seed Data File
Create `src/lib/data/<industry>-seed.ts`:
```typescript
import { SectionDefinition } from "./hospital-seed";

export const REAL_ESTATE_QUESTIONNAIRE_SECTIONS: SectionDefinition[] = [
  {
    number: 1,
    key: "re_profile",
    title: "1. Company Profile",
    defaultDepartment: "Management",
    description: "Foundational details on scale and operations.",
    questions: [
      {
        key: "re_q1_company_name",
        label: "Company Name",
        type: "text",
        required: true,
      },
      {
        key: "re_q1_email",
        label: "Official Email Address",
        type: "text",
        required: true,
      },
      {
        key: "re_q1_phone",
        label: "Phone / Mobile Number",
        type: "text",
        required: true,
      },
      {
        key: "re_q1_business_type",
        label: "Type of Real Estate Business",
        type: "checkbox",
        options: ["Residential Developer", "Commercial Leasing", "PropTech", "Brokerage", "Other"],
      },
    ],
  },
  // ... Add sections 2 through 12
];
```
*Rules for Seed Files*:
- Prefix all question keys with industry abbreviation (e.g., `re_q1_...`).
- Keep Email and Phone as **separate** fields and mark `required: true`.
- Always end checkbox/radio lists with `"Other"` (never use "Not sure").

### Step 2: Create the Industry Page
Create `src/app/<industry>/page.tsx`. Use `src/app/finance/page.tsx` as your baseline:
1. Replace `FINANCE_QUESTIONNAIRE_SECTIONS` with your new seed constant.
2. Update the case code (e.g., `caseCode: "A2000-RE"`).
3. Update `localStorage` key (e.g., `a2000_draft_real_estate`).
4. Pick an appropriate Lucide icon (e.g., `Building`, `Home`).
5. Ensure the component is wrapped in `<SecurityGate title="..." subtitle="..." />`.

### Step 3: Register Card on Home Page
Open `src/app/page.tsx` and add your industry to the `industries` array:
```typescript
{
  title: "Real Estate & Infrastructure",
  category: "Developers & PropTech",
  description: "Assessment for residential/commercial developers, property management and brokerage networks.",
  icon: <Building className="w-6 h-6 text-[#17324D]" />,
  href: "/real-estate",
  caseCode: "A2000-RE",
  storageKey: "a2000_draft_real_estate",
  highlights: [
    "12 Sections • Lead CRM & Site Visit Tracking",
    "Legal Due Diligence & Document Extraction",
    "Tenant Billing & Construction Procurement",
  ],
}
```

Run `npm run build` to verify clean compilation!

---

## 6. API Route Reference

### `POST /api/questionnaire/submit`
Saves a complete questionnaire submission.
- **Request Body**:
  ```json
  {
    "industry": "Finance & FinTech",
    "caseCode": "A2000-FN",
    "clientName": "Apex Capital Ltd",
    "email": "contact@apex.com",
    "phone": "+91 98765 43210",
    "answers": { ... }
  }
  ```
- **Response**: `{ "success": true, "caseCode": "A2000-FN", "submittedAt": "2026-11-04T..." }`

### `GET /api/questionnaire/submit?caseCode=...`
Retrieves all JSON submissions stored on disk and in memory.

### `POST /api/questionnaire/autosave`
Silent background endpoint that receives draft state periodically.

### `GET /api/export/excel?caseCode=...`
Streams a formatted `.xlsx` workbook containing the case summary and all submitted responses.

---

## 7. Local Development & Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm 9+

### Commands
```bash
# Clone the repository
git clone <repo-url>
cd Questionarre

# Install dependencies
npm install

# Run development server (Turbopack)
npm run dev

# Run production build (TypeScript check + static page generation)
npm run build

# Start production server
npm start
```
Open [http://localhost:3000/?code=A2000](http://localhost:3000/?code=A2000) to view the portal.

---

## 8. Production Deployment (Vercel & AWS)

### Deploying to Vercel
1. Push to GitHub/GitLab.
2. Import project in Vercel.
3. (Optional) Set `DATABASE_URL` in Project Settings if using Neon PostgreSQL.
4. Deploy!

### Deploying to AWS
Refer to [`AWS_DEPLOYMENT.md`](./AWS_DEPLOYMENT.md) for full walkthroughs:
- **AWS Amplify**: Connect git repository; auto-builds Next.js SSR with SSL.
- **AWS App Runner / ECS**: Build using the included [`Dockerfile`](./Dockerfile):
  ```bash
  docker build -t a2000-questionnaire:latest .
  docker run -p 3000:3000 a2000-questionnaire:latest
  ```
- **AWS EC2**: Run on Amazon Linux 2023 with PM2 + Nginx reverse proxy.

---

## License & Confidentiality
All materials, questionnaire designs, and discovery frameworks are **Confidential & Proprietary** to **A2000 AI Enablement Service**.
