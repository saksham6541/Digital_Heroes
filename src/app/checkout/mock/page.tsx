import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MockCheckoutClient from "@/components/checkout/MockCheckoutClient";

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout/mock");
  }

  const params = await searchParams;
  const plan = params.plan === "yearly" ? "yearly" : "monthly";

  return <MockCheckoutClient plan={plan} />;
}
