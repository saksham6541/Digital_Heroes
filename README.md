# Digital Heroes

A subscription platform that combines golf score tracking, a monthly prize draw and charity giving. Subscribers enter their latest Stableford scores, take part in monthly draws, and direct part of their subscription to a charity they choose. Admins run the draws, verify winners and manage users and charities.

Built for the Digital Heroes selection assignment (PRD Level 1, 2026 edition).

| | |
|---|---|
| **Live site** | `https://digital-heroes-git-main-saksham-kaushik.vercel.app` |
| **Repository** | `https://github.com/saksham6541/Digital_Heroes` |

## Evaluation credentials

These accounts are for evaluation only.

| Role | Email | Password |
|---|---|---|
| Subscriber | `<SUBSCRIBER_EMAIL>` | `<SUBSCRIBER_PASSWORD>` |
| Administrator | `<ADMIN_EMAIL>` | `<ADMIN_PASSWORD>` |

Payments are a sandbox (see [Payments](#payments)), so no card is needed. A new account can subscribe from the dashboard in two clicks.

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Environment variables](#environment-variables)
5. [Database setup](#database-setup)
6. [Payments](#payments)
7. [Architecture and security](#architecture-and-security)
8. [Decisions on ambiguous requirements](#decisions-on-ambiguous-requirements)
9. [PRD coverage](#prd-coverage)
10. [Testing](#testing)
11. [Known limitations](#known-limitations)
12. [Scalability](#scalability)
13. [Project structure](#project-structure)
14. [Deployment](#deployment)

---

## Features

**Visitors**
- Homepage that explains what the platform does, how the draw works, and the charity impact, with a prominent subscribe call to action
- Charity directory with search and filter, charity profile pages with description, image and upcoming events, and a featured charity spotlight
- Independent donation to a charity, no account needed

**Subscribers**
- Sign up and log in, choose a charity and a contribution percentage (minimum 10%)
- Monthly and yearly plans (yearly is discounted), with renewal date, cancel and resume
- Enter, edit and delete golf scores (Stableford 1 to 45, one per date, latest five kept, newest first)
- Dashboard with subscription status, scores, charity and contribution, draws entered, next draw, and winnings with payment status
- Winners upload a screenshot as proof, and can resubmit if a submission is rejected

**Administrators**
- Reports: total users, active subscribers, total prize pool, paid and pending payouts, charity contribution totals, draw statistics and jackpot rollover
- Users: search, edit profiles, edit a user's scores, manage subscriptions
- Draws: choose random or algorithmic mode, simulate before publishing, publish (a period can only be published once), see the jackpot rollover
- Charities: add, edit and delete, with image and events, and a featured flag
- Winners: full list, view proof, approve or reject, mark payout as paid

## Tech stack

- **Next.js 16** (App Router, Turbopack), React, TypeScript
- **Tailwind CSS** for styling, with reduced-motion aware animations
- **Supabase**: Postgres, Auth and Storage, with row level security and database triggers
- **Vercel** for hosting

## Getting started

Requirements: Node.js 20 or newer, npm, and a Supabase project.

```bash
git clone <GITHUB_REPO_URL>
cd <repo-folder>
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

Open `http://localhost:3000` (use `localhost`, not your network address, or Next.js will block the dev scripts).

Useful scripts:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # type check
npm run build         # production build (stop the dev server first)
```

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (safe for the browser, protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key. **Server only**, never prefix with `NEXT_PUBLIC` |
| `MOCK_PAYMENTS` | `true` enables the sandbox payment routes. Leave unset in a real production deployment |
| `NEXT_PUBLIC_MOCK_PAYMENTS` | Optional, listed in `.env.example` |
| `NEXT_PUBLIC_SITE_URL` | The site's public URL |
| `CRON_SECRET` | Secret that protects the scheduled draw endpoint (use the exact name in `.env.example`) |

## Database setup

Use a fresh Supabase project. In the Supabase SQL editor, run these in order:

1. `supabase/schema.sql`, which creates the tables, enums, the `is_admin()` helper, row level security policies and the signup trigger that creates a profile row.
2. The migration SQL in `supabase/` (billing columns, charity events and image columns, the guard triggers, the score constraint and trim trigger, the charity minimum constraint, and the storage bucket settings and policy). Run every file in the folder, in the order listed in its header comments.
3. Create the storage bucket `winner-proofs` (public read) if it does not exist.

Then, in Authentication, set the Site URL and redirect URLs to your site, and decide whether "Confirm email" is on. It is off in the demo deployment so reviewers can sign up and continue immediately.

To create an admin, sign up normally, then run:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '<ADMIN_EMAIL>');
```

## Payments

The PRD (§04) asks for "Stripe (or equivalent PCI-compliant provider)". Two real gateways were tried and could not be used within the assignment window:

- **Stripe** is invite-only for new accounts in India, so an Indian account cannot be created without an invitation.
- **Razorpay**, the natural Indian alternative, asked for PAN and business verification at signup, so test keys could not be obtained in time.

Rather than leave the subscription flow broken, or build a fake card form that would misrepresent what happens, the project uses a **clearly labelled sandbox payment flow**. No card details are collected anywhere.

**What is real**
- The full subscription lifecycle from PRD §04: monthly and yearly plans, renewal date, cancellation (access continues until the paid period ends), resume, and a lapsed state.
- A **real-time status check**: `src/lib/subscription.ts` derives the state (`inactive`, `active`, `cancelling`, `lapsed`) from `current_period_end`, so a stored "active" flag never grants access after the period ends. Score entry, draw eligibility and the dashboard all use the same helper.
- **Server-side billing writes only.** The billing fields can only be changed by server routes using the service-role key. A database trigger blocks any browser client from changing them, and this was verified by attempting the change from the browser console.
- Every gated feature behaves the same whichever provider activated the subscription.

**What is simulated**
- No money moves. The page at `/checkout/confirm` states that no real payment is processed, shows the plan and price, and has a "Confirm Payment" button.
- The routes `POST /api/mock-payment/checkout`, `/confirm`, `/cancel` and `/resume` prepare and update the subscription directly, standing in for a gateway and its webhook.
- Donations record a fake `pi_test_...` payment reference.

**Switching it on**

```
MOCK_PAYMENTS=true
```

With `MOCK_PAYMENTS` unset the mock routes return 404 and no subscription can be started, which is the safe default for a real deployment. In sandbox mode any logged-in user can activate a free subscription, which is intentional for the demo.

**Swapping in a real gateway** means replacing `src/app/api/mock-payment/` and `src/lib/mock-payment.ts` with that provider's checkout and webhook routes and client. The data model, the subscription helper, the database guards and all gated features stay unchanged, because they only read `current_period_end` and the status fields. An earlier Stripe implementation was removed from the working tree and is recoverable from git history (commit `7ea76d9`). It was never exercised against a live Stripe account.

## Architecture and security

**Rules live in the database, not only in the UI.** The browser holds a public key, so anyone can call Supabase directly. Every important rule is therefore enforced in Postgres:

- **Row level security** is enabled on every table. Users read and write only their own rows, admins can read everything, and public data (charities, published draws) is readable by all.
- **`guard_profile_write` trigger**: a user cannot change their own role, subscription status, plan, period end or billing fields.
- **`guard_winner_update` trigger**: a winner can only submit proof (`awaiting_proof` or `rejected` to `submitted`) and the proof URL must sit inside their own storage folder. They cannot change amount or payment status.
- **Scores**: a check constraint keeps values between 1 and 45, a unique rule keeps one score per date, and a trigger keeps only the latest five.
- **Charity contribution**: a check constraint enforces the 10% minimum.
- **Storage**: the `winner-proofs` bucket accepts only JPEG, PNG and WEBP up to 5 MB, and users can only upload into a folder named after their own user id.

**Server routes** authenticate the session on every request. Admin routes verify the caller's role with the service-role client (`src/lib/admin-auth.ts`) and return 401 for no session and 403 for non-admins. Score validation is one shared function used by both the user and admin routes.

**Draw engine** (`src/lib/draw-engine.ts`) is a set of pure functions with no database or network access, so the maths can be tested in isolation. Pool shares are rounded to two decimals, the 25% tier takes the remainder so the tiers always add up exactly to the total, and per-winner prizes are rounded down to the cent so a split never pays out more than the pool.

**Prize pool logic (PRD §07)**

| Match | Pool share | Rollover |
|---|---|---|
| 5 numbers | 40% | Yes, jackpot carries forward if unclaimed |
| 4 numbers | 35% | No |
| 3 numbers | 25% | No |

Each active subscriber contributes a fixed amount to the pool (`PER_SUBSCRIBER_CONTRIBUTION` in `src/app/api/draws/run/route.ts`). Prizes are split equally among winners in the same tier.

## Decisions on ambiguous requirements

The PRD says ambiguity is part of the test. These were the calls made:

| Question | Decision |
|---|---|
| A new score "replaces the oldest". Does that mean oldest by date or by entry? | The database keeps the **five most recent by date**. A score older than all five is not kept, and the user is told so. |
| Payments: real gateway or not? | A labelled sandbox, because Stripe is invite-only and Razorpay needed KYC. See [Payments](#payments). |
| Can a rejected winner try again? | Yes. A rejected submission can be resubmitted, otherwise the user would be stuck. |
| Who counts as a subscriber for the draw? | Active subscription with a `current_period_end` in the future, and five scores on file. |
| Algorithmic draw | Numbers are drawn with weights based on how often each score value appears among active subscribers' current scores. |
| Cancellation | Cancelling keeps access until the paid period ends, then the state becomes lapsed. |
| Charity choice at signup | Offered on the signup form with a 10% minimum contribution. Users who skip it are prompted on the dashboard. |
| Email confirmation | Off in the demo deployment so evaluators can sign up immediately. It should be on in production. |

## PRD coverage

| PRD section | Where it lives |
|---|---|
| §03 Roles | `is_admin()`, RLS policies, `src/middleware.ts`, `src/lib/admin-auth.ts` |
| §04 Subscription and payment | `src/lib/subscription.ts`, `src/lib/plans.ts`, `src/app/api/mock-payment/`, `SubscriptionPanel` |
| §05 Score management | `src/app/api/scores/`, `src/lib/score-validation.ts`, `ScorePanel`, DB constraint and trigger |
| §06 and §07 Draws and prize pool | `src/lib/draw-engine.ts`, `src/app/api/draws/run`, `DrawRunner` |
| §08 Charity system | `/charities`, `/charities/[slug]`, `DonateModal`, `CharityPanel`, homepage spotlight |
| §09 Winner verification | `ProofUploadModal`, `WinningsPanel`, `src/app/api/winners/`, `WinnerReview` |
| §10 User dashboard | `src/app/dashboard/page.tsx` and the panels in `src/components/dashboard/` |
| §11 Admin dashboard | `src/app/admin/`, `src/components/admin/`, `src/app/api/admin/` |
| §12 UI and UX | Impact-first homepage, `MotionWrapper` (respects reduced motion), responsive layouts, custom 404 and error pages |
| §13 to §15 Technical and deployment | Next.js, Supabase, Vercel, `.env.example`, this README |

## Testing

Checked during development:

- **Access control**: logged-out and non-admin requests to `/admin` redirect, and admin API routes return 401 or 403 correctly.
- **Direct database attacks** using the public key: a user could not change their own role, subscription or winner payout, and could not read other users' rows. The guards above were added after the first round of testing found these were open.
- **Scores**: rolling window, duplicate dates, range limits, and the backdated-score message.
- **Proof upload**: MIME type and size limits enforced by the storage bucket, cross-folder uploads blocked, and the proof route rejects external URLs, `javascript:` URLs, other users' winners and repeat submissions.
- **Draw maths** with synthetic data: pool shares always sum exactly to the total, per-winner rounding, and jackpot rollover.
- **Donations**: invalid, negative, zero, infinite and oversized amounts are rejected.
- **Subscription lifecycle**: subscribe, cancel (access continues), resume, and the lapsed state after the period end.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.

Not tested: a live payment gateway (none is connected), and load or concurrency behaviour.

## Known limitations

- Payments are sandboxed, and the sandbox gives a free subscription to any logged-in user.
- The `winner-proofs` bucket is public, so anyone with a file URL can view it. Paths contain unguessable ids, but a private bucket with signed URLs for admin review is the proper design.
- `POST /api/donations` has no rate limiting, and donations are recorded without a real payment.
- Uploaded file type is checked by its declared MIME type, not by inspecting the file contents.
- Draws are triggered by an admin, with an optional scheduled endpoint protected by a secret.
- The middleware file uses a convention that Next.js 16 marks as deprecated (it still works).
- The homepage's "recorded independent donations" total may not
  perfectly reflect every row in the donations table in all cases —
  a minor discrepancy was observed during testing and not fully
  root-caused before submission.

## Scalability

- Business rules are enforced in the database, so a second client (mobile app, another service) gets the same guarantees.
- The draw engine is pure functions, easy to test, to run in a background job, or to move behind a queue as the user base grows.
- Prize shares, plan prices and per-subscriber contribution are constants in one place each.
- The payment layer sits behind a small boundary (`src/lib/mock-payment.ts` and `src/app/api/mock-payment/`), so a real gateway replaces only that layer.
- Next steps if this grew: rate limiting, a private proof bucket with signed URLs, a scheduled job with retries for the monthly draw, pagination for the admin tables, and real payments with webhooks.

## Project structure

```
src/
  app/
    (auth)/login, signup          Authentication pages
    admin/                        Admin dashboard: overview, users, draws, charities, winners
    api/
      admin/                      Admin-only routes (users, scores, charities)
      draws/                      run (simulate and publish) and cron
      mock-payment/               Sandbox subscription: checkout, confirm, cancel, resume
      scores/                     Score create, update, delete
      winners/                    Proof upload and verification
      donations/                  Independent donations
    charities/, charities/[slug]  Public directory and profiles
    checkout/confirm              Sandbox payment confirmation page
    dashboard/                    Subscriber dashboard
  components/                     admin/, dashboard/, charities/, checkout/, ui/
  lib/
    draw-engine.ts                Pure draw and prize maths
    subscription.ts               Derived subscription state
    plans.ts                      Plan prices
    admin-auth.ts                 Admin authorization helper
    score-validation.ts           Shared score rules
    supabase/                     Browser and server clients
supabase/                         Schema and migration SQL
```

## Deployment

The project is deployed on Vercel from the `main` branch.

1. Import the repository into a new Vercel project (framework: Next.js).
2. Add the environment variables from the table above, including `MOCK_PAYMENTS=true` for the sandbox.
3. Set the Supabase Site URL and redirect URLs to the Vercel URL.
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy (`NEXT_PUBLIC_*` values are fixed at build time).

Do not use `MOCK_PAYMENTS=true` in a production deployment that takes real customers.