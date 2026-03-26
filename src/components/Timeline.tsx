"use client";

import { Feeding, Diaper } from "@/lib/types";
import { format } from "date-fns";

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
      <div className="text-center text-gray-400 py-8">
        No entries yet today. Start logging!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        if (entry.kind === "feeding") {
          const f = entry.data;
          const isBottle = f.type === "bottle";
          return (
            <div
              key={`f-${f.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isBottle
                    ? "bg-violet-100 text-violet-600"
                    : "bg-pink-100 text-pink-500"
                }`}
              >
                {isBottle ? "\uD83C\uDF7C" : "\uD83E\uDD31"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {isBottle
                    ? `Bottle - ${f.amount_ml}ml`
                    : `Breast Snack - ${f.duration_minutes}min`}
                </div>
                <div className="text-xs text-gray-400">
                  {format(entry.time, "h:mm a")}
                </div>
              </div>
              <button
                onClick={() => onDeleteFeeding(f.id)}
                className="text-gray-300 hover:text-red-400 text-sm px-2"
              >
                &times;
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
          return (
            <div
              key={`d-${d.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-lg">
                {emoji}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Diaper - {label}</div>
                <div className="text-xs text-gray-400">
                  {format(entry.time, "h:mm a")}
                </div>
              </div>
              <button
                onClick={() => onDeleteDiaper(d.id)}
                className="text-gray-300 hover:text-red-400 text-sm px-2"
              >
                &times;
              </button>
            </div>
          );
        }
      })}
    </div>
  );
}
