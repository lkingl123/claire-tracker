"use client";

import { Feeding, Diaper } from "@/lib/types";
import { format } from "date-fns";

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(1);
}

type TimelineEntry =
  | { kind: "feeding"; data: Feeding; time: Date }
  | { kind: "diaper"; data: Diaper; time: Date };

interface Props {
  feedings: Feeding[];
  diapers: Diaper[];
  onDeleteFeeding: (id: string) => void;
  onDeleteDiaper: (id: string) => void;
}

export default function Timeline({
  feedings,
  diapers,
  onDeleteFeeding,
  onDeleteDiaper,
}: Props) {
  const entries: TimelineEntry[] = [
    ...feedings.map(
      (f) =>
        ({ kind: "feeding", data: f, time: new Date(f.fed_at) }) as const
    ),
    ...diapers.map(
      (d) =>
        ({ kind: "diaper", data: d, time: new Date(d.changed_at) }) as const
    ),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">{"\uD83C\uDF1F"}</div>
        <div className="text-brown-lighter font-semibold">
          No entries yet today
        </div>
        <div className="text-brown-lighter/60 text-sm mt-1">
          Tap a button above to start logging!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {entries.map((entry) => {
        if (entry.kind === "feeding") {
          const f = entry.data;
          const isBottle = f.type === "bottle";
          return (
            <div
              key={`f-${f.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                  isBottle ? "bg-peach/40" : "bg-blush/30"
                }`}
              >
                {isBottle ? "\uD83C\uDF7C" : "\uD83E\uDD31"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-brown">
                  {isBottle
                    ? `Bottle - ${f.amount_ml} ml (${mlToOz(f.amount_ml || 0)} oz)`
                    : `Snack - ${f.duration_minutes} min`}
                </div>
                <div className="text-xs font-medium text-brown-lighter">
                  {format(entry.time, "h:mm a")}
                </div>
              </div>
              <button
                onClick={() => onDeleteFeeding(f.id)}
                className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-brown-lighter text-xs active:scale-90 transition-transform"
              >
                {"\u2715"}
              </button>
            </div>
          );
        } else {
          const d = entry.data;
          const emoji =
            d.type === "wet"
              ? "\uD83D\uDCA7"
              : d.type === "dirty"
                ? "\uD83D\uDCA9"
                : "\uD83D\uDCA7\uD83D\uDCA9";
          const label =
            d.type === "wet" ? "Wet" : d.type === "dirty" ? "Dirty" : "Both";
          const bg =
            d.type === "wet"
              ? "bg-sky/30"
              : d.type === "dirty"
                ? "bg-sunny/40"
                : "bg-mint/30";
          return (
            <div
              key={`d-${d.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)]"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${bg}`}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-brown">
                  Diaper - {label}
                </div>
                <div className="text-xs font-medium text-brown-lighter">
                  {format(entry.time, "h:mm a")}
                </div>
              </div>
              <button
                onClick={() => onDeleteDiaper(d.id)}
                className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-brown-lighter text-xs active:scale-90 transition-transform"
              >
                {"\u2715"}
              </button>
            </div>
          );
        }
      })}
    </div>
  );
}
