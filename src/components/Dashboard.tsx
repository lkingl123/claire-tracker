"use client";

import { format } from "date-fns";
import { Nap } from "@/lib/types";
import { ageLabel, dayKey, formatMinutes, napsForDay, totalMinutes } from "@/lib/naps";

interface Props {
  naps: Nap[]; // recent naps, newest first
  now: Date;
  onLogNap: () => void;
}

export default function Dashboard({ naps, now, onLogNap }: Props) {
  const today = napsForDay(naps, dayKey(now));
  const last = naps[0];
  const awakeMin = last ? (now.getTime() - new Date(last.ended_at).getTime()) / 60000 : null;

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{"💤"}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
          Naps Today
        </span>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <div className="text-4xl font-extrabold text-brown">{formatMinutes(totalMinutes(today))}</div>
          <div className="text-xs text-brown-lighter mt-1">
            {today.length} nap{today.length !== 1 ? "s" : ""} &middot; Claire is {ageLabel(now)} old
          </div>
        </div>
        {last && awakeMin !== null && awakeMin >= 0 && (
          <div className="text-right">
            <div className="bg-sunny/40 text-brown text-sm font-semibold px-3 py-1.5 rounded-full">
              {"☀️"} Awake {formatMinutes(awakeMin)}
            </div>
            <div className="text-xs text-brown-lighter mt-1">
              since {format(new Date(last.ended_at), "h:mm a")}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onLogNap}
        className="w-full mt-5 py-5 bg-lavender/60 rounded-2xl text-lg font-extrabold text-brown active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(215,180,243,0.35)]"
      >
        {"💤"} Log a nap
      </button>
    </div>
  );
}
