# SlotFeast - Campus Canteen OS

> **Tagline:** *Every meal, perfectly timed.*

SlotFeast is an intelligent campus canteen management operating system designed specifically to eliminate long queues, food preparation bottlenecks, stockouts, and physical congestion at single serving counters.

Unlike generic food delivery software, SlotFeast is tailored for university environments where hundreds of students across multiple engineering departments (e.g. AIML, CSE, ECE, Mechanical) rush out during rigid 30-minute lunch intervals to a single food counter.

---

## 🌟 The Five Core Features

### 1. AI-Powered Predictive Demand Intelligence
- **Department Timetable Awareness:** Ingests department-wise student populations (AIML: 180, CSE: 220, ECE: 190, MECH: 160) and staggered break windows (12:00 PM and 1:00 PM).
- **Statistical & ML Forecasting:** Computes expected meal units (e.g. 120 Thalis, 65 Samosas, 80 Chais) before students leave lectures.
- **Confidence Scoring & Manager Override:** Provides statistical confidence scores (88–94%) with real-time manager manual adjustment.

### 2. Intelligent Batch Preparation
- **Order Item Aggregation:** Instead of 50 separate fryer tickets, kitchen staff sees: `Samosa – 50 units required for 12:00 slot`.
- **Preparation Prioritization:** Automatically flags batches as `CRITICAL`, `HIGH`, or `NORMAL` based on pickup deadline and volume.
- **Batch State Controls:** Supports `Start Batch Cooking` and `Mark Batch Cooked & Ready` to instantly advance associated order tickets.

### 3. Adaptive Single-Counter Queue Management
- **The Golden Rule:** *Never promise an impossible pickup time.*
- **Feasibility Evaluator:** Calculates kitchen prep delay + physical counter serving velocity (default: 35s per order).
- **Break Window Accommodation:** Verifies whether promised collection fits inside the student's designated break hours.
- **Ready Alternatives:** Automatically presents zero-delay, in-stock alternatives if hot custom cooking would cause the student to be late for their next lecture.
- **Token Calling System:** Live virtual tokens (e.g. `SF-1021`) with audio chimes and in-app alerts when called to Counter 1.

### 4. Dynamic Menu & Stock Intelligence
- **Atomic Stock Reservation:** `Available Stock = Current Stock - Reserved Quantity`.
- **Anti-Oversell Protection:** Orders are rejected or adjusted before placement if stock is insufficient.
- **Automatic Deactivation:** Items automatically disable when available stock reaches zero.
- **Inventory Audit Trail:** Full logging of reservations, cancellations, fulfillments, and restock actions.

### 5. Department-Aware Demand Coordination
- **Staggered Break Mapping:** AIML & CSE (12:00–12:30 PM), ECE & MECH (1:00–1:30 PM).
- **Timetable Configuration:** Managers can update break times or student counts whenever academic schedules change.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15+ (App Router, Server Components & Client Hooks)
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS v4, Lucide Icons
- **AI Intelligence:** Google Gemini API (`@google/genai`) via `/app/api/gemini/assistant`
- **Database Architecture:** PostgreSQL / Supabase Schema (`/supabase/migrations/20261112000001_slotfeast_schema.sql`)
- **Unit Testing:** Node.js native test runner (`node:test`, `node:assert/strict`) via `npx --yes tsx --test`
- **State Management:** Reactive local store with atomic reservations, cross-component reactivity, and local storage persistence

---

## 📂 Project Directory Structure

```
├── app/
│   ├── api/gemini/assistant/route.ts  # Server-side Gemini AI assistant
│   ├── globals.css                    # Tailwind CSS v4 setup
│   ├── layout.tsx                     # App shell & metadata
│   └── page.tsx                       # Main coordinator (Landing, Student, Kitchen, Manager)
├── components/
│   ├── Navbar.tsx                     # Role switcher, notifications, rush simulation button
│   ├── LandingHero.tsx                # SaaS landing page with problem statement & features
│   ├── student/
│   │   └── StudentView.tsx            # Menu, cart, break selector, feasibility preview, tokens
│   ├── kitchen/
│   │   └── KitchenView.tsx            # Batch board, single-counter queue, delay reporting
│   └── manager/
│       └── ManagerView.tsx            # Demand analytics, schedules editor, stock control
├── lib/
│   ├── algorithms/
│   │   ├── algorithms.test.ts         # 100% passing pure logic unit tests
│   │   ├── batch-grouping.ts          # Kitchen batch aggregation algorithm
│   │   ├── demand-forecasting.ts      # Statistical timetable-driven forecasting
│   │   ├── inventory.ts               # Stock reservation & anti-oversell logic
│   │   └── queue-allocation.ts        # Adaptive queue feasibility calculation
│   ├── seed-data.ts                   # Realistic campus canteen seed data
│   ├── store.ts                       # Reactive persistent state store & dispatchers
│   └── types.ts                       # Complete TypeScript interfaces
├── supabase/
│   └── migrations/
│       └── 20261112000001_slotfeast_schema.sql  # 15 normalized PostgreSQL tables & RLS
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Unit Tests (Pure Logic Verification)
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Interactive Testing Guide

1. **Test Student Ordering & Feasibility:**
   - In the top bar, switch to **Student**.
   - Select your department (e.g. `AIML` with break `12:00` to `12:30`).
   - Add a `South Indian Thali Meal` and `Special Masala Chai` to your cart.
   - Click the bottom cart bar: Notice the **Adaptive Queue Feasibility Box** showing estimated prep delay, counter serving time, and promised pickup time.
   - Click **Confirm & Get Token**: Token `SF-1025` is issued, audio notification chimes, and ticket enters the kitchen queue.

2. **Test Kitchen Batch Preparation:**
   - Switch to **Kitchen Staff**.
   - View **Intelligent Batches**: Notice how items are grouped into bulk batches (e.g. `25 Samosas required`) with priority tags.
   - Click **Start Batch Cooking**, then **Mark Batch Cooked & Ready**.
   - Switch to **Counter Queue**: Click **Call Next Token** to summon the student.

3. **Test Campus Rush Simulator:**
   - Switch to **Canteen Manager**.
   - Click **+25 Orders** or **+100 (Full Lunch Rush)** in the simulator toolbar.
   - Watch the live predicted vs actual demand charts update, batches recalculate, and counter velocity metrics refresh in real time!

---

## 🔐 Demo Credentials
- Kitchen portal PIN: `1234` (or `KITCHEN2026`) — or use *One-Click Demo Unlock*
- Manager portal PIN: `8888` (or `ADMIN2026`) — or use *One-Click Demo Unlock*
- Optional: set `GEMINI_API_KEY` in `.env.local` for live Gemini answers; without it the AI Advisor uses a live-stock-aware deterministic fallback.

## 🛠️ Hardening Changes
- Demand forecast weights keyed by menu item id (names previously never matched the seed menu, so most items used a flat 0.2 fallback); new items fall back by popularity rank.
- Batch slot labels no longer render `12:60`; a cooked batch reopens when new orders join its slot.
- Starting a batch moves orders to `PREPARING`; an order turns `READY` only when *all* its batches are cooked.
- Tokens are always unique (previously could collide after rush simulation).
- Food images fall back gracefully when offline / URL fails.
- AI route validates input; fallback recommends items actually in stock.
- 10 unit tests (`npm test`), `npm run typecheck`, production build verified, browser E2E (order → kitchen → handover → manager rush) verified.
