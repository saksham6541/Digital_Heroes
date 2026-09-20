"use client";

import { useState } from "react";

interface DonateModalProps {
  charity: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DonateModal({
  charity,
  onClose,
  onSuccess,
}: DonateModalProps) {
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = isCustom ? Number(customAmount) : amount;

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAmount || finalAmount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charity_id: charity.id,
          amount: finalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process donation");
      }

      setSuccessMsg(data.message);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error processing donation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Direct Donation</h3>
            <p className="text-xs text-neutral-400">Supporting {charity.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {successMsg ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <p className="text-sm text-neutral-200">{successMsg}</p>
            <p className="text-xs text-neutral-500">
              100% of this contribution is directed to {charity.name}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 py-2 text-xs font-semibold text-neutral-950 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleDonate} className="space-y-4">
            <p className="text-xs text-neutral-400">
              Make an independent, one-time donation to {charity.name}. This is not tied to gameplay or subscription fees.
            </p>

            {error && (
              <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs text-neutral-400 block mb-2">Select Amount</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[250, 500, 1000, 2500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setAmount(val);
                    }}
                    className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                      !isCustom && amount === val
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300"
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`text-xs ${
                    isCustom ? "text-emerald-400 font-semibold" : "text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  + Or enter custom amount
                </button>
                {isCustom && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-2.5 text-sm text-neutral-500">₹</span>
                    <input
                      type="number"
                      min="50"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount (e.g. 5000)"
                      className="w-full rounded-lg bg-neutral-950 border border-neutral-800 pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !finalAmount || finalAmount <= 0}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-semibold text-neutral-950 transition-colors disabled:opacity-40"
              >
                {loading ? "Processing…" : `Donate ₹${finalAmount || 0}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
