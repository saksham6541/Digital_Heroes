import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";
import { getNextMonthlyDraw } from "@/lib/draw-schedule";
import NavBar from "@/components/NavBar";
import ScorePanel from "@/components/dashboard/ScorePanel";
import SubscriptionPanel from "@/components/dashboard/SubscriptionPanel";
import CharityPanel from "@/components/dashboard/CharityPanel";
import ParticipationPanel from "@/components/dashboard/ParticipationPanel";
import WinningsPanel from "@/components/dashboard/WinningsPanel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware guards this route

  const [{ data: profile }, { data: scores }, { data: charities }, { data: draws }, { data: winners }, { count: drawEntriesCount }] =
    await Promise.all([
      supabase.from("profiles").select("*, charities(*)").eq("id", user.id).single(),
      supabase.from("scores").select("*").eq("user_id", user.id).order("played_on", { ascending: false }).limit(5),
      supabase.from("charities").select("*").order("name"),
      supabase.from("draws").select("*").order("period", { ascending: false }).limit(3),
      supabase.from("winners").select("*, draws(period)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("draw_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

  const nextDraw = getNextMonthlyDraw();

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin={profile?.role === "admin"} />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-1">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
        <p className="text-neutral-400 mb-10">Here&apos;s where things stand.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <SubscriptionPanel profile={profile} />
          <CharityPanel profile={profile} charities={charities ?? []} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ScorePanel initialScores={scores ?? []} isSubscriptionActive={isSubscriptionActive(profile)} />
          <ParticipationPanel draws={draws ?? []} drawEntriesCount={drawEntriesCount ?? 0} nextDraw={nextDraw} />
        </div>

        <WinningsPanel winners={winners ?? []} />
      </div>
    </div>
  );
}
