# KaamSetu (कामसेतु) — Production-Grade SaaS Platform
### *Bridging Daily Wage Labor & Empowering Local Small Businesses Across India*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17.x-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4.1-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Build Status](https://img.shields.io/badge/Build-28%2F28%20Routes%20Passing-success)](file:///README.md)
[![Test Suite](https://img.shields.io/badge/Acceptance%20Tests-16%2F16%20Passed-success)](file:///scripts/test-acceptance.ts)
[![Full-Stack Verification](https://img.shields.io/badge/Full--Stack%20Tests-25%2F25%20Passed-success)](file:///scripts/test-full-stack.ts)

---

## 🌟 1. Executive Summary & Problem Statement

India's informal and local retail economy powers over 450 million livelihoods yet remains constrained by two deep-rooted operational bottlenecks:

1. **The Daily Worker Paradox:**
   - Over 400 million daily wage earners and skilled tradespeople (electricians, plumbers, masons, carpenters, welders, helpers) rely on physical labor nakas (*chowks*).
   - They lack verifiable digital identity, wage transparency, and direct employer discovery, leaving them vulnerable to wage theft, middleman commissions, and erratic income.
2. **The Small Merchant & Chaiwala Paradox:**
   - Over 60 million neighborhood shopkeepers (*Kirana* stores), tea stalls (*chaiwalas*), and hardware shops operate on high transaction volume with wet or busy hands.
   - Relying on paper ledgers (*bahi-khata*) causes thousands of rupees in lost customer credit (*Udhaar*), calculation errors, and surprise stockouts.

**KaamSetu** bridges these two worlds into a unified, high-performance web platform:
- **For Workers:** A digital skill passport, pan-India job discovery with locked wage guarantees, 1-click applications, and direct employer phone connectivity upon hire.
- **For Shopkeepers:** A zero-math digital Udhaar ledger with automated WhatsApp payment links, atomic inventory control with restock alerts, point-of-sale billing, and hands-free **Voice Quick Entry** in Hindi & English.
- **For Platform Administrators:** Real-time KPI telemetry, 1-click user suspension/activation, job moderation, platform-wide broadcast alerts, and CSV data exports.

---

## 🛠️ 2. Comprehensive Technology Stack

| Layer | Technologies & Libraries | Architectural Role |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.4 (Turbopack)**, React 19, TypeScript | Server Components, Client Subtrees, dynamic layout shells |
| **Design & UI System** | **Tailwind CSS v4 (`@import "tailwindcss"`)**, Lucide React, Geist & Noto Sans Devanagari | Semantic CSS variables, class-based dark mode (`.dark`), full-viewport edge-to-edge layout |
| **Relational Database** | **PostgreSQL 17** | ACID-compliant persistent transactional storage on port `5432` |
| **ORM & Data Layer** | **Prisma ORM v6** | Type-safe query building, relational schema modeling, Decimal precision (`@db.Decimal(10, 2)`) |
| **Security & Auth** | **JWT (jsonwebtoken)**, `bcryptjs` (salt rounds: 10), HTTP-only secure cookies | Server-side role-based access control (WORKER, BUSINESS_OWNER, ADMIN) |
| **Validation** | **Zod** | Server-side runtime schema validation across all API routes |
| **Voice Interface** | **Native Web Speech API** with heuristic NLP parser | Hands-free credit and sales entry in spoken Hindi and English |
| **Internationalization** | Custom TypeScript I18N Engine (`src/lib/i18n.ts`) | 100% Bilingual localization (English & हिन्दी) with instant theme/language persistence |
| **Containerization** | **Docker** & **Docker Compose** | Multi-stage production image with Node 22 Alpine & PostgreSQL 17 |

---

## 🏛️ 3. Full-Width SaaS Application Shell & Architecture

KaamSetu is engineered as a full-viewport SaaS application (`min-h-[100dvh]`, `100vw` without overflow):

```
┌────────────────────────────────────────────────────────────────────────┐
│ AppHeader: Role Context · Breadcrumb · Global Search · Theme · Lang · Bell · User │
├───────────────┬────────────────────────────────────────────────────────┤
│ AppSidebar    │ Dynamic Main Content Canvas (Edge-to-Edge)             │
│ (288px fixed) │                                                        │
│               │ - Role-Specific KPI Cards & Interactive Modules        │
│ • Overview    │ - Filtered Tables & Responsive Cards                   │
│ • Operations  │ - Real-Time Forms with Pan-India City Autocomplete     │
│ • Settings    │                                                        │
│ • Logout      │                                                        │
├───────────────┴────────────────────────────────────────────────────────┤
│ MobileBottomNav: 4-5 High-Priority Touch Targets (48px safe area)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Key UI/UX Innovations
- **No Artificial Clamping:** Avoids restrictive `max-w-4xl` containers on dashboard routes; content utilizes widescreen displays intelligently while preserving internal card boundaries.
- **Strict Viewport Containment:** Body and container rules enforce `max-w-full overflow-x-hidden`, preventing horizontal scrollbars on mobile devices (tested down to 320px).
- **Responsive Navigation Drawer:** Features an explicit `X` close button, backdrop tap-to-dismiss, and auto-close upon navigation.
- **Adaptive Header Toolbar:** Collapses search and secondary controls on viewports `< 1024px`, keeping breadcrumbs, theme toggle, language switcher, notification badge, and profile avatar perfectly aligned.
- **Deterministic Date Formatting:** Eliminated all SSR/Client locale hydration mismatch errors through a centralized deterministic date engine (`src/lib/date.ts`).

---

## 💻 4. Role-Specific User Experiences

### 👷 A. Worker Experience
- **Worker Dashboard (`/worker/dashboard`):** High-contrast welcome hero with daily availability status, 100% profile completeness progress meter, quick trade search, and recommended openings with locked daily wage guarantees.
- **Pan-India Job Marketplace (`/jobs`):** Filter by any city across India (Ahmedabad, Surat, Vadodara, Mumbai, Delhi, Bengaluru, etc.), trade tags, and minimum daily rate.
- **Job Details & 1-Click Apply (`/jobs/[id]`):** Locked wage notice, employer contact transparency, audio readout in Hindi (*"विवरण सुनें"*), and 1-click application submission.
- **My Applications Tracker (`/worker/applications`):** Real-time status cards (`PENDING`, `ACCEPTED`, `REJECTED`) with one-click **"📞 Call Boss"** button immediately upon acceptance.
- **Digital Skill Profile (`/worker/profile`):** Verified trades, years of experience, video portfolio link, and bio description.
- **Dedicated Account Settings (`/worker/settings`):** Edit full legal name, email, preferred language, pan-India home base (`CityInput`), daily availability toggle, and password change.
- **Worker Notifications (`/worker/notifications`):** User-scoped live notifications for job status updates, employer call-backs, and platform announcements.

### 🏪 B. Small Business & Merchant Experience
- **Business Dashboard (`/business/dashboard`):** 4 key financial metrics (Today's Sales, Inventory Alert Count, Total Customers, Active Job Openings), quick actions grid, weekly sales performance chart, low-stock warnings, and recent transaction feeds.
- **Point of Sale Billing (`/business/sales`):** High-speed counter billing with product search, barcode simulation, instant subtotal calculation, payment method selection (`CASH`, `UPI`, `UDHAAR`), and atomic stock reduction.
- **Smart Udhaar Ledger (`/business/udhaar`):** Customer bahi-khata tracking credit purchases and cash repayments. Guarantees zero calculation errors:
  $$\text{Outstanding Balance} = \sum \text{Credit} - \sum \text{Repayments}$$
  Prevents invalid repayments exceeding balance, provides 1-click WhatsApp reminder links with pre-filled bilingual messages.
- **Hands-Free Voice Assistant ("बोलकर लिखें"):** Small shopkeepers with busy or wet hands can speak commands:
  - *"Ramesh ko 500 rupay udhaar likho"* $\rightarrow$ Creates customer or records ₹500 credit.
  - *"Suresh ne 200 rupay jama kiye"* $\rightarrow$ Records ₹200 repayment.
- **Inventory Management (`/business/inventory`):** Catalog with SKU, unit price, stock count, reorder threshold, quick +/- quantity modifiers, and filterable low-stock alerts.
- **Customer Directory (`/business/customers`):** Customer directory with phone, address, and outstanding debt summaries.
- **Job Posting & Candidate Moderation (`/business/jobs` & `/business/jobs/[id]/applicants`):** Create job listings with locked wages, inspect applicant trade profiles, and 1-click **Accept** or **Reject** with automated notifications.
- **Store & Profile Settings (`/business/settings`):** Manage shop name, business category (with custom category support), counter phone, store UPI ID for QR payments, pan-India store location (`CityInput`), owner credentials, and app language.

### 🛡️ C. Platform Admin Operations Hub (`/admin/dashboard`)
- **System Overview:** Platform KPIs (Total Registered Users, Businesses, Active Jobs, Total Sales Volume, Total Udhaar Float), live job application stream, live store sales stream, and PostgreSQL health telemetry.
- **User Management Tab:** Search users by name/phone/city, role filtering, and 1-click **Account Suspend / Activate** (`PATCH /api/admin/users`).
- **Business Directory Tab:** Comprehensive shop roster with owner contact, inventory counts, and sales metrics.
- **Job Moderation Tab:** Real-time job review, wage lock verification, 1-click **Job Close / Re-open** (`PATCH /api/admin/jobs`), and **Permanent Job Deletion** (`DELETE /api/admin/jobs`).
- **Platform Moderation & Broadcast Tab:** Send system-wide broadcast notifications targeting:
  - *All Users*
  - *Workers Only*
  - *Merchants Only*
- **Data Export Center:** 1-click CSV download for Users, Businesses, Jobs, and Transaction logs.

---

## 🗄️ 5. PostgreSQL Database Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  WORKER
  BUSINESS_OWNER
  ADMIN
}

enum WageType {
  DAILY
  FIXED
}

enum JobStatus {
  OPEN
  CLOSED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum PaymentMethod {
  CASH
  UPI
  UDHAAR
}

enum TransactionType {
  CREDIT
  REPAYMENT
}

model User {
  id                String          @id @default(uuid())
  phone             String          @unique
  name              String
  email             String?         @unique
  passwordHash      String
  role              Role            @default(WORKER)
  preferredLanguage String          @default("hi")
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  workerProfile     WorkerProfile?
  businesses        Business[]
  notifications     Notification[]

  @@index([phone, role])
}

model WorkerProfile {
  id              String           @id @default(uuid())
  userId          String           @unique
  city            String           @default("Ahmedabad")
  locality        String           @default("Maninagar")
  skills          String[]
  experienceYears Int              @default(0)
  description     String?
  workVideoUrl    String?
  availability    Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobApplications JobApplication[]

  @@index([city, availability])
}

model Business {
  id          String      @id @default(uuid())
  ownerId     String
  name        String
  category    String      @default("RETAIL")
  phone       String
  city        String      @default("Ahmedabad")
  locality    String      @default("Maninagar")
  address     String
  upiId       String?
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  owner       User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  products    Product[]
  customers   Customer[]
  sales       Sale[]
  jobs        Job[]

  @@index([ownerId])
  @@index([city])
}

model Product {
  id          String     @id @default(uuid())
  businessId  String
  name        String
  unit        String     @default("item")
  price       Decimal    @db.Decimal(10, 2)
  stock       Int        @default(0)
  minStock    Int        @default(5)
  category    String     @default("General")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  business    Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  saleItems   SaleItem[]

  @@index([businessId, stock])
}

model Customer {
  id                 String              @id @default(uuid())
  businessId         String
  name               String
  phone              String
  address            String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  business           Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  creditTransactions CreditTransaction[]
  sales              Sale[]

  @@index([businessId])
}

model CreditTransaction {
  id          String          @id @default(uuid())
  customerId  String
  amount      Decimal         @db.Decimal(10, 2)
  type        TransactionType
  description String?
  createdAt   DateTime        @default(now())

  customer    Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId, type])
}

model Sale {
  id            String        @id @default(uuid())
  businessId    String
  customerId    String?
  totalAmount   Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod @default(CASH)
  createdAt     DateTime      @default(now())

  business      Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer      Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  items         SaleItem[]

  @@index([businessId, createdAt])
}

model SaleItem {
  id        String   @id @default(uuid())
  saleId    String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)

  sale      Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([saleId])
}

model Job {
  id             String           @id @default(uuid())
  businessId     String
  title          String
  description    String
  wageAmount     Decimal          @db.Decimal(10, 2)
  wageType       WageType         @default(DAILY)
  city           String
  locality       String
  requiredSkills String[]
  status         JobStatus        @default(OPEN)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  business       Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  applications   JobApplication[]

  @@index([city, status])
}

model JobApplication {
  id        String            @id @default(uuid())
  jobId     String
  workerId  String
  status    ApplicationStatus @default(PENDING)
  message   String?
  appliedAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  job       Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  worker    WorkerProfile     @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@unique([jobId, workerId])
  @@index([workerId, status])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String
  type      String   @default("INFO")
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
}
```

---

## 🌐 6. API Route Catalog (All 28 Application Routes)

### Authentication & Sessions
- `POST /api/auth/register` — Register Worker or Business Owner with phone unique validation.
- `POST /api/auth/login` — Phone/Password verification with secure HTTP-only cookie.
- `GET /api/auth/me` — Current authenticated user payload & role.
- `POST /api/auth/logout` — Invalidate session cookie.

### Worker Subsystem
- `GET /api/worker/applications` — Fetch user's job applications with business details.
- `GET /api/worker/profile` & `PUT /api/worker/profile` — Trade skills, video URL, bio.
- `GET /api/worker/settings` & `PUT /api/worker/settings` — Legal name, pan-India city, availability, password change.

### Jobs & Marketplace
- `GET /api/jobs` — Public search and filtering by city, trade, status with pagination.
- `GET /api/jobs/[id]` — Detailed job view with wage lock guarantee.
- `POST /api/jobs/[id]/apply` — Worker application submission with duplicate protection.

### Business & Retail Operations
- `GET /api/business/dashboard` — Aggregated KPI metrics, sales chart telemetry, and low-stock list.
- `GET /api/business/inventory` & `POST /api/business/inventory` — Product catalog management with SKU/price/stock.
- `PUT /api/business/inventory/[id]` & `DELETE /api/business/inventory/[id]` — Update/delete stock.
- `GET /api/business/sales` & `POST /api/business/sales` — POS counter bill checkout with atomic stock deductions.
- `GET /api/business/customers` & `POST /api/business/customers` — Customer ledger management.
- `GET /api/business/customers/[id]` — Single customer history and outstanding balance.
- `GET /api/business/udhaar` & `POST /api/business/udhaar` — Credit and repayment transaction recording.
- `GET /api/business/jobs` & `POST /api/business/jobs` — Job posting creation.
- `GET /api/business/jobs/[id]/applicants` & `PATCH /api/business/jobs/[id]/applicants` — Accept/reject candidates.
- `GET /api/business/settings` & `PUT /api/business/settings` — Shop profile, UPI ID, location, and owner preferences.

### Real-Time Notifications
- `GET /api/notifications` — Strictly user-scoped notifications with unread counts.
- `PATCH /api/notifications` — Mark individual or all notifications as read.
- `DELETE /api/notifications` — Delete notification or clear read alerts.

### Administration & Moderation
- `GET /api/admin/data` & `GET /api/admin/stats` — Real-time telemetry, user listings, and business audits.
- `PATCH /api/admin/users` — Suspend or activate user accounts.
- `PATCH /api/admin/jobs` & `DELETE /api/admin/jobs` — Moderate, close, or delete job postings.
- `POST /api/admin/broadcast` — Broadcast platform-wide alerts to All Users, Workers, or Merchants.

### Voice Engine
- `POST /api/voice-assistant` — NLP heuristic intent extraction for voice billing and Udhaar recording.

---

## ⚡ 7. Local Setup & Execution Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher (v22.x LTS recommended)
- **PostgreSQL:** v14 or higher (v17.x recommended)
- **Git**

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/sujalpatel0510/KaamSetu.git
cd KaamSetu
npm install
```

### Step 2: Configure Environment Variables
Create `.env` in the root directory:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/kaamsetu?schema=public"
JWT_SECRET="kaamsetu_super_secret_jwt_key_2026_vibex"
NODE_ENV="development"
PORT=3000
```

### Step 3: Initialize Database Schema
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push
```

### Step 4: Seed Database with Realistic Indian Market Data
```bash
npm run seed
```
This populates:
- 1 Admin account
- 3 Business Owners (Grocery/Kirana, Chaiwala, Hardware)
- 3 Daily Workers (Electrician, Plumber, Mason)
- Products, Udhaar ledgers, job postings, and sample applications.

### Step 5: Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚢 8. Production Deployment Guide

### Option A: Vercel + Neon / Supabase (Serverless — Recommended)
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set environment variables:
   - `DATABASE_URL`: Your hosted PostgreSQL connection string (`?sslmode=require`).
   - `JWT_SECRET`: 32+ character random secret string.
   - `NODE_ENV`: `production`
4. The build script automatically executes `prisma generate && next build`.
5. Run migrations: `npx prisma db push`.

### Option B: Docker & Docker Compose (Self-Hosted VPS / AWS EC2)
1. Clone repository to server:
   ```bash
   git clone https://github.com/sujalpatel0510/KaamSetu.git
   cd KaamSetu
   ```
2. Build and launch containers:
   ```bash
   docker compose up -d --build
   ```
3. Initialize database schema:
   ```bash
   docker compose exec app npx prisma db push
   docker compose exec app npx tsx prisma/seed.ts
   ```
4. Access KaamSetu on `http://your-server-ip:3000`.

---

## 🔑 9. Quick 1-Click Demo Logins

The login page (`/login`) includes instant **1-Click Quick Demo** profile buttons:

| Role | Name | Phone / Login | Password | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Worker** | Ramesh Kumar | `9812345678` | `password123` | Certified Electrician, Ahmedabad |
| **Worker** | Suresh Vaghela | `9812345679` | `password123` | Certified Plumber, Ahmedabad |
| **Business Owner** | Rajesh Patel | `9876543210` | `password123` | Patel General & Kirana Store |
| **Business Owner** | Vikram Singh | `9876543211` | `password123` | Apna Chai & Snacks (Chaiwala) |
| **Business Owner** | Kiran Sharma | `9876543212` | `password123` | Sharma Electricals & Hardware |
| **Admin** | System Admin | `9999999999` | `password123` | Platform Administration Hub |

---

## 🧪 10. Automated Verification & Acceptance Test Suites

### 1. Acceptance Criteria Verification (16/16 Passed)
```bash
npx tsx scripts/test-acceptance.ts
```
Verifies complete worker application workflows, employer hiring, POS stock deduction, and Udhaar ledger math.

### 2. Full-Stack Integrity Test Suite (25/25 Passed)
```bash
npx tsx scripts/test-full-stack.ts
```
Verifies server-side Decimal precision, rate limiting, deterministic date outputs, and relational cascading integrity.

### 3. Production Build Validation
```bash
npx next build
```
Compiles all 28 routes in production mode with zero TypeScript errors.

---

## 🔒 11. Security & Quality Commitments
- **Real Database Only:** All features run on live PostgreSQL 17 with ACID transactions. Zero mock data.
- **Bilingual Focus:** 100% English & हिन्दी localization across all pages and notifications with zero Gujarati.
- **Financial Precision:** Strict Decimal calculations (`@db.Decimal(10, 2)`) prevent floating-point rounding errors.
- **Protection Against Injections & Overflows:** Zod validation on all API endpoints, parameterized SQL queries via Prisma, and SameSite HTTP-only cookies.

---

*KaamSetu — Empowering India's Hardworking Hands with Modern Digital Dignity.*
