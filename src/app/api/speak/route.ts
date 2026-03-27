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
  return m > 0 ? `${h} hours and ${m} minutes` : `${h} hours`;
}

function wordToNumber(text: string): string {
  const words: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    fifteen: "15", twenty: "20", "twenty five": "25", thirty: "30",
    "thirty five": "35", forty: "40", "forty five": "45", fifty: "50",
    sixty: "60", seventy: "70", "seventy five": "75", eighty: "80",
    ninety: "90", hundred: "100",
  };
  let result = text;
  for (const [word, num] of Object.entries(words).sort(
    (a, b) => b[0].length - a[0].length
  )) {
    result = result.replace(new RegExp(word, "gi"), num);
  }
  return result;
}

// Ultra simple: GET /api/speak?q=bottle+30
// Returns plain text response (not JSON) - Siri can speak it directly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") || "";
  const text = wordToNumber(raw.toLowerCase().trim());

  // Status
  if (
    text.includes("status") ||
    text.includes("summary") ||
    text.includes("how")
  ) {
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
    const snackMl = feedings
      .filter((f) => f.type === "breast_snack")
      .reduce((s, f) => s + (f.amount_ml || 0), 0);
    const wet = diapers.filter(
      (d) => d.type === "wet" || d.type === "both"
    ).length;
    const dirty = diapers.filter(
      (d) => d.type === "dirty" || d.type === "both"
    ).length;
    let speech = `Today: ${bottles.length} bottles, ${totalMl} ml.`;
    if (snackMl > 0) speech += ` Plus ${snackMl} ml in snacks.`;
    speech += ` ${wet} wet and ${dirty} dirty diapers.`;
    if (feedings.length > 0) {
      const minAgo =
        (Date.now() - new Date(feedings[0].fed_at).getTime()) / (1000 * 60);
      speech += ` Last feed ${formatMinutes(minAgo)} ago.`;
      if (minAgo >= 150) speech += " She needs to eat soon!";
    }
    return new NextResponse(speech, { headers: { "Content-Type": "text/plain" } });
  }

  // Last feed
  if (text.includes("last") || text.includes("when") || text.includes("ago")) {
    const { data } = await supabase
      .from("feedings")
      .select("*")
      .order("fed_at", { ascending: false })
      .limit(1);
    if (!data || data.length === 0) {
      return new NextResponse("No feeds logged yet.", {
        headers: { "Content-Type": "text/plain" },
      });
    }
    const last = data[0];
    const minAgo =
      (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);
    const warning = minAgo >= 150 ? " She needs to eat soon!" : "";
    const speech =
      last.type === "bottle"
        ? `Last feed was a ${last.amount_ml} ml bottle, ${formatMinutes(minAgo)} ago.${warning}`
        : `Last was a ${last.amount_ml} ml snack, ${formatMinutes(minAgo)} ago.${warning}`;
    return new NextResponse(speech, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Bottle
  const bottleMatch = text.match(
    /(?:bottle|fed|feed)\s*(\d+)|(\d+)\s*(?:ml|milliliter)/
  );
  if (bottleMatch) {
    let ml = parseInt(bottleMatch[1] || bottleMatch[2]);
    if (ml <= 10) ml = Math.round(ml * 29.5735);
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error)
      return new NextResponse("Failed to log feed.", {
        headers: { "Content-Type": "text/plain" },
      });
    return new NextResponse(
      `Done! Logged ${ml} ml, ${mlToOz(ml)} ounce bottle feed.`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }
  if (text === "bottle" || text === "fed" || text === "feed") {
    return new NextResponse(
      "How many ml? Say bottle followed by a number, like bottle 30.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Snack
  const snackMatch = text.match(/snack\s*(\d+)|(\d+)\s*ml.*snack/);
  if (snackMatch) {
    const ml = parseInt(snackMatch[1] || snackMatch[2]);
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error)
      return new NextResponse("Failed to log snack.", {
        headers: { "Content-Type": "text/plain" },
      });
    return new NextResponse(
      `Done! Logged ${ml} ml breast snack.`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }
  if (text.includes("snack") || text.includes("breast")) {
    return new NextResponse(
      "How many ml? Say snack followed by a number, like snack 30.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Diaper
  let diaperType: string | null = null;
  if (text.includes("wet") && text.includes("dirty")) diaperType = "both";
  else if (text.includes("both")) diaperType = "both";
  else if (text.includes("wet")) diaperType = "wet";
  else if (text.includes("dirty") || text.includes("poop"))
    diaperType = "dirty";
  else if (text === "diaper" || text === "diaper change") diaperType = "both";

  if (diaperType) {
    const { error } = await supabase.from("diapers").insert({
      type: diaperType,
      changed_at: new Date().toISOString(),
    });
    if (error)
      return new NextResponse("Failed to log diaper.", {
        headers: { "Content-Type": "text/plain" },
      });
    return new NextResponse(`Done! Logged ${diaperType} diaper.`, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse(
    `I heard ${raw}. Try: bottle 30, snack 30, wet diaper, status, or last feed.`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
