import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  calculatePoolShares,
  drawRandomNumbers,
  numbersFromScores,
  countMatches,
  tierFromMatchCount,
} from "@/lib/draw-engine";
import { isSubscriptionActive } from "@/lib/subscription";

const PER_SUBSCRIBER_CONTRIBUTION = 50;

// GET /api/draws/cron
// Automated monthly scheduler endpoint designed for Vercel Cron.
// Protected by CRON_SECRET environment variable.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Period: e.g. "2026-09"
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check if draw for this period is already published
  const { data: existing } = await supabase
    .from("draws")
    .select("id, status")
    .eq("period", period)
    .maybeSingle();

  if (existing && existing.status === "published") {
    return NextResponse.json({
      message: `Draw for period ${period} has already been published.`,
      drawId: existing.id,
    });
  }

  // Active subscribers & scores. Use the real-time subscription logic rather than
  // trusting the stored status flag alone once the period has ended.
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

  const winningNumbers = drawRandomNumbers();

  // Rollover jackpot check
  const { data: prevDraw } = await supabase
    .from("draws")
    .select("id, pool_5, period")
    .eq("status", "published")
    .order("period", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rollover = 0;
  if (prevDraw) {
    const { count: fiveWinners } = await supabase
      .from("winners")
      .select("id", { count: "exact", head: true })
      .eq("draw_id", prevDraw.id)
      .eq("match_tier", 5);

    if ((fiveWinners ?? 0) === 0) {
      rollover = Number(prevDraw.pool_5 || 0);
    }
  }

  const shares = calculatePoolShares(entries.length, PER_SUBSCRIBER_CONTRIBUTION, rollover);

  // Compute matches
  const results = entries.map((e) => {
    const matchCount = countMatches(e.numbers, winningNumbers);
    const tier = tierFromMatchCount(matchCount);
    return { ...e, matchCount, tier };
  });

  const winnersByTier = {
    5: results.filter((r) => r.tier === 5),
    4: results.filter((r) => r.tier === 4),
    3: results.filter((r) => r.tier === 3),
  };

  const { data: draw, error: drawError } = await supabase
    .from("draws")
    .upsert(
      {
        period,
        mode: "random",
        status: "published",
        winning_numbers: winningNumbers,
        active_subscriber_count: entries.length,
        pool_total: shares.total,
        pool_5: shares.pool5,
        pool_4: shares.pool4,
        pool_3: shares.pool3,
        jackpot_rollover_from: rollover > 0 && prevDraw ? prevDraw.id : null,
        published_at: new Date().toISOString(),
      },
      { onConflict: "period" }
    )
    .select()
    .single();

  if (drawError || !draw) {
    return NextResponse.json({ error: drawError?.message || "Failed to commit draw" }, { status: 500 });
  }

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

  return NextResponse.json({
    success: true,
    action: "published_via_cron",
    period,
    winningNumbers,
    pool: shares,
    winnerCounts: {
      tier5: winnersByTier[5].length,
      tier4: winnersByTier[4].length,
      tier3: winnersByTier[3].length,
    },
  });
}
