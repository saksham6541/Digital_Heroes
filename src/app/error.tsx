"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the production-facing error page friendly without exposing internals.
    console.error("Application error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-300">Something went wrong</p>
        <h1 className="mb-3 text-3xl font-bold text-white">We lost the thread for a moment.</h1>
        <p className="mb-6 text-neutral-400">Try again, or return to the homepage.</p>
        <div className="flex justify-center gap-3"><button onClick={() => reset()} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950">Try again</button><Link href="/" className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm text-neutral-200">Home</Link></div>
      </div>
    </main>
  );
}
