"use client";

import { useState } from "react";
import ProofUploadModal from "./ProofUploadModal";

export interface WinnerItem {
  id: string;
  amount: number;
  match_tier: number;
  review_status: string;
  payment_status: string;
  proof_url?: string | null;
  draws?: { period: string } | null;
}

function getStatusLabel(winner: WinnerItem) {
  if (winner.review_status === "awaiting_proof") return "Awaiting proof";
  if (winner.review_status === "submitted") return "Under review";
  if (winner.review_status === "approved" && winner.payment_status === "pending") return "Approved (payment pending)";
  if (winner.review_status === "approved") return "Approved";
  if (winner.review_status === "rejected") return "Rejected";
  if (winner.payment_status === "paid") return "Paid";
  return winner.review_status.replace("_", " ");
}

export default function WinningsPanel({ winners: initialWinners }: { winners: WinnerItem[] }) {
  const [winners, setWinners] = useState<WinnerItem[]>(initialWinners);
  const totalWon = winners.reduce((sum, w) => {
    const paymentApproved = w.review_status === "approved" || w.payment_status === "paid";
    return paymentApproved ? sum + Number(w.amount || 0) : sum;
  }, 0);

  function handleProofUploaded(winnerId: string, url: string) {
    setWinners((prev) =>
      prev.map((w) =>
        w.id === winnerId
          ? { ...w, review_status: "submitted", proof_url: url }
          : w
      )
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Winnings</h2>
        <p className="text-emerald-400 font-bold">₹{totalWon.toLocaleString("en-IN")}</p>
      </div>

      {winners.length === 0 ? (
        <p className="text-neutral-600 text-sm">No wins yet.</p>
      ) : (
        <div className="space-y-3">
          {winners.map((w) => (
            <WinnerRow key={w.id} winner={w} onProofUploaded={handleProofUploaded} />
          ))}
        </div>
      )}
    </div>
  );
}

function WinnerRow({
  winner,
  onProofUploaded,
}: {
  winner: WinnerItem;
  onProofUploaded: (id: string, url: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const statusLabel = getStatusLabel(winner);

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-950/60 px-3 py-2.5 text-sm">
      <div>
        <p className="font-medium">
          {winner.match_tier}-match — {winner.draws?.period}
        </p>
        <p className="text-neutral-500 text-xs capitalize">{statusLabel}</p>
      </div>
      <div className="text-right flex items-center gap-3">
        <p className="font-semibold text-emerald-400">₹{Number(winner.amount).toLocaleString("en-IN")}</p>
        {winner.review_status === "awaiting_proof" && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            Upload proof
          </button>
        )}
        {winner.review_status === "rejected" && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
          >
            Resubmit proof
          </button>
        )}
        {winner.review_status === "submitted" && (
          <span className="text-xs text-amber-400 font-medium">Under review</span>
        )}
        {winner.review_status === "approved" && winner.payment_status === "pending" && (
          <span className="text-xs text-emerald-400 font-medium">Approved</span>
        )}
        {winner.payment_status === "paid" && (
          <span className="text-xs text-emerald-400 font-medium">Paid</span>
        )}
      </div>

      {showModal && (
        <ProofUploadModal
          winnerId={winner.id}
          drawPeriod={winner.draws?.period}
          tier={winner.match_tier}
          onClose={() => setShowModal(false)}
          onSuccess={(url) => {
            onProofUploaded(winner.id, url);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
