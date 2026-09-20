"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MockCheckoutClient({ plan }: { plan: "monthly" | "yearly" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planPrice = plan === "monthly" ? 499 : 4999;

  async function handlePay() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/subscribe/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Sandbox checkout failed.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Sandbox checkout</p>
        <h1 className="mb-2 text-3xl font-bold text-white">{plan === "monthly" ? "Monthly" : "Yearly"} plan</h1>
        <div className="mb-6 flex items-end gap-2">
          <span className="text-4xl font-bold">₹{planPrice}</span>
          <span className="pb-2 text-sm text-neutral-400">{plan === "monthly" ? "/ month" : "/ year"}</span>
        </div>

        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Sandbox mode, no real payment. This is a test-only subscription path.
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Processing…" : "Pay (test)"}
        </button>
      </div>
    </div>
  );
}
