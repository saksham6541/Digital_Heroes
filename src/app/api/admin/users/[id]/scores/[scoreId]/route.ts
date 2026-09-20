import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { validateScoreInput } from "@/lib/score-validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; scoreId: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id, scoreId } = await params;
  const body = await req.json().catch(() => null);
  const errorMessage = validateScoreInput(body?.score, body?.playedOn);
  if (errorMessage) return NextResponse.json({ error: errorMessage }, { status: 400 });

  const { data: duplicate } = await context.adminClient
    .from("scores")
    .select("id")
    .eq("user_id", id)
    .eq("played_on", body.playedOn)
    .neq("id", scoreId)
    .maybeSingle();
  if (duplicate) return NextResponse.json({ error: "A score already exists for that date." }, { status: 409 });

  const { error } = await context.adminClient
    .from("scores")
    .update({ score: body.score, played_on: body.playedOn })
    .eq("id", scoreId)
    .eq("user_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; scoreId: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id, scoreId } = await params;
  const { error } = await context.adminClient.from("scores").delete().eq("id", scoreId).eq("user_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
