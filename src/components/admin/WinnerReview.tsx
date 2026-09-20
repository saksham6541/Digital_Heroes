"use client";

import { useState } from "react";

export interface WinnerRecord {
  id: string;
  draw_id: string;
  user_id: string;
  match_tier: number;
  amount: number;
  review_status: string;
  proof_url?: string | null;
  admin_note?: string | null;
  payment_status: string;
  paid_at?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
  draws?: { period: string } | null;
}

export default function WinnerReview({ winners: initial }: { winners: WinnerRecord[] }) {
  const [winners, setWinners] = useState<WinnerRecord[]>(initial);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, decision?: "approve" | "reject", markPaid?: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/winners/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, markPaid }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "The action could not be completed.");
      }

      setWinners((current) =>
        current.map((w) =>
          w.id === id
            ? {
                ...w,
                review_status: decision === "approve" ? "approved" : decision === "reject" ? "rejected" : w.review_status,
                payment_status: markPaid ? "paid" : w.payment_status,
              }
            : w
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action could not be completed.");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-900 overflow-hidden">
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-neutral-900/60 text-neutral-400 text-left">
          <tr>
            <th className="px-4 py-3">Winner</th>
            <th className="px-4 py-3">Draw</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Proof</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((w) => (
            <tr key={w.id} className="border-t border-neutral-900 align-top">
              <td className="px-4 py-3">{w.profiles?.full_name ?? "—"}</td>
              <td className="px-4 py-3">{w.draws?.period ?? "—"}</td>
              <td className="px-4 py-3">{w.match_tier}-match</td>
              <td className="px-4 py-3">₹{Number(w.amount).toLocaleString("en-IN")}</td>
              <td className="px-4 py-3 capitalize">
                {w.review_status.replace("_", " ")} / {w.payment_status}
              </td>
              <td className="px-4 py-3">
                {w.proof_url ? (
                  <div className="space-y-1">
                    <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                      View full size
                    </a>
                    <img src={w.proof_url} alt="Winner proof" className="max-w-[120px] rounded border border-neutral-700" />
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                {w.review_status === "submitted" && (
                  <>
                    <button onClick={() => act(w.id, "approve")} className="text-emerald-400 hover:underline text-xs">
                      Approve
                    </button>
                    <button onClick={() => act(w.id, "reject")} className="text-red-400 hover:underline text-xs">
                      Reject
                    </button>
                  </>
                )}
                {w.review_status === "approved" && w.payment_status === "pending" && (
                  <button onClick={() => act(w.id, undefined, true)} className="text-neutral-300 hover:underline text-xs">
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
