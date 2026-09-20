import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";
import { validateScoreInput } from "@/lib/score-validation";

// POST /api/scores — add a new score entry.
// Enforces: range 1-45, one entry per date, rolling window of 5.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end, cancel_at_period_end")
    .eq("id", user.id)
    .single();

  if (!isSubscriptionActive(profile)) {
    return NextResponse.json({ error: "An active subscription is required" }, { status: 403 });
  }

  let payload: { score?: number; playedOn?: string };
  try {
    payload = (await req.json()) as { score?: number; playedOn?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { score, playedOn } = payload;

  const validationError = validateScoreInput(score, playedOn);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: existing, error: existingErr } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .eq("played_on", playedOn)
    .maybeSingle();

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
  if (existing) {
    return NextResponse.json(
      { error: "A score already exists for that date. Edit or delete it instead." },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("scores")
    .insert({ user_id: user.id, score, played_on: playedOn })
    .select("id")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  const { data: all } = await supabase
    .from("scores")
    .select("id, played_on")
    .eq("user_id", user.id)
    .order("played_on", { ascending: false });

  if (all && all.length > 5) {
    const idsToDelete = all.slice(5).map((s) => s.id);
    await supabase.from("scores").delete().in("id", idsToDelete);
  }

  const { data: kept } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", inserted.id)
    .maybeSingle();

  if (!kept) {
    return NextResponse.json({ ok: true, dropped: true });
  }

  return NextResponse.json({ ok: true, dropped: false });
}

// GET /api/scores — the current user's last 5 scores, newest first.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user.id)
    .order("played_on", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data });
}
