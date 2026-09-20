import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/checkout — starts a Stripe Checkout session for a
// monthly or yearly subscription. body: { plan: "monthly" | "yearly", charityId, contributionPct }
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { plan, charityId, contributionPct } = body ?? {};
  const priceId = plan === "yearly" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return NextResponse.json({ error: "Price not configured." }, { status: 500 });

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // Persist charity choice now so the webhook can activate it on completion.
    if (charityId) {
      await supabase
        .from("profiles")
        .update({ charity_id: charityId, charity_contribution_pct: contributionPct ?? 10 })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscribed=0`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 500 });
  }
}
