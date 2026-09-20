import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { validateScoreInput } from "@/lib/score-validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id } = await params;
  const { data, error } = await context.adminClient
    .from("scores")
    .select("*")
    .eq("user_id", id)
    .order("played_on", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const errorMessage = validateScoreInput(body?.score, body?.playedOn);
  if (errorMessage) return NextResponse.json({ error: errorMessage }, { status: 400 });

  const { data: duplicate } = await context.adminClient
    .from("scores")
    .select("id")
    .eq("user_id", id)
    .eq("played_on", body.playedOn)
    .maybeSingle();
  if (duplicate) return NextResponse.json({ error: "A score already exists for that date." }, { status: 409 });

  const { data: inserted, error } = await context.adminClient
    .from("scores")
    .insert({ user_id: id, score: body.score, played_on: body.playedOn })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: all } = await context.adminClient
    .from("scores")
    .select("id")
    .eq("user_id", id)
    .order("played_on", { ascending: false });
  const idsToDelete = (all ?? []).slice(5).map((score) => score.id);
  if (idsToDelete.length > 0) await context.adminClient.from("scores").delete().in("id", idsToDelete);

  return NextResponse.json({ ok: true, dropped: !(all ?? []).slice(0, 5).some((score) => score.id === inserted.id) });
}
