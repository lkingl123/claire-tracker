import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(1);
}

function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} minutes`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// GET /api/quick?action=status
// GET /api/quick?action=bottle&ml=60
// GET /api/quick?action=snack&min=5
// GET /api/quick?action=diaper&type=wet|dirty|both
// GET /api/quick?action=last
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Log bottle feed
  if (action === "bottle") {
    const ml = parseInt(searchParams.get("ml") || "60");
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log feed." });
    return NextResponse.json({
      speech: `Logged ${ml}ml (${mlToOz(ml)}oz) bottle feed for Claire.`,
    });
  }

  // Log breast snack
  if (action === "snack") {
    const min = parseInt(searchParams.get("min") || "5");
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      amount_ml: min,
      fed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log snack." });
    return NextResponse.json({
      speech: `Logged ${min} minute breast snack for Claire.`,
    });
  }

  // Log diaper
  if (action === "diaper") {
    const type = searchParams.get("type") || "both";
    const { error } = await supabase.from("diapers").insert({
      type,
      changed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log diaper." });
    return NextResponse.json({ speech: `Logged ${type} diaper for Claire.` });
  }

  // Last feed
  if (action === "last") {
    const { data } = await supabase
      .from("feedings")
      .select("*")
      .order("fed_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return NextResponse.json({ speech: "No feeds logged yet today." });
    }

    const last = data[0];
    const minAgo =
      (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);

    if (last.type === "bottle") {
      const warning = minAgo >= 150 ? " She probably needs to eat soon!" : "";
      return NextResponse.json({
        speech: `Last feed was a ${last.amount_ml}ml (${mlToOz(last.amount_ml)}oz) bottle, ${formatMinutes(minAgo)} ago.${warning}`,
      });
    } else {
      const warning = minAgo >= 150 ? " She probably needs a full feed soon!" : "";
      return NextResponse.json({
        speech: `Last was a ${last.amount_ml} ml breast snack, ${formatMinutes(minAgo)} ago.${warning}`,
      });
    }
  }

  // Full status
  if (action === "status") {
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
        .gte("changed_at", todayStart.toISOString()),
    ]);

    const feedings = feedRes.data || [];
    const diapers = diaperRes.data || [];
    const bottles = feedings.filter((f) => f.type === "bottle");
    const totalMl = bottles.reduce((s, f) => s + (f.amount_ml || 0), 0);
    const snacks = feedings.filter((f) => f.type === "breast_snack");
    const wet = diapers.filter(
      (d) => d.type === "wet" || d.type === "both"
    ).length;
    const dirty = diapers.filter(
      (d) => d.type === "dirty" || d.type === "both"
    ).length;

    let speech = `Today: ${bottles.length} bottles, ${totalMl}ml (${mlToOz(totalMl)}oz).`;
    if (snacks.length > 0) speech += ` ${snacks.length} snacks.`;
    speech += ` Diapers: ${wet} wet, ${dirty} dirty, ${diapers.length} total.`;

    if (feedings.length > 0) {
      const minAgo =
        (Date.now() - new Date(feedings[0].fed_at).getTime()) / (1000 * 60);
      speech += ` Last feed ${formatMinutes(minAgo)} ago.`;
      if (minAgo >= 150) speech += " She needs to eat soon!";
    }

    return NextResponse.json({ speech });
  }

  return NextResponse.json({
    speech: "Unknown action. Use: bottle, snack, diaper, last, or status.",
  });
}
