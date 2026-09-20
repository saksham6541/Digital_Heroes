import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// POST /api/winners/:id/verify — admin approves or rejects a winner's
// submitted proof, and can mark a payout as completed.
// body: { decision: "approve" | "reject", markPaid?: boolean, note?: string }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let payload: { decision?: "approve" | "reject"; markPaid?: boolean; note?: string };
  try {
    payload = (await req.json()) as { decision?: "approve" | "reject"; markPaid?: boolean; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { decision, markPaid, note } = payload;
  const adminClient = createAdminClient();
  const { data: winner, error: fetchErr } = await adminClient
    .from("winners")
    .select("id, review_status, payment_status")
    .eq("id", id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const updates: Record<string, unknown> = { admin_note: note ?? null };

  if (decision === "approve") {
    if (winner.review_status !== "submitted") {
      return NextResponse.json({ error: "Only submitted winners can be approved." }, { status: 409 });
    }
    updates.review_status = "approved";
  } else if (decision === "reject") {
    if (winner.review_status !== "submitted") {
      return NextResponse.json({ error: "Only submitted winners can be rejected." }, { status: 409 });
    }
    updates.review_status = "rejected";
  }

  if (markPaid) {
    if (winner.review_status !== "approved" || winner.payment_status !== "pending") {
      return NextResponse.json({ error: "Only approved winners with pending payment can be marked paid." }, { status: 409 });
    }
    updates.payment_status = "paid";
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await adminClient.from("winners").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
