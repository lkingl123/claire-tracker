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

export default function Dashboard({ feedings, diapers }: Props) {
  const progress = getFeedingProgress(feedings);
  const nextFeed = predictNextFeed(feedings);

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
              {progress.totalMl}
              <span className="text-lg font-semibold text-brown-lighter ml-1">
                ml
              </span>
              <span className="text-sm font-semibold text-brown-lighter/50 ml-2">
                ({mlToOz(progress.totalMl)} oz)
              </span>
            </div>
            <div className="text-sm text-brown-lighter mt-1">
              {todayBottleFeeds} bottle{todayBottleFeeds !== 1 ? "s" : ""}
              {todaySnacks > 0 &&
                ` + ${todaySnacks} snack${todaySnacks !== 1 ? "s" : ""}`}
            </div>
          </div>
          <div className="text-right">
            {progress.lastFeedTime ? (
              <div className="space-y-1">
                <div className="inline-block bg-peach/40 text-brown-light text-sm font-semibold px-3 py-1 rounded-full">
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

        {progress.snackMinutes > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-blush/20 rounded-full px-3 py-1.5 w-fit">
            <span className="text-sm">{"\uD83E\uDD31"}</span>
            <span className="text-xs font-semibold text-brown-light">
              {progress.snackMinutes} min snacking today
            </span>
          </div>
        )}
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
