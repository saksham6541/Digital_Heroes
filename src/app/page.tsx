import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import {
  MotionFadeIn,
  MotionStaggerContainer,
  MotionStaggerItem,
  MotionCard,
} from "@/components/ui/MotionWrapper";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = profile?.role === "admin";
  }

  const { data: featuredCharity } = await supabase
    .from("charities")
    .select("*")
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <NavBar isAuthed={!!user} isAdmin={isAdmin} />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <MotionFadeIn delay={0.1}>
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Play. Give. Win.
          </p>
        </MotionFadeIn>
        <MotionFadeIn delay={0.2} duration={0.6}>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            Your scorecard, <br className="hidden md:block" />
            turned into <span className="text-emerald-400">impact</span>.
          </h1>
        </MotionFadeIn>
        <MotionFadeIn delay={0.3} duration={0.6}>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-10">
            Log your rounds, enter the monthly draw, and send part of every
            subscription straight to a cause you choose — no clubhouse required.
          </p>
        </MotionFadeIn>
        <MotionFadeIn delay={0.4}>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-emerald-500 hover:bg-emerald-400 transition-all transform hover:scale-105 text-neutral-950 font-semibold px-7 py-3 shadow-lg shadow-emerald-500/20"
            >
              Get started
            </Link>
            <Link
              href="/charities"
              className="rounded-full border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900/50 transition-all px-7 py-3 text-neutral-300"
            >
              Browse charities
            </Link>
          </div>
        </MotionFadeIn>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <MotionStaggerContainer className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Log your scores",
              body: "Enter your last 5 Stableford rounds in seconds. Your most recent 5 always count automatically.",
            },
            {
              step: "02",
              title: "Join the monthly draw",
              body: "Every active subscriber gets numbers derived from their performance — 3, 4, or 5 matches win a share of the pool.",
            },
            {
              step: "03",
              title: "Support your charity",
              body: "At least 10% of your subscription goes straight to a cause you pick, every single month.",
            },
          ].map((item) => (
            <MotionStaggerItem key={item.title}>
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-6 h-full backdrop-blur-sm transition-all hover:border-neutral-700">
                <span className="text-xs font-mono text-emerald-500 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 mb-3 inline-block">
                  STEP {item.step}
                </span>
                <h3 className="font-semibold text-lg mb-2 text-white">{item.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStaggerContainer>
      </section>

      {/* Featured charity */}
      {featuredCharity && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <MotionCard>
            <div className="rounded-3xl bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-neutral-950 border border-emerald-800/40 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-emerald-950/30">
              <div>
                <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">
                  This month&apos;s spotlight
                </p>
                <h3 className="text-2xl font-bold mb-2 text-white">{featuredCharity.name}</h3>
                <p className="text-neutral-400 max-w-lg">{featuredCharity.description}</p>
              </div>
              <Link
                href={`/charities/${featuredCharity.slug}`}
                className="whitespace-nowrap rounded-full border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 transition-colors px-6 py-2.5 font-semibold"
              >
                Learn more
              </Link>
            </div>
          </MotionCard>
        </section>
      )}

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <MotionFadeIn>
          <h2 className="text-3xl font-bold mb-4">Ready to play your part?</h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
            Join other players making every round count towards real-world change.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-full bg-emerald-500 hover:bg-emerald-400 transition-all transform hover:scale-105 text-neutral-950 font-semibold px-8 py-3 shadow-lg shadow-emerald-500/20"
          >
            Subscribe now
          </Link>
        </MotionFadeIn>
      </section>

      <footer className="border-t border-neutral-900 py-8 text-center text-neutral-600 text-sm">
        digital.heroes — Play. Give. Win.
      </footer>
    </div>
  );
}
