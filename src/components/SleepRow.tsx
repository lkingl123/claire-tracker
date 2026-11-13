"use client";

import { format } from "date-fns";
import { Sleep } from "@/lib/types";
import { durationMin, formatDuration } from "@/lib/sleep";

interface Props {
  sleep: Sleep;
  now: Date;
  onEdit?: (s: Sleep) => void;
  onDelete?: (id: string) => void;
}

// One sleep entry: icon, "Nap · 1h 20m", "1:05 PM → 2:25 PM"
export default function SleepRow({ sleep, now, onEdit, onDelete }: Props) {
  const isNight = sleep.kind === "night";
  const start = format(new Date(sleep.started_at), "h:mm a");
  const end = sleep.ended_at ? format(new Date(sleep.ended_at), "h:mm a") : "now";

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)] ${
        onEdit ? "cursor-pointer active:scale-[0.99] transition-transform" : ""
      }`}
      onClick={() => onEdit?.(sleep)}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
          isNight ? "bg-lavender/40" : "bg-sky/30"
        }`}
      >
        {isNight ? "🌙" : "💤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-brown">
          {isNight ? "Night" : "Nap"} &middot; {formatDuration(durationMin(sleep, now))}
          {!sleep.ended_at && (
            <span className="ml-2 text-[10px] font-extrabold uppercase text-lavender bg-lavender-light px-2 py-0.5 rounded-full">
              sleeping
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-brown-lighter">
          {start} &rarr; {end}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sleep.id);
          }}
          className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-brown-lighter text-xs active:scale-90 transition-transform"
        >
          {"✕"}
        </button>
      )}
    </div>
  );
}
