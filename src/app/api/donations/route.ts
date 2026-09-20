import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/donations
// Handles independent charitable donations (not tied to gameplay / subscription)
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json();
  const { charity_id, amount } = body;

  if (
    !charity_id ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000
  ) {
    return NextResponse.json(
      { error: "A valid charity and donation amount greater than 0 and up to 100,000 are required." },
      { status: 400 }
    );
  }

  const roundedAmount = Math.round(amount * 100) / 100;

  const adminClient = createAdminClient();

  // Verify charity exists
  const { data: charity, error: charityErr } = await adminClient
    .from("charities")
    .select("id, name")
    .eq("id", charity_id)
    .single();

  if (charityErr || !charity) {
    return NextResponse.json({ error: "Charity not found" }, { status: 404 });
  }

  // Record donation
  const { data: donation, error: donationErr } = await adminClient
    .from("donations")
    .insert({
      charity_id,
      user_id: user?.id || null,
      amount: roundedAmount,
    })
    .select()
    .single();

  if (donationErr) {
    return NextResponse.json({ error: donationErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Thank you! Your donation of ₹${roundedAmount.toLocaleString("en-IN")} to ${charity.name} has been recorded.`,
    donation,
  });
}
