"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Feeding, Diaper } from "@/lib/types";
import { format, isToday, isYesterday } from "date-fns";
import FeedingChart from "./FeedingChart";
import DiaperChart from "./DiaperChart";

type Entry =
  | { kind: "feeding"; data: Feeding; time: Date }
  | { kind: "diaper"; data: Diaper; time: Date };

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function groupByDay(entries: Entry[]): { key: string; label: string; entries: Entry[] }[] {
  const groups: Map<string, Entry[]> = new Map();

  for (const entry of entries) {
    const key = format(entry.time, "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, entries]) => ({
      key,
      label: formatDayLabel(new Date(key + "T12:00:00")),
      entries: entries.sort((a, b) => b.time.getTime() - a.time.getTime()),
    }));
}

function DaySummary({ entries }: { entries: Entry[] }) {
  const bottles = entries.filter(
    (e) => e.kind === "feeding" && e.data.type === "bottle"
  );
  const totalMl = bottles.reduce(
    (sum, e) => sum + ((e.data as Feeding).amount_ml || 0),
    0
  );
  const snacks = entries.filter(
    (e) => e.kind === "feeding" && e.data.type === "breast_snack"
  );
  const diaperEntries = entries.filter((e) => e.kind === "diaper");
  const wet = diaperEntries.filter((e) => {
    const d = e.data as Diaper;
    return d.type === "wet" || d.type === "both";
  }).length;
  const dirty = diaperEntries.filter((e) => {
    const d = e.data as Diaper;
    return d.type === "dirty" || d.type === "both";
  }).length;

  return (
    <div className="flex gap-2 flex-wrap">
      {totalMl > 0 && (
        <span className="bg-peach/30 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"🍼"} {totalMl}ml ({bottles.length})
        </span>
      )}
      {snacks.length > 0 && (
        <span className="bg-blush/25 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"🤱"} {snacks.length} snack{snacks.length !== 1 ? "s" : ""}
        </span>
      )}
      {diaperEntries.length > 0 && (
        <span className="bg-mint/30 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"👶"} {wet}w {dirty}d
        </span>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  if (entry.kind === "feeding") {
    const f = entry.data as Feeding;
    const isBottle = f.type === "bottle";
    return (
      <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
            isBottle ? "bg-peach/40" : "bg-blush/30"
          }`}
        >
          {isBottle ? "🍼" : "🤱"}
        </div>
        <div className="flex-1">
          <div className="font-bold text-xs text-brown">
            {isBottle ? `Bottle - ${f.amount_ml} ml` : `Snack - ${f.amount_ml} ml`}
          </div>
        </div>
        <div className="text-[11px] font-semibold text-brown-lighter">
          {format(entry.time, "h:mm a")}
        </div>
      </div>
    );
  }

  const d = entry.data as Diaper;
  const isBoth = d.type === "both";
  const emoji =
    d.type === "wet"
      ? "💧"
      : d.type === "dirty"
        ? "💩"
        : "💧💩";
  const label =
    d.type === "wet" ? "Wet" : d.type === "dirty" ? "Dirty" : "Both";
  const bg =
    d.type === "wet"
      ? "bg-sky/30"
      : d.type === "dirty"
        ? "bg-sunny/40"
        : "bg-mint/30";
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isBoth ? "text-xs" : "text-base"} ${bg}`}
      >
        {emoji}
      </div>
      <div className="flex-1">
        <div className="font-bold text-xs text-brown">Diaper - {label}</div>
      </div>
      <div className="text-[11px] font-semibold text-brown-lighter">
        {format(entry.time, "h:mm a")}
      </div>
    </div>
  );
}

export default function HistoryView({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allFeedings, setAllFeedings] = useState<Feeding[]>([]);
  const [allDiapers, setAllDiapers] = useState<Diaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<"feeding" | "diaper">("feeding");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [feedRes, diaperRes] = await Promise.all([
        supabase
          .from("feedings")
          .select("*")
          .order("fed_at", { ascending: false })
          .limit(200),
        supabase
          .from("diapers")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(200),
      ]);

      const feedingsData = (feedRes.data || []) as Feeding[];
      const diapersData = (diaperRes.data || []) as Diaper[];
      setAllFeedings(feedingsData);
      setAllDiapers(diapersData);

      const all: Entry[] = [
        ...feedingsData.map(
          (f: Feeding) =>
            ({ kind: "feeding", data: f, time: new Date(f.fed_at) }) as const
        ),
        ...diapersData.map(
          (d: Diaper) =>
            ({ kind: "diaper", data: d, time: new Date(d.changed_at) }) as const
        ),
      ];

      setEntries(all);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = groupByDay(entries);

  function toggleDay(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasFeeding = allFeedings.length > 0;
  const hasDiaper = allDiapers.length > 0;
  const showCharts = !loading && (hasFeeding || hasDiaper);
  // If only one kind of data exists, pin the tab to it.
  const activeTab = !hasFeeding && hasDiaper ? "diaper" : !hasDiaper ? "feeding" : chartTab;

  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col">
      {/* Header (fixed) */}
      <div className="px-5 pt-8 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-extrabold text-brown">
          {"📋"} History
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
        >
          {"✕"}
        </button>
      </div>

      {/* Everything scrolls together */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        {/* Chart with toggle tabs */}
        {showCharts && (
          <div className="mb-5">
            {hasFeeding && hasDiaper && (
              <div className="flex bg-cream-dark rounded-full p-0.5 mb-3 w-full max-w-[260px] mx-auto">
                <button
                  onClick={() => setChartTab("feeding")}
                  className={`flex-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === "feeding"
                      ? "bg-white text-brown shadow-sm"
                      : "text-brown-lighter"
                  }`}
                >
                  {"🍼"} Feeding
                </button>
                <button
                  onClick={() => setChartTab("diaper")}
                  className={`flex-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === "diaper"
                      ? "bg-white text-brown shadow-sm"
                      : "text-brown-lighter"
                  }`}
                >
                  {"👶"} Diaper
                </button>
              </div>
            )}
            {activeTab === "feeding" && hasFeeding && (
              <FeedingChart feedings={allFeedings} />
            )}
            {activeTab === "diaper" && hasDiaper && (
              <DiaperChart diapers={allDiapers} />
            )}
          </div>
        )}

        {/* Day log */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-3xl animate-bounce">{"📋"}</div>
            <div className="text-brown-lighter font-semibold">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">{"🌟"}</div>
            <div className="text-brown-lighter font-semibold">
              No history yet
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((group) => {
              const isCollapsed = collapsed.has(group.key);
              return (
                <div
                  key={group.key}
                  className="bg-white/40 rounded-[20px] p-3"
                >
                  {/* Day header — tap to collapse/expand */}
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
                      <div className="text-sm font-extrabold text-brown">
                        {group.label}
                      </div>
                      <div className="mt-1.5">
                        <DaySummary entries={group.entries} />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-brown-lighter shrink-0">
                      {group.entries.length}
                    </span>
                  </button>

                  {/* Entries */}
                  {!isCollapsed && (
                    <div className="space-y-2 mt-3">
                      {group.entries.map((entry) => (
                        <EntryRow
                          key={
                            entry.kind === "feeding"
                              ? `f-${(entry.data as Feeding).id}`
                              : `d-${(entry.data as Diaper).id}`
                          }
                          entry={entry}
                        />
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
