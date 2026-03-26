import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(1);
}

export async function GET() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [feedRes, diaperRes] = await Promise.all([
    supabase
      .from("feedings")
      .select("*")
      .gte("fed_at", todayStart.toISOString())
      .order("fed_at", { ascending: false }),
    supabase
      .from("diapers")
      .select("*")
      .gte("changed_at", todayStart.toISOString())
      .order("changed_at", { ascending: false }),
  ]);

  const feedings = feedRes.data || [];
  const diapers = diaperRes.data || [];

  const bottles = feedings.filter((f) => f.type === "bottle");
  const snacks = feedings.filter((f) => f.type === "breast_snack");
  const totalMl = bottles.reduce((sum, f) => sum + (f.amount_ml || 0), 0);
  const totalSnackMin = snacks.reduce(
    (sum, f) => sum + (f.duration_minutes || 0),
    0
  );

  const lastFeed = feedings[0] || null;
  const minutesSinceLastFeed = lastFeed
    ? (Date.now() - new Date(lastFeed.fed_at).getTime()) / (1000 * 60)
    : null;

  const wetCount = diapers.filter(
    (d) => d.type === "wet" || d.type === "both"
  ).length;
  const dirtyCount = diapers.filter(
    (d) => d.type === "dirty" || d.type === "both"
  ).length;

  return NextResponse.json({
    feeding: {
      totalMl,
      totalOz: mlToOz(totalMl),
      bottleCount: bottles.length,
      snackCount: snacks.length,
      totalSnackMinutes: totalSnackMin,
      lastFeedAt: lastFeed?.fed_at || null,
      lastFeedType: lastFeed?.type || null,
      lastFeedMl: lastFeed?.amount_ml || null,
      minutesSinceLastFeed: minutesSinceLastFeed
        ? Math.round(minutesSinceLastFeed)
        : null,
      needsFeeding: minutesSinceLastFeed ? minutesSinceLastFeed >= 150 : true,
    },
    diapers: {
      wet: wetCount,
      dirty: dirtyCount,
      total: diapers.length,
    },
  });
}
