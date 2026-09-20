"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_featured: boolean;
  image_url?: string | null;
  events?: unknown;
}

export default function CharityEditor({ charities: initial }: { charities: Charity[] }) {
  const [charities, setCharities] = useState<Charity[]>(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function addCharity(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase
      .from("charities")
      .insert({
        name,
        description,
        slug,
        image_url: imageUrl || null,
      })
      .select()
      .single();
    if (!error && data) {
      setCharities([...charities, data]);
      setName("");
      setDescription("");
      setImageUrl("");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("charities").update({ is_featured: !current }).eq("id", id);
    setCharities(charities.map((c) => (c.id === id ? { ...c, is_featured: !current } : c)));
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("charities").delete().eq("id", id);
    setCharities(charities.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addCharity} className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6 space-y-3">
        <h2 className="font-semibold text-lg mb-2">Add a charity</h2>
        <input
          required
          placeholder="Charity Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
        />
        <input
          placeholder="Logo or Cover Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="Mission / Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-4 py-2 text-sm cursor-pointer">
          Add charity
        </button>
      </form>

      <div className="space-y-3">
        {charities.map((c) => (
          <div key={c.id} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 flex justify-between items-start">
            <div>
              <p className="font-medium">
                {c.name} {c.is_featured && <span className="text-emerald-400 text-xs ml-2">Featured</span>}
              </p>
              <p className="text-neutral-500 text-sm mt-1">{c.description}</p>
            </div>
            <div className="flex gap-3 text-xs shrink-0">
              <button onClick={() => toggleFeatured(c.id, c.is_featured)} className="text-neutral-400 hover:text-white">
                {c.is_featured ? "Unfeature" : "Feature"}
              </button>
              <button onClick={() => remove(c.id)} className="text-neutral-400 hover:text-red-400">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
