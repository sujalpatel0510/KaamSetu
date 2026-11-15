# KaamSetu (कामसेतु / કામસેતુ)
### *Connecting Opportunities. Empowering Local Businesses.*

> **Hackathon:** VibeX Codes  
> **Track:** Track 1 – Helping Daily Workers, Small Shopkeepers (Chaiwalas) & Office Workers  
> **Evaluation Rubric:** 115-Point Scorecard (Real-World Usefulness, Robust Tech, Extreme Simplicity, Speed & Safety, PPT & Video Demo)  
> **Status:** Production-Ready MVP  

---

## 🌟 Executive Summary

In India's informal economy, two paradoxes coexist:
1. **The Daily Worker Problem:** Skilled tradesmen (electricians, masons, plumbers, welders, helpers) stand on street corners every morning with no digital footprint, printed resumes, or verified skill credentials.
2. **The Busy Chaiwala & Kirana Problem:** Small shopkeepers and street vendors work 14-hour days with wet, busy hands. When 20 customers shout orders, typing in English on a smartphone is impossible. They lose thousands of rupees to forgotten customer credit (*Udhaar*) and stockouts.

**KaamSetu** is a unified full-stack web platform built for high real-world utility:
- **For Daily Workers:** A simple digital skill identity, localized job marketplace, wage transparency, and 1-click applications in Hindi, Gujarati, or English.
- **For Small Shopkeepers:** Digital Udhaar Book (bahi-khata), atomic inventory stock control with low-stock alerts, point-of-sale billing, and **Voice Quick Entry ("बोलकर लिखें" / "બોલીને લખો")** for hands-free ledger recording in 10 seconds.

---

## 🎯 VibeX Codes 115-Point Rubric Alignment

| Criteria | Points | How KaamSetu Delivers |
|---|---|---|
| **1. Real-World Problem & Usefulness** | **25 Pts** | Addresses direct pain points of daily earners and street vendors with zero reliance on costly external AI subscriptions. |
| **2. How Well the Technology Works** | **25 Pts** | Full-stack Next.js App Router with real PostgreSQL 17 database, Prisma ORM, atomic ACID transactions, and strict Decimal precision. No hardcoded mockups. |
| **3. Super Easy to Use (Simplicity)** | **20 Pts** | Usable in 10 seconds! Trilingual UI (English, ગુજરાતી, हिन्दी), oversized touch targets, and voice assistant quick commands. |
| **4. Speed, Safety & Real-Life Readiness** | **15 Pts** | Sub-second rendering, SQL injection protection, server-side authorization, atomic stock decrementing, and over-repayment guards. |
| **5. Clear Presentation Deck** | **15 Pts** | Complete 10-slide deck outline included in `PRESENTATION.md`. |
| **BONUS: Live Working Video Demo** | **+15 Pts** | Step-by-step 2–3 minute video demo script included below. |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **Database** | PostgreSQL 17 (Mandatory persistent relational storage) |
| **ORM** | Prisma ORM v6 with Decimal monetary mappings |
| **Authentication** | Secure HTTP-Only JWT Session Cookies, bcryptjs password hashing |
| **Validation** | Zod server-side schema verification |
| **Voice Interface** | Native Web Speech API with fallback NLP command parser |
| **Languages** | English, Hindi (हिन्दी), Gujarati (ગુજરાતી) |

---

## 🚀 Key Features

### 👷 Module A: Daily Worker & Employment Management
- **Digital Skill Cards:** Verified trade tags, experience in years, location, and availability toggle.
- **Job Marketplace:** Search and filter by city (Ahmedabad, Vadodara, Surat), trade (Electrician, Plumber, Mason, etc.), and wage type.
- **1-Click Application Flow:** Workers submit applications with optional notes and view live status changes (`PENDING`, `ACCEPTED`, `REJECTED`).
- **Employer Review Hub:** Business owners can review worker profiles and click "Accept" or "Reject", immediately triggering in-app alerts and revealing direct phone call shortcuts.

### 🏪 Module B: Small Business & Udhaar Management
- **Digital Udhaar Book:** Individual transaction ledger tracking `CREDIT` and `REPAYMENT`.  
  $$\text{Outstanding Balance} = \text{Total Credit} - \text{Total Repayments}$$
  Guarantees zero mathematical discrepancies. Prevents repayments that exceed the outstanding balance.
- **Voice Quick Entry ("बोलकर लिखें" / "બોલીને લખો"):** Speak commands like *"Ramesh Bhai ko 500 rupay udhaar likho"* or *"રમેશને 200 રૂપિયા જમા કરો"*. The system automatically parses the customer and amount and updates the PostgreSQL ledger!
- **Inventory & Low-Stock Alerts:** Track unit quantities, set minimum stock thresholds, and view proactive restock warnings.
- **POS Counter Billing:** Select products, auto-calculate subtotals, and atomically deduct stock. Credit sales automatically link to the customer's Udhaar book.

---

## 🔐 Security & Data Integrity

