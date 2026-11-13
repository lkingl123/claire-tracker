"use client";

import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Sleep } from "@/lib/types";
import { fetchRecentSleeps, formatDuration, sleepDayKey, sortNewestFirst, summarize } from "@/lib/sleep";
import SleepChart from "./SleepChart";
import SleepRow from "./SleepRow";

function formatDayLabel(key: string): string {
  const date = new Date(key + "T12:00:00");
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function groupByDay(sleeps: Sleep[]): { key: string; sleeps: Sleep[] }[] {
  const groups = new Map<string, Sleep[]>();
  for (const s of sleeps) {
    const key = sleepDayKey(s);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({ key, sleeps: sortNewestFirst(list) }));
}

export default function HistoryView({ onClose }: { onClose: () => void }) {
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMin, setChartMin] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const now = new Date();

  useEffect(() => {
    // ~90 days at a handful of sleeps per day
    fetchRecentSleeps(1000).then((data) => {
      setSleeps(data);
      setLoading(false);
    });
  }, []);

  const grouped = groupByDay(sleeps);

  function toggleDay(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col">
      <div className="px-5 pt-8 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-extrabold text-brown">{"📋"} Sleep History</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
        >
          {"✕"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        {!loading && sleeps.length > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setChartMin((m) => !m)}
              className="w-full flex items-center justify-between mb-2 active:opacity-70 transition-opacity"
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-brown-lighter">
                {"🌙"} Sleep Trend
              </span>
              <span className="text-[11px] font-bold text-brown-lighter flex items-center gap-1">
                {chartMin ? "Show" : "Hide"}
                <span className={`transition-transform ${chartMin ? "" : "rotate-180"}`}>{"▾"}</span>
              </span>
            </button>
            {!chartMin && <SleepChart sleeps={sleeps} />}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-3xl animate-bounce">{"📋"}</div>
            <div className="text-brown-lighter font-semibold">Loading...</div>
          </div>
        ) : sleeps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">{"🌟"}</div>
            <div className="text-brown-lighter font-semibold">No sleep history yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((group) => {
              const isCollapsed = collapsed.has(group.key);
              const s = summarize(group.sleeps, now);
              return (
                <div key={group.key} className="bg-white/40 rounded-[20px] p-3">
                  <button
                    onClick={() => toggleDay(group.key)}
                    className="w-full flex items-center gap-3 text-left active:opacity-70 transition-opacity"
                  >
                    <span
                      className={`text-brown-lighter text-xs transition-transform shrink-0 ${
                        isCollapsed ? "" : "rotate-90"
                      }`}
                    >
                      {"▶"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-brown">{formatDayLabel(group.key)}</div>
                      <div className="mt-1.5 flex gap-2 flex-wrap">
                        <span className="bg-lavender-light text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
                          {"🌙"} {formatDuration(s.nightMin)}
                        </span>
                        <span className="bg-sky/30 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
                          {"💤"} {formatDuration(s.napMin)} ({s.napCount})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-brown shrink-0">
                      {formatDuration(s.totalMin)}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 mt-3">
                      {group.sleeps.map((sleep) => (
                        <SleepRow key={sleep.id} sleep={sleep} now={now} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
