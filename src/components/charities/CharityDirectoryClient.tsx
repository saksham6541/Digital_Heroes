"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DonateModal from "./DonateModal";

export interface CharityItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_featured: boolean;
  image_url?: string | null;
}

export default function CharityDirectoryClient({
  initialCharities,
}: {
  initialCharities: CharityItem[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [donatingCharity, setDonatingCharity] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    return initialCharities.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || (filter === "featured" && c.is_featured);
      return matchesSearch && matchesFilter;
    });
  }, [initialCharities, search, filter]);

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search causes by name or focus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none backdrop-blur-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-emerald-500 text-neutral-950"
                : "border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            All Causes ({initialCharities.length})
          </button>
          <button
            onClick={() => setFilter("featured")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === "featured"
                ? "bg-emerald-500 text-neutral-950"
                : "border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Featured Only
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-all p-6 flex flex-col justify-between backdrop-blur-sm group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                {c.is_featured ? (
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Featured
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    Verified Partner
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {c.name}
              </h3>
              <p className="text-neutral-400 text-sm line-clamp-3 leading-relaxed mb-6">
                {c.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
              <Link
                href={`/charities/${c.slug}`}
                className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Learn More →
              </Link>
              <button
                onClick={() => setDonatingCharity({ id: c.id, name: c.name })}
                className="rounded-full bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-neutral-300 px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer"
              >
                Donate Directly
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/20 p-12 text-center">
          <p className="text-neutral-400 text-sm">No charities match your search query.</p>
          <button
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-3 text-xs text-emerald-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {donatingCharity && (
        <DonateModal
          charity={donatingCharity}
          onClose={() => setDonatingCharity(null)}
        />
      )}
    </div>
  );
}
