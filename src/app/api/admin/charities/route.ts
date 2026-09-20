import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { validateCharity } from "@/lib/charity-validation";

export async function POST(req: Request) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const body = await req.json().catch(() => null);
  const errorMessage = validateCharity(body ?? {});
  if (errorMessage) return NextResponse.json({ error: errorMessage }, { status: 400 });

  const { data, error } = await context.adminClient
    .from("charities")
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description.trim(),
      image_url: body.image_url || null,
      is_featured: Boolean(body.is_featured),
      events: body.events ?? [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ charity: data });
}

