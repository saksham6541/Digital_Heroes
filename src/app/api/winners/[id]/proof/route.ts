import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Valid proofUrl must:
 *  - use https:
 *  - originate from this project's Supabase Storage
 *  - sit inside the caller's own user folder:
 *    /storage/v1/object/public/winner-proofs/<userId>/
 *  - have no query string or fragment (prevents cache-busting tricks)
 */
function isAllowedProofUrl(url: string, userId: string): boolean {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;
    const requiredPrefix = `${supabaseUrl}/storage/v1/object/public/winner-proofs/${userId}/`;
    const parsed = new URL(url);
    return (
      url.startsWith(requiredPrefix) &&
      parsed.search === "" &&
      parsed.hash === "" &&
      !url.includes("?") &&
      !url.includes("#")
    );
  } catch {
    return false;
  }
}

// POST /api/winners/:id/proof — winner uploads a screenshot of their score
// from the golf platform as verification proof. Expects a Supabase Storage
// path already uploaded client-side to the "winner-proofs" bucket.
//
// Guards:
//  1. Auth         — caller must be signed in (401)
//  2. Ownership    — winner row must belong to caller (.eq("user_id", user.id))
//  3. Status       — only "awaiting_proof" and "rejected" rows may be updated
//  4. URL origin   — proofUrl must be an https:// URL within this project's
//                    Supabase Storage winner-proofs bucket under the caller's folder (400 otherwise)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { proofUrl?: string };
  try {
    body = (await req.json()) as { proofUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { proofUrl } = body;

  if (!proofUrl) return NextResponse.json({ error: "proofUrl is required" }, { status: 400 });
  if (!isAllowedProofUrl(proofUrl, user.id)) {
    return NextResponse.json(
      { error: "proofUrl must be a valid Supabase Storage URL for your own folder in winner-proofs." },
      { status: 400 }
    );
  }

  const { data: winner, error: fetchErr } = await supabase
    .from("winners")
    .select("id, user_id, review_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!winner) {
    return NextResponse.json({ error: "Winner record not found." }, { status: 404 });
  }

  if (!(["awaiting_proof", "rejected"] as const).includes(winner.review_status as "awaiting_proof" | "rejected")) {
    return NextResponse.json(
      { error: `Cannot submit proof when status is "${winner.review_status}".` },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("winners")
    .update({ proof_url: proofUrl, review_status: "submitted" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

