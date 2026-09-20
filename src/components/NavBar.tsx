"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar({ isAuthed, isAdmin }: { isAuthed: boolean; isAdmin?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/85 border-b border-neutral-800/80 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-white tracking-tight flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span>digital<span className="text-emerald-400">.heroes</span></span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-neutral-300">
          <Link href="/charities" className="hover:text-white transition-colors hover:underline underline-offset-4 decoration-emerald-500/50">
            Charities
          </Link>
          {isAuthed ? (
            <>
              <Link href="/dashboard" className="hover:text-white transition-colors hover:underline underline-offset-4 decoration-emerald-500/50">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  Admin Panel
                </Link>
              )}
              <button onClick={handleLogout} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-4 py-1.5 transition-all transform hover:scale-105 shadow-sm shadow-emerald-500/20"
              >
                Subscribe
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
