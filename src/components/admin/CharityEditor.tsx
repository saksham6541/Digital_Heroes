"use client";

import { useState } from "react";

export interface CharityEvent {
  title: string;
  date: string;
  location: string;
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_featured: boolean;
  image_url?: string | null;
  events?: CharityEvent[];
}

const emptyEvent = (): CharityEvent => ({ title: "", date: "", location: "" });

export default function CharityEditor({ charities: initial }: { charities: Charity[] }) {
  const [charities, setCharities] = useState<Charity[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Charity, "id">>({ name: "", slug: "", description: "", image_url: "", is_featured: false, events: [] });
  const [eventDrafts, setEventDrafts] = useState<CharityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", image_url: "", is_featured: false, events: [] });
    setEventDrafts([]);
    setError(null);
  }

  function startEdit(charity: Charity) {
    setEditingId(charity.id);
    setForm({ ...charity, image_url: charity.image_url ?? "", events: charity.events ?? [] });
    setEventDrafts(charity.events ?? []);
    setError(null);
  }

  function updateField<K extends keyof Omit<Charity, "id">>(key: K, value: Omit<Charity, "id">[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { ...form, events: eventDrafts };
    const response = await fetch(editingId ? `/api/admin/charities/${editingId}` : "/api/admin/charities", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) {
      setError(data?.error || "Charity could not be saved.");
      return;
    }
    if (editingId) setCharities((current) => current.map((charity) => charity.id === editingId ? data.charity : charity));
    else setCharities((current) => [...current, data.charity]);
    startAdd();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this charity?")) return;
    setError(null);
    const response = await fetch(`/api/admin/charities/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Charity could not be deleted.");
      return;
    }
    setCharities((current) => current.filter((charity) => charity.id !== id));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{editingId ? "Edit charity" : "Add a charity"}</h2>
          {editingId && <button type="button" onClick={startAdd} className="text-xs text-neutral-400 hover:text-white">Cancel edit</button>}
        </div>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
        <input required placeholder="Charity Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
        <input required placeholder="slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
        <input placeholder="Logo or Cover Image URL (optional)" value={form.image_url ?? ""} onChange={(e) => updateField("image_url", e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
        <textarea required placeholder="Mission / Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={form.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} /> Featured charity</label>
        <div className="space-y-2 border-t border-neutral-800 pt-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Upcoming events</h3><button type="button" onClick={() => setEventDrafts((events) => [...events, emptyEvent()])} className="text-xs text-emerald-400">Add event</button></div>
          {eventDrafts.map((event, index) => (
            <div key={`${index}-${event.title}`} className="grid gap-2 md:grid-cols-[1fr_10rem_1fr_auto]">
              <input required placeholder="Event title" value={event.title} onChange={(e) => setEventDrafts((events) => events.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
              <input required type="date" value={event.date} onChange={(e) => setEventDrafts((events) => events.map((item, i) => i === index ? { ...item, date: e.target.value } : item))} className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
              <input required placeholder="Location" value={event.location} onChange={(e) => setEventDrafts((events) => events.map((item, i) => i === index ? { ...item, location: e.target.value } : item))} className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm" />
              <button type="button" onClick={() => setEventDrafts((events) => events.filter((_, i) => i !== index))} className="text-xs text-red-400">Remove</button>
            </div>
          ))}
        </div>
        <button disabled={loading} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold px-4 py-2 text-sm">{loading ? "Saving…" : editingId ? "Save changes" : "Add charity"}</button>
      </form>

      <div className="space-y-3">
        {charities.map((charity) => (
          <div key={charity.id} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 flex justify-between items-start gap-4">
            <div><p className="font-medium">{charity.name} {charity.is_featured && <span className="text-emerald-400 text-xs ml-2">Featured</span>}</p><p className="text-neutral-500 text-sm mt-1">{charity.description}</p><p className="text-neutral-600 text-xs mt-2">{charity.events?.length ?? 0} event(s)</p></div>
            <div className="flex gap-3 text-xs shrink-0"><button onClick={() => startEdit(charity)} className="text-neutral-300 hover:text-white">Edit</button><button onClick={() => remove(charity.id)} className="text-neutral-400 hover:text-red-400">Delete</button></div>
          </div>
        ))}
        {charities.length === 0 && <p className="text-sm text-neutral-500">No charities found.</p>}
      </div>
    </div>
  );
}
