import { Feeding } from "./types";

// Calculate average time between feeds
export function getAverageFeedInterval(feedings: Feeding[]): number | null {
  if (feedings.length < 2) return null;

  const sorted = [...feedings].sort(
    (a, b) => new Date(b.fed_at).getTime() - new Date(a.fed_at).getTime()
  );

  // Use last 10 feeds to calculate average interval
  const recent = sorted.slice(0, 10);
  let totalInterval = 0;
  let count = 0;

  for (let i = 0; i < recent.length - 1; i++) {
    const diff =
      new Date(recent[i].fed_at).getTime() -
      new Date(recent[i + 1].fed_at).getTime();
    totalInterval += diff;
    count++;
  }

  if (count === 0) return null;
  return totalInterval / count; // in milliseconds
}

// Predict next feed time
export function predictNextFeed(feedings: Feeding[]): Date | null {
  if (feedings.length === 0) return null;

  const avgInterval = getAverageFeedInterval(feedings);
  const lastFeed = [...feedings].sort(
    (a, b) => new Date(b.fed_at).getTime() - new Date(a.fed_at).getTime()
  )[0];

  if (!lastFeed) return null;

  // Default to 2.5 hours if not enough data
  const interval = avgInterval || 2.5 * 60 * 60 * 1000;
  return new Date(new Date(lastFeed.fed_at).getTime() + interval);
}

// Get feeding progress - groups snacks + bottles within 30 min windows
export function getFeedingProgress(feedings: Feeding[]): {
  totalMl: number;
  snackMinutes: number;
  lastFeedTime: Date | null;
  timeSinceLastFeed: number | null; // in minutes
} {
  const now = new Date();
  const sorted = [...feedings].sort(
    (a, b) => new Date(b.fed_at).getTime() - new Date(a.fed_at).getTime()
  );

  const lastFeed = sorted[0];
  const lastFeedTime = lastFeed ? new Date(lastFeed.fed_at) : null;
  const timeSinceLastFeed = lastFeedTime
    ? (now.getTime() - lastFeedTime.getTime()) / (1000 * 60)
    : null;

  // Today's totals
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayFeedings = feedings.filter(
    (f) => new Date(f.fed_at) >= todayStart
  );

  const totalMl = todayFeedings
    .filter((f) => f.type === "bottle")
    .reduce((sum, f) => sum + (f.amount_ml || 0), 0);

  const snackMinutes = todayFeedings
    .filter((f) => f.type === "breast_snack")
    .reduce((sum, f) => sum + (f.duration_minutes || 0), 0);

  return { totalMl, snackMinutes, lastFeedTime, timeSinceLastFeed };
}

// Format time since last feed
export function formatTimeSince(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
}
