"use client";

import { Feeding, Diaper } from "@/lib/types";
import {
  getFeedingProgress,
  predictNextFeed,
  formatTimeSince,
} from "@/lib/predictions";
import { format } from "date-fns";

interface Props {
  feedings: Feeding[];
  diapers: Diaper[];
}

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(1);
}

// Feed urgency thresholds (in minutes)
const FEED_OK = 120; // under 2h = green/good
const FEED_SOON = 150; // 2-2.5h = yellow/soon
// above 2.5h = red/overdue

function getFeedUrgency(minutesSinceLastFeed: number | null): {
  color: string;
  bg: string;
  label: string;
  pulse: boolean;
} {
  if (minutesSinceLastFeed === null)
    return { color: "text-brown-lighter", bg: "bg-white", label: "", pulse: false };

  if (minutesSinceLastFeed < FEED_OK)
    return {
      color: "text-green-700",
      bg: "bg-green-100",
      label: "All good",
      pulse: false,
    };
  if (minutesSinceLastFeed < FEED_SOON)
    return {
      color: "text-amber-700",
      bg: "bg-amber-100",
      label: "Feed soon",
      pulse: false,
    };
  return {
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Feed now!",
    pulse: true,
  };
}

export default function Dashboard({ feedings, diapers }: Props) {
  const progress = getFeedingProgress(feedings);
  const nextFeed = predictNextFeed(feedings);
  const urgency = getFeedUrgency(progress.timeSinceLastFeed);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayDiapers = diapers.filter(
    (d) => new Date(d.changed_at) >= todayStart
  );
  const wetCount = todayDiapers.filter(
    (d) => d.type === "wet" || d.type === "both"
  ).length;
  const dirtyCount = todayDiapers.filter(
    (d) => d.type === "dirty" || d.type === "both"
  ).length;

  const todayBottleFeeds = feedings.filter(
    (f) => f.type === "bottle" && new Date(f.fed_at) >= todayStart
  ).length;

  const todaySnacks = feedings.filter(
    (f) => f.type === "breast_snack" && new Date(f.fed_at) >= todayStart
  ).length;

  return (
    <div className="space-y-3">
      {/* Feed urgency banner */}
      {progress.lastFeedTime && progress.timeSinceLastFeed! >= FEED_OK && (
        <div
          className={`${urgency.bg} rounded-2xl p-4 flex items-center gap-3 ${urgency.pulse ? "animate-pulse" : ""}`}
        >
          <span className="text-2xl">
            {progress.timeSinceLastFeed! >= FEED_SOON
              ? "\u26A0\uFE0F"
              : "\u23F0"}
          </span>
          <div className="flex-1">
            <div className={`text-sm font-extrabold ${urgency.color}`}>
              {urgency.label}
            </div>
            <div className="text-xs font-medium text-brown-light">
              Last fed {formatTimeSince(progress.timeSinceLastFeed!)} &middot;
              Recommended every 2-3h
            </div>
          </div>
        </div>
      )}

      {/* Last feed status - hero card */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{"\uD83C\uDF7C"}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
            Feeding
          </span>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <div className="text-4xl font-extrabold text-brown">
              {progress.totalMl + progress.snackMl}
              <span className="text-lg font-semibold text-brown-lighter ml-1">
                ml
              </span>
              <span className="text-sm font-semibold text-brown-lighter/50 ml-2">
                ({mlToOz(progress.totalMl + progress.snackMl)} oz)
              </span>
            </div>
            <div className="text-sm text-brown-lighter mt-1">
              {todayBottleFeeds} bottle{todayBottleFeeds !== 1 ? "s" : ""}
              {todaySnacks > 0 &&
                ` + ${todaySnacks} snack${todaySnacks !== 1 ? "s" : ""}`}
              {" "}&middot; {progress.totalMl}ml bottles
              {progress.snackMl > 0 && ` + ${progress.snackMl}ml snacks`}
            </div>
          </div>
          <div className="text-right">
            {progress.lastFeedTime ? (
              <div className="space-y-1">
                <div
                  className={`inline-block ${urgency.bg} ${urgency.color} text-sm font-semibold px-3 py-1 rounded-full`}
                >
                  {formatTimeSince(progress.timeSinceLastFeed!)}
                </div>
                {nextFeed && (
                  <div className="text-xs text-brown-lighter">
                    Next ~{format(nextFeed, "h:mm a")}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-brown-lighter">No feeds yet</div>
            )}
          </div>
        </div>

        {/* Daily progress bar */}
        {(() => {
          // Claire's birthday: March 21, 2026
          const birthday = new Date(2026, 2, 21);
          const ageInDays = Math.floor(
            (Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24)
          );
          const ageWeeks = Math.floor(ageInDays / 7);
          const ageMonths = Math.floor(ageInDays / 30);

          // Recommended daily intake by age (ml)
          let dailyGoal: number;
          let ageLabel: string;
          if (ageInDays <= 2) {
            dailyGoal = 60;
            ageLabel = `Day ${ageInDays}`;
          } else if (ageInDays <= 7) {
            dailyGoal = 400;
            ageLabel = `Day ${ageInDays}`;
          } else if (ageInDays <= 14) {
            dailyGoal = 500;
            ageLabel = `${ageWeeks} week${ageWeeks !== 1 ? "s" : ""}`;
          } else if (ageInDays <= 30) {
            dailyGoal = 600;
            ageLabel = `${ageWeeks} weeks`;
          } else if (ageMonths <= 2) {
            dailyGoal = 700;
            ageLabel = `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
          } else if (ageMonths <= 4) {
            dailyGoal = 800;
            ageLabel = `${ageMonths} months`;
          } else if (ageMonths <= 6) {
            dailyGoal = 900;
            ageLabel = `${ageMonths} months`;
          } else {
            dailyGoal = 900;
            ageLabel = `${ageMonths} months`;
          }

          const totalIntake = progress.totalMl + progress.snackMl;
          const pct = Math.min((totalIntake / dailyGoal) * 100, 100);
          const barColor =
            pct >= 80
              ? "bg-green-400"
              : pct >= 50
                ? "bg-amber-300"
                : "bg-peach";
          return (
            <div className="mt-4">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-bold text-brown-lighter">
                  Daily Goal
                </span>
                <span className="text-xs font-bold text-brown">
                  {totalIntake} / {dailyGoal} ml
                  <span className="text-brown-lighter/50 ml-1">
                    ({mlToOz(totalIntake)} / {mlToOz(dailyGoal)} oz)
                  </span>
                </span>
              </div>
              <div className="w-full h-3 bg-cream-dark rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[10px] font-semibold text-brown-lighter/50 mt-1 flex justify-between">
                <span>Claire is {ageLabel} old</span>
                <span>{Math.round(pct)}% of recommended</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Diapers */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{"\uD83D\uDC76"}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-brown-lighter">
            Diapers
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-sky-dark">
              {wetCount}
            </span>
            <span className="text-sm font-medium text-brown-lighter">wet</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-sunny-dark">
              {dirtyCount}
            </span>
            <span className="text-sm font-medium text-brown-lighter">
              dirty
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 ml-auto">
            <span className="text-3xl font-extrabold text-brown-lighter">
              {todayDiapers.length}
            </span>
            <span className="text-sm font-medium text-brown-lighter">
              total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