1. **Atomic Database Transactions:** Sales creation, inventory deductions, and credit updates execute inside `prisma.$transaction`.
2. **Server-Side Validation:** All totals and stock checks are calculated on the server; client payloads are never trusted blindly.
3. **Role-Based Access Control (RBAC):** Workers cannot access business administration or inventory routes; business owners cannot access unauthorized business data.
4. **Credential Safety:** Passwords are encrypted with `bcryptjs` (salt rounds: 10). `.env` is strictly untracked.

---

## 📦 Local Setup Instructions

### Prerequisites
- **Node.js:** v18.0.0 or higher (v22.x recommended)
- **PostgreSQL:** v14 or higher (v17.x recommended)
- **Git**

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/sujalpatel0510/KaamSetu.git
cd KaamSetu
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL connection URL is configured:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/kaamsetu?schema=public"
JWT_SECRET="kaamsetu_super_secret_jwt_key_2026_vibex"
NODE_ENV="development"
```

### 3. Initialize PostgreSQL Database
If the database `kaamsetu` does not exist:
```bash
# Using PostgreSQL CLI
psql -U postgres -c "CREATE DATABASE kaamsetu;"
```

Push schema to PostgreSQL:
```bash
npx prisma db push
```

### 4. Seed Demonstration Data
Populate realistic workers, shops, products, and Udhaar ledgers:
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Credentials (1-Click Login Enabled)

For instant evaluation, the login page (`/login`) includes **1-Click Demo Login** buttons:

| Role | Name | Phone / Login | Password | Description |
|---|---|---|---|---|
| **Worker** | Ramesh Kumar | `9812345678` | `password123` | Certified Electrician, Ahmedabad |
| **Worker** | Suresh Vaghela | `9812345679` | `password123` | Plumber, Ahmedabad |
| **Business Owner** | Rajesh Patel | `9876543210` | `password123` | Patel General & Kirana Store |
| **Business Owner** | Vikram Singh | `9876543211` | `password123` | Apna Chai & Snacks (Chaiwala) |
| **Business Owner** | Kiran Sharma | `9876543212` | `password123` | Sharma Electricals & Hardware |
| **Admin** | System Admin | `9999999999` | `password123` | Platform Administration |

---

## 🧪 Acceptance Test Suite (Scenario Verification)

Run the automated integration test suite validating all 4 PRD acceptance scenarios:
```bash
npx tsx scripts/test-acceptance.ts
```

Output:
```
🧪 Running KaamSetu Acceptance & Verification Suite...
--- Testing Scenario 1: Worker Finds Employment ---
  ✅ [PASS] Worker Ramesh Kumar exists in database
  ✅ [PASS] Worker has Electrician skill
  ✅ [PASS] Worker can query open jobs in Ahmedabad (found 2)
  ✅ [PASS] Worker application exists for job "Commercial Electrician for Shop Fitting"
--- Testing Scenario 2: Employer Hires a Worker ---
  ✅ [PASS] Employer Kiran Sharma exists
  ✅ [PASS] Employer has registered business "Sharma Electricals & Hardware"
  ✅ [PASS] Employer received job application
  ✅ [PASS] Employer successfully accepted worker application
  ✅ [PASS] Worker received instant in-app notification of acceptance
--- Testing Scenario 3: Shopkeeper Manages Inventory & Sales ---
  ✅ [PASS] Kirana store exists
  ✅ [PASS] Product created with 20 units stock
  ✅ [PASS] Inventory atomically deducted (20 - 3 = 17)
  ✅ [PASS] Sale total verified server-side: ₹144
--- Testing Scenario 4: Shopkeeper Manages Udhaar ---
  ✅ [PASS] Customer Ramesh exists
  ✅ [PASS] Initial Outstanding matches PRD formula: ₹500 credit - ₹200 repayment = ₹300
  ✅ [PASS] System correctly detects repayment exceeding outstanding balance

🎉 All 16/16 Acceptance Criteria Scenarios Passed Successfully!
```

---

## 📹 2–3 Minute Video Demo Guide (Bonus +15 Points)

1. **Introduction (0:00 - 0:30):** State problem (unorganized labor + busy chaiwalas/shopkeepers losing credit). Show Trilingual switch (`EN`, `हिंदी`, `ગુજરાતી`).
2. **Worker Flow (0:30 - 1:00):** Log in as Ramesh (Electrician), show skill card, browse jobs in Ahmedabad, filter, and apply.
3. **Employer Flow (1:00 - 1:30):** Switch to Sharma Electricals, open applicant review, accept Ramesh, show instant notification.
4. **Chaiwala / Kirana Udhaar & Voice (1:30 - 2:30):** Log in as Rajesh Patel (Kirana) or Vikram (Chaiwala). Click the **Voice Button ("बोलकर लिखें")** and speak: *"Ramesh ko 500 rupay udhaar likho"*. Show the PostgreSQL ledger updating instantly to ₹500 credit, record ₹200 repayment, and verify outstanding balance is ₹300.
5. **Conclusion (2:30 - 3:00):** Show atomic POS billing, low-stock warnings, and admin dashboard.

---

## 👥 Authors & Team
- **Sujal Patel** (`sujalpatel0510@gmail.com`)
- Built with ❤️ for **VibeX Codes Hackathon (Track 1)**
