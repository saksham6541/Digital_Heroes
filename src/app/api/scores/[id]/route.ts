import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";
import { validateScoreInput } from "@/lib/score-validation";

// PATCH /api/scores/:id — edit a score entry (value and/or date)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (score === undefined || playedOn === undefined) {
    return NextResponse.json({ error: "Score and date are required." }, { status: 400 });
  }
  const validationError = validateScoreInput(score, playedOn);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (score !== undefined) updates.score = score;
  if (playedOn !== undefined) updates.played_on = playedOn;

  {
    const { data: existing, error: existingErr } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("played_on", playedOn)
      .neq("id", id)
      .maybeSingle();

    if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
    if (existing) {
      return NextResponse.json({ error: "You already have a score for this date" }, { status: 409 });
    }
  }

  const { error } = await supabase
    .from("scores")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/scores/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { error } = await supabase.from("scores").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
