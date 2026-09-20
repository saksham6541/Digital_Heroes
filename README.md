-- ============================================================================
-- Digital Heroes — Database Guards Migration
-- ============================================================================

## Payment Provider

Payments are simulated in this assignment. Razorpay requires PAN/KYC verification even for initial signup, which is not feasible within the assignment timeline, and Stripe is unavailable for Indian merchants in this setup. The app therefore uses an explicit Digital Heroes Sandbox Mode confirmation page and does not collect card details or claim that a real payment was processed.

The mock provider is intentionally provider-swappable. Checkout, confirmation, and webhook-style state transition logic are isolated behind the payment routes and `src/lib/mock-payment.ts`; a real Stripe or Razorpay integration would replace those provider routes without changing the subscription data model. The existing `subscription_status` lifecycle (`active`, `inactive`, `lapsed`, and `cancelled`) remains the source of truth for access and UI state.
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Adds: charity contribution floor, winner proof transition guard,
-- admin-only billing/payout field guard.

---

-- 1. Charity contribution floor (minimum 10%)

---

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_charity_contribution_pct_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_charity_contribution_pct_check
CHECK (charity_contribution_pct >= 10.00 AND charity_contribution_pct <= 100.00);

---

-- 2. Winner proof transition guard
-- Only allows: awaiting_proof/rejected -> submitted -> approved/rejected
-- This also enables "resubmit after rejection".

---

CREATE OR REPLACE FUNCTION public.winners_proof_resubmission_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
IF (
OLD.review_status IN ('awaiting_proof', 'rejected')
AND NEW.review_status = 'submitted'
AND NEW.proof_url IS NOT NULL
) THEN
RETURN NEW;
END IF;

IF (
OLD.review_status = 'submitted'
AND NEW.review_status IN ('approved', 'rejected')
) THEN
RETURN NEW;
END IF;

RAISE EXCEPTION 'Invalid winner proof transition';
END;

$$
;

DROP TRIGGER IF EXISTS winners_proof_transition_guard ON public.winners;

CREATE TRIGGER winners_proof_transition_guard
BEFORE UPDATE ON public.winners
FOR EACH ROW
WHEN (
  OLD.review_status IS DISTINCT FROM NEW.review_status
  OR OLD.proof_url IS DISTINCT FROM NEW.proof_url
)
EXECUTE FUNCTION public.winners_proof_resubmission_guard();

-- ----------------------------------------------------------------------------
-- 3. Admin-only guard for billing / payout fields
--    Only enforced when auth.uid() is present (i.e. an authenticated app
--    request). The Stripe webhook writes via the service-role client with
--    no auth.uid(), so it is correctly unaffected by this guard.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_guard_billing_and_payout_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$

BEGIN
IF auth.uid() IS NOT NULL THEN
IF (
TG_TABLE_NAME = 'profiles'
AND (
NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
OR NEW.subscription_renews_at IS DISTINCT FROM OLD.subscription_renews_at
OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
)
) OR (
TG_TABLE_NAME = 'winners'
AND (
NEW.payment_status IS DISTINCT FROM OLD.payment_status
OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
OR NEW.amount IS DISTINCT FROM OLD.amount
)
) THEN
IF NOT public.is_admin() THEN
RAISE EXCEPTION 'Only admins may update billing and payout fields';
END IF;
END IF;
END IF;

RETURN NEW;
END;

$$
;

DROP TRIGGER IF EXISTS profiles_admin_billing_guard ON public.profiles;
CREATE TRIGGER profiles_admin_billing_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.admin_guard_billing_and_payout_fields();

DROP TRIGGER IF EXISTS winners_admin_payout_guard ON public.winners;
CREATE TRIGGER winners_admin_payout_guard
BEFORE UPDATE ON public.winners
FOR EACH ROW
EXECUTE FUNCTION public.admin_guard_billing_and_payout_fields();
$$
