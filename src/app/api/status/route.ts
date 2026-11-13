import { NextResponse } from "next/server";
import { dayKey, durationMin, fetchRecentSleeps, sleepsForDay, summarize } from "@/lib/sleep";

export const dynamic = "force-dynamic";

// GET /api/status - today's sleep summary as JSON
export async function GET() {
  const now = new Date();
  const sleeps = await fetchRecentSleeps();
  const latest = sleeps[0] || null;
  const today = summarize(sleepsForDay(sleeps, dayKey(now)), now);

  return NextResponse.json({
    asleep: !!latest && !latest.ended_at,
    current: latest,
    currentMinutes: latest ? Math.round(
      latest.ended_at
        ? (now.getTime() - new Date(latest.ended_at).getTime()) / 60000 // awake for
        : durationMin(latest, now) // asleep for
    ) : null,
    today: {
      totalMinutes: Math.round(today.totalMin),
      nightMinutes: Math.round(today.nightMin),
      napMinutes: Math.round(today.napMin),
      napCount: today.napCount,
    },
  });
}
