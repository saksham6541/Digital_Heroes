import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">404</p>
        <h1 className="mb-3 text-3xl font-bold text-white">That page is not on the scorecard.</h1>
        <p className="mb-6 text-neutral-400">The link may be outdated or the page may have moved.</p>
        <Link href="/" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950">Back home</Link>
      </div>
    </main>
  );
}
