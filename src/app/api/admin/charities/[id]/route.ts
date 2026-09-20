import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { validateCharity } from "@/lib/charity-validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const errorMessage = validateCharity(body ?? {});
  if (errorMessage) return NextResponse.json({ error: errorMessage }, { status: 400 });

  const { data, error } = await context.adminClient
    .from("charities")
    .update({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description.trim(),
      image_url: body.image_url || null,
      is_featured: Boolean(body.is_featured),
      events: body.events ?? [],
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ charity: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getAdminContext();
  if (context.error) return context.error;
  const { id } = await params;
  const { error } = await context.adminClient.from("charities").delete().eq("id", id);
  if (error) {
    const message = /foreign key|violates/i.test(error.message)
      ? "This charity is still referenced and cannot be deleted."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
