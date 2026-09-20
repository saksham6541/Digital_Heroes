"use client";

import { useState } from "react";
import Link from "next/link";
import DonateModal from "./DonateModal";

export default function CharityDetailActions({
  charity,
}: {
  charity: { id: string; name: string };
}) {
  const [showDonate, setShowDonate] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-neutral-800">
      <Link
        href="/dashboard"
        className="rounded-full bg-emerald-500 hover:bg-emerald-400 transition-all transform hover:scale-105 text-neutral-950 font-semibold px-6 py-2.5 text-sm"
      >
        Select for Subscription
      </Link>
      <button
        onClick={() => setShowDonate(true)}
        className="rounded-full border border-neutral-700 bg-neutral-900/60 hover:border-emerald-500 hover:text-emerald-400 text-neutral-200 transition-all px-6 py-2.5 text-sm font-semibold cursor-pointer"
      >
        Make Independent Donation
      </button>

      {showDonate && (
        <DonateModal
          charity={charity}
          onClose={() => setShowDonate(false)}
        />
      )}
    </div>
  );
}
