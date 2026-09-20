"use client";

import { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export interface DrawStatItem {
  period: string;
  pool_total: number;
  pool_5: number;
  pool_4: number;
  pool_3: number;
  subscribers: number;
}

export interface CharityStatItem {
  name: string;
  amount: number;
}

export interface SubscriberStatusItem {
  status: string;
  count: number;
}

interface AdminChartsProps {
  drawStats: DrawStatItem[];
  charityStats: CharityStatItem[];
  subscriberStats: SubscriberStatusItem[];
}

const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"];

const subscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export default function AdminCharts({
  drawStats,
  charityStats,
  subscriberStats,
}: AdminChartsProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="grid lg:grid-cols-2 gap-6 my-8">
        <div className="h-72 rounded-2xl border border-neutral-900 bg-neutral-900/30 animate-pulse" />
        <div className="h-72 rounded-2xl border border-neutral-900 bg-neutral-900/30 animate-pulse" />
      </div>
    );
  }

  // Fallback demo data if no published draws yet
  const displayDrawData =
    drawStats.length > 0
      ? drawStats
      : [
          { period: "2026-06", pool_total: 25000, pool_5: 10000, pool_4: 8750, pool_3: 6250, subscribers: 500 },
          { period: "2026-07", pool_total: 35000, pool_5: 14000, pool_4: 12250, pool_3: 8750, subscribers: 700 },
          { period: "2026-08", pool_total: 48000, pool_5: 19200, pool_4: 16800, pool_3: 12000, subscribers: 960 },
          { period: "2026-09", pool_total: 62000, pool_5: 24800, pool_4: 21700, pool_3: 15500, subscribers: 1240 },
        ];

  const displayCharityData =
    charityStats.length > 0
      ? charityStats
      : [
          { name: "Bright Futures Foundation", amount: 18500 },
          { name: "Clean Rivers Initiative", amount: 14200 },
          { name: "Care for Strays", amount: 9800 },
        ];

  return (
    <div className="grid lg:grid-cols-2 gap-6 my-8">
      {/* Draw Pool History */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white text-base">Prize Pool & Tier History</h3>
            <p className="text-xs text-neutral-400">Progression across monthly draws (₹)</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Monthly Cadence
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayDrawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="period" stroke="#737373" fontSize={11} />
              <YAxis stroke="#737373" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  borderColor: "#262626",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                formatter={(value: unknown) => [
                  `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                  undefined,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="pool_5" name="5-Match Jackpot (40%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pool_4" name="4-Match (35%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pool_3" name="3-Match (25%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charity & Subscriber Distribution */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-base">Charity Impact Breakdown</h3>
              <p className="text-xs text-neutral-400">Total funds directed by partner charity</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
              Donations & Subscriptions
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayCharityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {displayCharityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    borderColor: "#262626",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(value: unknown) => [
                    `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                    "Contribution",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend pills */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
          {displayCharityData.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2 text-xs text-neutral-300 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriber Health Stats */}
      {subscriberStats.length > 0 && (
        <div className="lg:col-span-2 rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-neutral-400 font-medium">Subscriber Status Breakdown:</span>
          <div className="flex flex-wrap items-center gap-3">
            {subscriberStats.map((s) => (
              <span
                key={s.status}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/70 text-neutral-300 border border-neutral-700/50"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    s.status === "active"
                      ? "bg-emerald-400"
                      : s.status === "cancelled"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="capitalize">{s.status}:</span>
                <span className="font-bold text-white">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
