"use client";

import { format } from "date-fns";
import { Sleep, SleepKind } from "@/lib/types";
import {
  SLEEP_GOAL_HOURS,
  ageLabel,
  dayKey,
  durationMin,
  formatDuration,
  kindForTime,
  sleepsForDay,
  summarize,
} from "@/lib/sleep";

interface Props {
  sleeps: Sleep[]; // recent sleeps, newest first
  now: Date;
  onStart: (kind: SleepKind) => void;
  onWake: () => void;
}

export default function Dashboard({ sleeps, now, onStart, onWake }: Props) {
  const latest = sleeps[0];
  const active = latest && !latest.ended_at ? latest : null;
  const today = summarize(sleepsForDay(sleeps, dayKey(now)), now);
  const suggested = kindForTime(now);

  const goalMin = SLEEP_GOAL_HOURS.min * 60;
  const pct = Math.min((today.totalMin / goalMin) * 100, 100);
  const barColor = pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-amber-300" : "bg-lavender";

  return (
    <div className="space-y-3">
      {/* Hero: asleep / awake */}
      {active ? (
        <div className="bg-lavender-light rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{active.kind === "night" ? "🌙" : "💤"}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
              Asleep &middot; {active.kind === "night" ? "Night" : "Nap"}
            </span>
          </div>
          <div className="text-4xl font-extrabold text-brown">
            {formatDuration(durationMin(active, now))}
          </div>
          <div className="text-xs text-brown-lighter mt-1">
            Fell asleep at {format(new Date(active.started_at), "h:mm a")}
          </div>
          <button
            onClick={onWake}
            className="w-full mt-4 py-4 bg-sunny rounded-2xl text-lg font-extrabold text-brown active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(255,228,92,0.3)]"
          >
            {"☀️"} Woke up
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{"☀️"}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
              Awake
            </span>
          </div>
          {latest?.ended_at ? (
            <>
              <div className="text-4xl font-extrabold text-brown">
                {formatDuration((now.getTime() - new Date(latest.ended_at).getTime()) / 60000)}
              </div>
              <div className="text-xs text-brown-lighter mt-1">
                Woke up at {format(new Date(latest.ended_at), "h:mm a")}
              </div>
            </>
          ) : (
            <div className="text-sm text-brown-lighter">No sleep logged yet</div>
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => onStart("nap")}
              className={`py-4 rounded-2xl text-base font-extrabold text-brown active:scale-95 transition-transform ${
                suggested === "nap" ? "bg-lavender/60" : "bg-lavender-light"
              }`}
            >
              {"💤"} Nap
            </button>
            <button
              onClick={() => onStart("night")}
              className={`py-4 rounded-2xl text-base font-extrabold text-brown active:scale-95 transition-transform ${
                suggested === "night" ? "bg-lavender/60" : "bg-lavender-light"
              }`}
            >
              {"🌙"} Bedtime
            </button>
          </div>
        </div>
      )}

      {/* Today's totals */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{"🛏️"}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
            Today&apos;s Sleep
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={formatDuration(today.totalMin)} label="total" />
          <Stat value={formatDuration(today.nightMin)} label="last night" />
          <Stat
            value={formatDuration(today.napMin)}
            label={`${today.napCount} nap${today.napCount !== 1 ? "s" : ""}`}
          />
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs font-bold text-brown-lighter">Daily Goal</span>
            <span className="text-xs font-bold text-brown">
              {formatDuration(today.totalMin)} / {SLEEP_GOAL_HOURS.min}-{SLEEP_GOAL_HOURS.max}h
            </span>
          </div>
          <div className="w-full h-3 bg-cream-dark rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] font-semibold text-brown-lighter/50 mt-1 flex justify-between">
            <span>Claire is {ageLabel(now)} old</span>
            <span>{Math.round(pct)}% of recommended</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-brown">{value}</div>
      <div className="text-xs font-medium text-brown-lighter">{label}</div>
    </div>
  );
}
