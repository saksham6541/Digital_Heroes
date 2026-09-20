"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfirmPaymentButton({
  plan,
  charityId,
  contributionPct,
}: {
  plan: "monthly" | "yearly";
  charityId: string | null;
  contributionPct: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmPayment() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/mock-payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, charityId, contributionPct }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Test payment could not be confirmed.");
      setLoading(false);
      return;
    }
    router.push("/dashboard?subscribed=1");
    router.refresh();
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={confirmPayment}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "Confirming…" : "Confirm Payment"}
      </button>
    </>
  );
}
