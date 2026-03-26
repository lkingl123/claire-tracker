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

export default function Dashboard({ feedings, diapers }: Props) {
  const progress = getFeedingProgress(feedings);
  const nextFeed = predictNextFeed(feedings);

  // Today's diaper count
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
      {/* Last feed + next prediction */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Feeding
        </div>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-bold text-violet-700">
              {progress.totalMl} ml
            </div>
            <div className="text-xs text-gray-500">
              {todayBottleFeeds} bottles today
              {todaySnacks > 0 && ` + ${todaySnacks} snacks`}
            </div>
          </div>
          <div className="text-right">
            {progress.lastFeedTime ? (
              <>
                <div className="text-sm font-medium">
                  Last: {formatTimeSince(progress.timeSinceLastFeed!)}
                </div>
                {nextFeed && (
                  <div className="text-xs text-violet-500">
                    Next ~{format(nextFeed, "h:mm a")}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">No feeds yet</div>
            )}
          </div>
        </div>
        {progress.snackMinutes > 0 && (
          <div className="mt-2 text-xs text-pink-500">
            + {progress.snackMinutes} min breast snacking today
          </div>
        )}
      </div>

      {/* Diapers */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
          Diapers Today
        </div>
        <div className="flex gap-6">
          <div>
            <span className="text-2xl font-bold text-blue-500">{wetCount}</span>
            <span className="text-sm text-gray-500 ml-1">wet</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-500">
              {dirtyCount}
            </span>
            <span className="text-sm text-gray-500 ml-1">dirty</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-400">
              {todayDiapers.length}
            </span>
            <span className="text-sm text-gray-500 ml-1">total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
