"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS } from "@/lib/plans";
import { getSubscriptionState } from "@/lib/subscription";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  inactive: "bg-neutral-700/40 text-neutral-300",
  lapsed: "bg-amber-500/15 text-amber-400",
  cancelling: "bg-amber-500/15 text-amber-300",
};

export interface SubscriptionProfile {
  id?: string;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  plan?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  subscription_renews_at?: string | null;
  charity_id?: string | null;
  charity_contribution_pct?: number | null;
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function SubscriptionPanel({ profile }: { profile: SubscriptionProfile | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"monthly" | "yearly" | "cancel" | "resume" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = getSubscriptionState(profile);
  const currentPlan = (profile?.subscription_plan ?? profile?.plan ?? "monthly").toLowerCase();
  const renewDate = profile?.current_period_end ?? profile?.subscription_renews_at ?? null;

  async function subscribe(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);

    const res = await fetch("/api/mock-payment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, charityId: profile?.charity_id, contributionPct: profile?.charity_contribution_pct }),
    });

    const data = await res.json().catch(() => null);
    setLoading(null);

    if (!res.ok) {
      setError(data?.error || "Checkout could not be started.");
      return;
    }

    if (data?.url) window.location.href = data.url;
  }

  async function cancelSubscription() {
    setLoading("cancel");
    setError(null);
    const res = await fetch("/api/mock-payment/cancel", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(null);

    if (!res.ok) {
      setError(data?.error || "Unable to cancel subscription.");
      return;
    }

    router.refresh();
  }

  async function resumeSubscription() {
    setLoading("resume");
    setError(null);
    const res = await fetch("/api/mock-payment/resume", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(null);

    if (!res.ok) {
      setError(data?.error || "Unable to resume subscription.");
      return;
    }

    router.refresh();
  }

  const yearlySavings = PLANS.monthly.priceInr * 12 - PLANS.yearly.priceInr;

  function renderPlanButtons() {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => subscribe("monthly")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold py-2 text-sm disabled:opacity-60"
        >
          {loading === "monthly" ? "Processing…" : "Monthly"}
        </button>
        <button
          onClick={() => subscribe("yearly")}
          disabled={loading !== null}
          className="flex-1 rounded-lg border border-neutral-700 hover:border-emerald-500 font-semibold py-2 text-sm disabled:opacity-60"
        >
          {loading === "yearly" ? "Processing…" : "Yearly"}
        </button>
      </div>
    );
  }

  return (
    <div id="subscription-panel" className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Subscription</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {status === "active" && (
        <div className="text-sm text-neutral-400 space-y-2">
          <p>
            Plan: <span className="text-white capitalize">{currentPlan}</span>
          </p>
          {renewDate && <p>Renews on {formatDate(renewDate)}</p>}
          <button
            onClick={cancelSubscription}
            disabled={loading !== null}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-200 hover:border-amber-400 hover:text-amber-300 disabled:opacity-60"
          >
            {loading === "cancel" ? "Cancelling…" : "Cancel subscription"}
          </button>
        </div>
      )}

      {status === "cancelling" && (
        <div className="space-y-2 text-sm text-neutral-300">
          <p>Ends on {formatDate(renewDate)}</p>
          <p className="text-neutral-400">Access continues until then.</p>
          <button
            onClick={resumeSubscription}
            disabled={loading !== null}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading === "resume" ? "Resuming…" : "Resume"}
          </button>
        </div>
      )}

      {status === "lapsed" && (
        <div className="space-y-2 text-sm text-neutral-300">
          <p>Your subscription ended on {formatDate(renewDate)}</p>
          {renderPlanButtons()}
        </div>
      )}

      {status === "inactive" && (
        <div className="space-y-4">
          {renderPlanButtons()}
          <p className="text-xs text-neutral-400">Yearly saves ₹{yearlySavings} compared with paying monthly.</p>
        </div>
      )}
    </div>
  );
}
