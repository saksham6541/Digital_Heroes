# Digital Heroes — Level 1 Selection Assignment

A subscription-driven platform combining golf performance tracking, a monthly
draw-based prize engine, and charity fundraising. Built against the PRD
(`Digital_Heroes_PRD__Level_1_.pdf`) within the 2-day window.

**Stack:** Next.js 15 (App Router, TypeScript) · Supabase (Postgres, Auth,
Storage) · Stripe (subscriptions, test mode) · Tailwind CSS

---

## 1. What's implemented

| Area | Status |
|---|---|
| Auth (signup/login, session middleware) | ✅ |
| Subscription (Stripe Checkout, monthly/yearly, webhook sync) | ✅ |
| Score management (1–45 range, 1/date, rolling window of 5, reverse-chron) | ✅ |
| Charity directory with search/filter & independent donations | ✅ |
| Charity selection at signup + adjustable % (min 10%) | ✅ |
| User dashboard (all 5 required modules, §10) | ✅ |
| Winner proof direct screenshot upload UI (Supabase Storage) | ✅ |
| Draw engine — random **and** algorithmic (weighted) modes | ✅ |
| Prize pool auto-calc (40/35/25 split) + jackpot rollover | ✅ |
| Admin: users (inline role & subscription edits), draws, charities, winners | ✅ |
| Admin Reports & Analytics with interactive Recharts | ✅ |
| Automated monthly cadence (Vercel Cron) | ✅ |
| Motion & micro-interactions (Framer Motion) | ✅ |
| RLS policies on every table | ✅ |

---

## 2. Setup

### 2.1 Supabase
1. Create a **new** Supabase project.
2. SQL Editor → paste and run `supabase/schema.sql` in full. This creates all
   tables, RLS policies, the `handle_new_user` trigger, and 3 seed charities.
3. Storage → create a public bucket named `winner-proofs` (used for the
   winner-verification screenshot upload).
4. Project Settings → API → copy the URL, `anon` key, and `service_role` key.

### 2.2 Stripe
1. Use a **test-mode** Stripe account.
2. Create two recurring Prices (e.g. "Digital Heroes Monthly" / "Yearly").
3. Developers → Webhooks → add an endpoint at `<your-domain>/api/stripe/webhook`
   listening for: `checkout.session.completed`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`. Copy the signing secret.

### 2.3 Environment variables
Copy `.env.example` to `.env.local` and fill in the Supabase + Stripe values.

### 2.4 Run locally
```bash
npm install
npm run dev
```

### 2.5 Deploy
- Push to a GitHub repo, import into a **new** Vercel account, add the same
  env vars there, redeploy.
- To make yourself an admin: sign up normally, then in the Supabase table
  editor set that row's `profiles.role` to `admin`.

## 3. Assumptions & interpretation notes

The PRD is intentionally ambiguous in places (§17: "ambiguity is part of the
test"). Documented decisions:

- **Draw numbers**: derived from each subscriber's last 5 Stableford scores
  (`numbersFromScores` in `src/lib/draw-engine.ts`), connecting performance tracking directly to prize entry.
- **Algorithmic mode**: frequency-weighted random draw across all entrants' numbers with +1 Laplace smoothing.
- **Prize pool contribution**: `PER_SUBSCRIBER_CONTRIBUTION` in `draw-engine.ts` (₹50 per subscriber).
- **Jackpot rollover**: unclaimed 5-match pool rolls forward into the next published draw's 5-match tier.
- **Currency**: INR (₹), aligned with the platform design.
- **Winner proof upload**: direct file upload modal submitting screenshots to the Supabase `winner-proofs` bucket.
- **Independent donations**: direct donation flow writing to `donations` table, not tied to gameplay.
- **Monthly Cadence**: wired through `vercel.json` and `/api/draws/cron` for scheduled automated draws.

## 4. Project structure

```
src/
  app/
    (auth)/login, signup
    dashboard/                — user dashboard
    admin/                    — admin: users, draws, charities, winners
    charities/                — public directory + detail pages
    api/
      scores/                 — score CRUD (rolling window enforced here)
      draws/run/               — simulate/publish draw engine
      winners/[id]/verify      — admin approve/reject/mark-paid
      winners/[id]/proof       — winner proof submission
      stripe/checkout, webhook
  lib/
    supabase/client.ts, server.ts   — browser/server/admin Supabase clients
    draw-engine.ts                  — pure functions: pool math, draw, matching
    stripe.ts
  components/
    dashboard/ — SubscriptionPanel, CharityPanel, ScorePanel, ParticipationPanel, WinningsPanel
    admin/     — DrawRunner, CharityEditor, WinnerReview
supabase/schema.sql — full schema + RLS + seed data
```
