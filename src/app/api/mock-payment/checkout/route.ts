import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { mockPayment } from "@/lib/mock-payment";

export async function POST(req: Request) {
  if (process.env.MOCK_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Mock payments are disabled." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan;
  const charityId = body?.charityId || null;
  const contributionPct = body?.contributionPct ?? 10;

  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  if (!Number.isFinite(contributionPct) || contributionPct < 10 || contributionPct > 100) {
    return NextResponse.json({ error: "Contribution must be between 10 and 100 percent." }, { status: 400 });
  }

  if (charityId) {
    const { data: charity, error: charityError } = await createAdminClient()
      .from("charities")
      .select("id")
      .eq("id", charityId)
      .maybeSingle();
    if (charityError) return NextResponse.json({ error: charityError.message }, { status: 500 });
    if (!charity) return NextResponse.json({ error: "Charity not found." }, { status: 404 });
  }

  const subscription = await mockPayment.createSubscription({ plan, userId: user.id });
  const confirmationUrl = new URL("/checkout/confirm", req.url);
  confirmationUrl.searchParams.set("plan", plan);
  if (charityId) confirmationUrl.searchParams.set("charityId", charityId);
  confirmationUrl.searchParams.set("contributionPct", String(contributionPct));

  return NextResponse.json({
    url: confirmationUrl.toString(),
    subscriptionId: subscription.id,
  });
}
