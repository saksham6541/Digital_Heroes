/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { MotionFadeIn, MotionStaggerContainer, MotionStaggerItem, MotionCard } from "@/components/ui/MotionWrapper";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: charities }, { data: donations }] = await Promise.all([
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("charities").select("id, name, slug, description, image_url, is_featured").order("name"),
    supabase.from("donations").select("amount"),
  ]);
  const featuredCharity = (charities ?? []).find((charity) => charity.is_featured) ?? charities?.[0] ?? null;
  const donationTotal = (donations ?? []).reduce((total, donation) => total + Number(donation.amount ?? 0), 0);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar isAuthed={!!user} isAdmin={profile?.role === "admin"} />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 md:pt-28">
        <MotionFadeIn>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">Every round can give back</p>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Turn your scorecard into <span className="text-emerald-400">real-world impact</span>.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Subscribe, record your latest five Stableford rounds, and direct part of every plan toward a charity you choose while taking part in a monthly prize draw.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-full bg-emerald-500 px-7 py-3 font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">Subscribe</Link>
            <Link href="/charities" className="rounded-full border border-neutral-700 px-7 py-3 text-neutral-200 transition hover:border-emerald-500 hover:text-emerald-400">Explore charities</Link>
          </div>
        </MotionFadeIn>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">How it works</p>
        <h2 className="mb-8 text-3xl font-bold text-white">A simple habit with a wider reach.</h2>
        <MotionStaggerContainer className="grid gap-5 md:grid-cols-4">
          {["Subscribe to join", "Enter your last 5 scores", "Take part in the monthly draw", "Support a charity you choose"].map((title, index) => (
            <MotionStaggerItem key={title}>
              <div className="h-full rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-emerald-700">
                <span className="mb-4 block font-mono text-sm text-emerald-400">0{index + 1}</span>
                <h3 className="font-semibold text-white">{title}</h3>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStaggerContainer>
      </section>

      <section className="border-y border-neutral-900 bg-neutral-950/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">How you win</p>
          <h2 className="mb-8 text-3xl font-bold text-white">Match more numbers, share more of the pool.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[{ tier: "5 matches", share: "40%", body: "The jackpot tier. If nobody matches five, its pool rolls into the next draw." }, { tier: "4 matches", share: "35%", body: "A strong round earns a share of the four-match pool." }, { tier: "3 matches", share: "25%", body: "Three matches still turn consistent participation into a reward." }].map((item) => (
              <div key={item.tier} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                <p className="text-sm text-neutral-400">{item.tier}</p>
                <p className="my-3 text-4xl font-bold text-emerald-400">{item.share}</p>
                <p className="text-sm leading-relaxed text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredCharity && <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <MotionCard>
          <div className="grid gap-8 overflow-hidden rounded-3xl border border-emerald-900/60 bg-gradient-to-br from-emerald-950/70 via-neutral-900 to-neutral-950 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="p-7 sm:p-10"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">Charity impact</p><h2 className="mb-3 text-3xl font-bold text-white">{featuredCharity.name}</h2><p className="mb-6 max-w-xl text-neutral-400">{featuredCharity.description}</p><p className="mb-6 text-sm text-neutral-300">₹{donationTotal.toLocaleString("en-IN")} in recorded independent donations</p><Link href={`/charities/${featuredCharity.slug}`} className="inline-flex rounded-full border border-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-neutral-950">See the charity profile</Link></div>
            {featuredCharity.image_url ? <img src={featuredCharity.image_url} alt="" className="h-full min-h-48 w-full object-cover" /> : <div className="min-h-48 bg-emerald-500/10" />}
          </div>
        </MotionCard>
      </section>}

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"><MotionFadeIn><h2 className="mb-4 text-3xl font-bold text-white">Make your next round count twice.</h2><p className="mb-7 text-neutral-400">Start with a sandbox subscription and choose where your impact goes.</p><Link href="/signup" className="inline-flex rounded-full bg-emerald-500 px-8 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-400">Subscribe now</Link></MotionFadeIn></section>
      <footer className="border-t border-neutral-900 py-8 text-center text-sm text-neutral-600">digital.heroes — Play. Give. Win.</footer>
    </div>
  );
}
