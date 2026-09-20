import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmPaymentButton from "./ConfirmPaymentButton";
import { PLANS, type PlanId } from "@/lib/plans";

export default async function ConfirmPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; charityId?: string; contributionPct?: string }>;
}) {
  const params = await searchParams;
  const plan = params.plan as PlanId;
  if (plan !== "monthly" && plan !== "yearly") redirect("/dashboard");

  const planDetails = PLANS[plan];
  const contributionPct = Number(params.contributionPct ?? 10);
  const safeContributionPct = Number.isFinite(contributionPct) && contributionPct >= 10 && contributionPct <= 100
    ? contributionPct
    : 10;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-neutral-900/80 p-6 shadow-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-300">Test Payment</p>
        <h1 className="mb-3 text-2xl font-bold text-white">Digital Heroes Sandbox Mode</h1>
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          No real payment is processed.
        </p>

        <dl className="mb-6 space-y-3 text-sm text-neutral-300">
          <div className="flex justify-between gap-4">
            <dt>Plan</dt>
            <dd className="font-semibold text-white">{planDetails.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Price</dt>
            <dd className="font-semibold text-white">₹{planDetails.priceInr}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Charity contribution</dt>
            <dd className="font-semibold text-white">{safeContributionPct}%</dd>
          </div>
        </dl>

        <ConfirmPaymentButton
          plan={plan}
          charityId={params.charityId ?? null}
          contributionPct={safeContributionPct}
        />
        <Link href="/dashboard" className="mt-4 block text-center text-sm text-neutral-400 hover:text-white">
          Cancel and return to dashboard
        </Link>
      </section>
    </main>
  );
}
