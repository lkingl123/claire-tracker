"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Feeding, Diaper } from "@/lib/types";
import { format, isToday, isYesterday } from "date-fns";

type Entry =
  | { kind: "feeding"; data: Feeding; time: Date }
  | { kind: "diaper"; data: Diaper; time: Date };

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function groupByDay(entries: Entry[]): { label: string; entries: Entry[] }[] {
  const groups: Map<string, Entry[]> = new Map();

  for (const entry of entries) {
    const key = format(entry.time, "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, entries]) => ({
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
    <div className="flex gap-3 flex-wrap">
      {totalMl > 0 && (
        <span className="bg-peach/30 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"\uD83C\uDF7C"} {totalMl}ml ({bottles.length})
        </span>
      )}
      {snacks.length > 0 && (
        <span className="bg-blush/25 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"\uD83E\uDD31"} {snacks.length} snack{snacks.length !== 1 ? "s" : ""}
        </span>
      )}
      {diaperEntries.length > 0 && (
        <span className="bg-mint/30 text-brown-light text-[11px] font-bold px-2.5 py-1 rounded-full">
          {"\uD83D\uDC76"} {wet}w {dirty}d
        </span>
      )}
    </div>
  );
}

export default function HistoryView({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

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

      const all: Entry[] = [
        ...(feedRes.data || []).map(
          (f: Feeding) =>
            ({ kind: "feeding", data: f, time: new Date(f.fed_at) }) as const
        ),
        ...(diaperRes.data || []).map(
          (d: Diaper) =>
            ({
              kind: "diaper",
              data: d,
              time: new Date(d.changed_at),
            }) as const
        ),
      ];

      setEntries(all);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = groupByDay(entries);

  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-brown">
          {"\uD83D\uDCCB"} History
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-center text-brown-light font-bold active:scale-90 transition-transform"
        >
          {"\u2715"}
        </button>
      </div>

      {/* Scrollable log */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-3xl animate-bounce">{"\uD83D\uDCCB"}</div>
            <div className="text-brown-lighter font-semibold">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">{"\uD83C\uDF1F"}</div>
            <div className="text-brown-lighter font-semibold">
              No history yet
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Day header */}
                <div className="mb-2">
                  <div className="text-sm font-extrabold text-brown">
                    {group.label}
                  </div>
                  <div className="mt-1.5">
                    <DaySummary entries={group.entries} />
                  </div>
                </div>

                {/* Entries */}
                <div className="space-y-2 mt-3">
                  {group.entries.map((entry) => {
                    if (entry.kind === "feeding") {
                      const f = entry.data as Feeding;
                      const isBottle = f.type === "bottle";
                      return (
                        <div
                          key={`f-${f.id}`}
                          className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                              isBottle ? "bg-peach/40" : "bg-blush/30"
                            }`}
                          >
                            {isBottle ? "\uD83C\uDF7C" : "\uD83E\uDD31"}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xs text-brown">
                              {isBottle
                                ? `Bottle - ${f.amount_ml} ml`
                                : `Snack - ${f.amount_ml} ml`}
                            </div>
                          </div>
                          <div className="text-[11px] font-semibold text-brown-lighter">
                            {format(entry.time, "h:mm a")}
                          </div>
                        </div>
                      );
                    } else {
                      const d = entry.data as Diaper;
                      const emoji =
                        d.type === "wet"
                          ? "\uD83D\uDCA7"
                          : d.type === "dirty"
                            ? "\uD83D\uDCA9"
                            : "\uD83D\uDCA7\uD83D\uDCA9";
                      const label =
                        d.type === "wet"
                          ? "Wet"
                          : d.type === "dirty"
                            ? "Dirty"
                            : "Both";
                      const bg =
                        d.type === "wet"
                          ? "bg-sky/30"
                          : d.type === "dirty"
                            ? "bg-sunny/40"
                            : "bg-mint/30";
                      return (
                        <div
                          key={`d-${d.id}`}
                          className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${bg}`}
                          >
                            {emoji}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xs text-brown">
                              Diaper - {label}
                            </div>
                          </div>
                          <div className="text-[11px] font-semibold text-brown-lighter">
                            {format(entry.time, "h:mm a")}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
