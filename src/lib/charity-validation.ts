export function validateCharity(body: Record<string, unknown>) {
  if (typeof body.name !== "string" || !body.name.trim()) return "Name is required.";
  if (typeof body.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) return "Slug must use lowercase letters, numbers, and hyphens.";
  if (typeof body.description !== "string" || !body.description.trim()) return "Description is required.";
  if (body.events !== undefined && (!Array.isArray(body.events) || body.events.some((event) => {
    const item = event as Record<string, unknown>;
    return typeof item.title !== "string" || !item.title || typeof item.date !== "string" || Number.isNaN(Date.parse(item.date)) || typeof item.location !== "string";
  }))) return "Events must have a title, valid date, and location.";
  return null;
}
