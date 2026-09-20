import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import {
  calculatePoolShares,
  drawRandomNumbers,
  drawWeightedNumbers,
  numbersFromScores,
  countMatches,
  tierFromMatchCount,
} from "@/lib/draw-engine";
import { isSubscriptionActive } from "@/lib/subscription";

const PER_SUBSCRIBER_CONTRIBUTION = 50; // ₹ fixed portion of a subscription fed into the pool — tune as needed

// POST /api/draws/run
// body: { period: "2026-09", mode: "random" | "algorithmic", action: "simulate" | "publish" }
// Admin-only. "simulate" computes numbers + winners without persisting a
// published result; "publish" commits it and creates winner records.
export async function POST(req: Request) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const supabase = context.adminClient;

  const { period, mode, action } = await req.json().catch(() => ({}));
  if (!period || !["random", "algorithmic"].includes(mode) || !["simulate", "publish"].includes(action)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (action === "publish") {
    const { data: existing } = await supabase.from("draws").select("id, status").eq("period", period).maybeSingle();
    if (existing?.status === "published") {
      return NextResponse.json({ error: `Draw for ${period} is already published.` }, { status: 409 });
    }
  }

  // Build entries: every active subscriber's numbers, derived from their last 5 scores.
  // The real-time check must depend on the subscription end date, not the stored flag alone.
  const { data: allSubs } = await supabase
    .from("profiles")
    .select("id, subscription_status, current_period_end, cancel_at_period_end, scores(score, played_on)");

  const activeSubs = (allSubs ?? []).filter((sub) => isSubscriptionActive(sub as { subscription_status?: string | null; current_period_end?: string | null; subscription_renews_at?: string | null; cancel_at_period_end?: boolean | null; plan?: string | null; subscription_plan?: string | null; }));

  interface ScoreItem {
    score: number;
    played_on: string;
  }
  interface ActiveSubItem {
    id: string;
    scores?: ScoreItem[] | null;
  }

  const entries = ((activeSubs as unknown as ActiveSubItem[]) ?? []).map((sub) => {
    const scores = (sub.scores ?? [])
      .slice()
      .sort((a, b) => (a.played_on < b.played_on ? 1 : -1))
      .slice(0, 5)
      .map((s) => s.score);
    return { userId: sub.id, numbers: numbersFromScores(scores) };
  });

  const winningNumbers =
    mode === "random"
      ? drawRandomNumbers()
      : drawWeightedNumbers(entries.map((e) => e.numbers));

  // Check for an unclaimed jackpot to roll over from the most recent published draw
  const { data: prevDraw } = await supabase
    .from("draws")
    .select("id, pool_5, period")
    .eq("status", "published")
    .order("period", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rollover = 0;
  if (prevDraw) {
    const { count: prevJackpotWinners } = await supabase
      .from("winners")
      .select("id", { count: "exact", head: true })
      .eq("draw_id", prevDraw.id)
      .eq("match_tier", 5);
    if (!prevJackpotWinners) rollover = Number(prevDraw.pool_5) || 0;
  }

  const shares = calculatePoolShares(entries.length, PER_SUBSCRIBER_CONTRIBUTION, rollover);

  const results = entries.map((e) => {
    const matchCount = countMatches(e.numbers, winningNumbers);
    return { ...e, matchCount, tier: tierFromMatchCount(matchCount) };
  });

  const winnersByTier = {
    5: results.filter((r) => r.tier === 5),
    4: results.filter((r) => r.tier === 4),
    3: results.filter((r) => r.tier === 3),
  };

  const summary = {
    period,
    mode,
    winningNumbers,
    activeSubscriberCount: entries.length,
    pool: shares,
    winnerCounts: { 5: winnersByTier[5].length, 4: winnersByTier[4].length, 3: winnersByTier[3].length },
  };

  if (action === "simulate") {
    return NextResponse.json({ simulated: true, ...summary });
  }

  // --- Publish: persist the draw, entries, and winner records ---
  const { data: draw, error: drawErr } = await supabase
    .from("draws")
    .upsert(
      {
        period,
        mode,
        status: "published",
        winning_numbers: winningNumbers,
        active_subscriber_count: entries.length,
        pool_total: shares.total,
        pool_5: shares.pool5,
        pool_4: shares.pool4,
        pool_3: shares.pool3,
        jackpot_rollover_from: rollover > 0 ? prevDraw?.id : null,
        published_at: new Date().toISOString(),
      },
      { onConflict: "period" }
    )
    .select()
    .single();

  if (drawErr) return NextResponse.json({ error: drawErr.message }, { status: 500 });

  if (entries.length > 0) {
    await supabase.from("draw_entries").upsert(
      results.map((r) => ({
        draw_id: draw.id,
        user_id: r.userId,
        numbers: r.numbers,
        match_count: r.matchCount,
      })),
      { onConflict: "draw_id,user_id" }
    );
  }


  const allWinners = [
    ...winnersByTier[5].map((r) => ({
      draw_id: draw.id,
      user_id: r.userId,
      match_tier: 5,
      amount: winnersByTier[5].length ? Math.round((shares.pool5 / winnersByTier[5].length) * 100) / 100 : 0,
    })),
    ...winnersByTier[4].map((r) => ({
      draw_id: draw.id,
      user_id: r.userId,
      match_tier: 4,
      amount: winnersByTier[4].length ? Math.round((shares.pool4 / winnersByTier[4].length) * 100) / 100 : 0,
    })),
    ...winnersByTier[3].map((r) => ({
      draw_id: draw.id,
      user_id: r.userId,
      match_tier: 3,
      amount: winnersByTier[3].length ? Math.round((shares.pool3 / winnersByTier[3].length) * 100) / 100 : 0,
    })),
  ];

  if (allWinners.length > 0) {
    await supabase.from("winners").insert(allWinners);
  }

  return NextResponse.json({ published: true, ...summary });
}
