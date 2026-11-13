import { NextResponse } from "next/server";
import { dayKey, fetchRecentNaps, napMinutes, napsForDay, totalMinutes } from "@/lib/naps";

export const dynamic = "force-dynamic";

// GET /api/status - today's naps as JSON
export async function GET() {
  const naps = await fetchRecentNaps();
  const today = napsForDay(naps, dayKey());
  const last = naps[0] || null;

  return NextResponse.json({
    today: { napCount: today.length, totalMinutes: totalMinutes(today) },
    lastNap: last && {
      minutes: napMinutes(last),
      endedAt: last.ended_at,
      awakeMinutes: Math.round((Date.now() - new Date(last.ended_at).getTime()) / 60000),
    },
  });
}
