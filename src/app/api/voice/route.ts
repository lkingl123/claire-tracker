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

// Convert word numbers to digits
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
  // Sort by length desc so "twenty five" matches before "twenty"
  for (const [word, num] of Object.entries(words).sort((a, b) => b[0].length - a[0].length)) {
    result = result.replace(new RegExp(word, "gi"), num);
  }
  return result;
}

function parseCommand(input: string): {
  action: string;
  value?: number;
  type?: string;
} | null {
  // Convert word numbers to digits first
  const text = wordToNumber(input.toLowerCase().trim());

  // Bottle: "bottle 60", "60 ml bottle", "60ml", "bottle", "fed 60"
  const bottleMatch = text.match(
    /(?:bottle|fed|feed)\s*(\d+)|(\d+)\s*(?:ml|milliliter|ounce)/
  );
  if (bottleMatch) {
    let ml = parseInt(bottleMatch[1] || bottleMatch[2]);
    // If small number, probably ounces
    if (ml <= 10) ml = Math.round(ml * 29.5735);
    return { action: "bottle", value: ml };
  }
  // Bottle without number — ask them to specify
  if (text === "bottle" || text === "fed" || text === "feed") {
    return { action: "bottle_no_amount" };
  }

  // Snack: "snack 5", "snack", "breast snack"
  const snackMatch = text.match(/snack\s*(\d+)|(\d+)\s*min.*snack/);
  if (snackMatch) {
    return { action: "snack", value: parseInt(snackMatch[1] || snackMatch[2]) };
  }
  if (text.includes("snack") || text.includes("breast")) {
    return { action: "snack", value: 5 };
  }

  // Diaper: "wet diaper", "dirty", "both diaper", "diaper wet"
  if (text.includes("wet") && text.includes("dirty")) {
    return { action: "diaper", type: "both" };
  }
  if (text.includes("both")) {
    return { action: "diaper", type: "both" };
  }
  if (text.includes("wet")) {
    return { action: "diaper", type: "wet" };
  }
  if (text.includes("dirty") || text.includes("poop")) {
    return { action: "diaper", type: "dirty" };
  }
  if (text === "diaper" || text === "diaper change") {
    return { action: "diaper", type: "both" };
  }

  // Status
  if (
    text.includes("status") ||
    text.includes("summary") ||
    text.includes("how is") ||
    text.includes("how's")
  ) {
    return { action: "status" };
  }

  // Last feed
  if (
    text.includes("last") ||
    text.includes("when") ||
    text.includes("ago")
  ) {
    return { action: "last" };
  }

  return null;
}

async function handleVoice(q: string) {

  if (!q) {
    return NextResponse.json({
      speech:
        "Command not recognized. Say something like: bottle 60, snack 5, wet diaper, status, or last feed.",
      error: true,
    });
  }

  const parsed = parseCommand(q);

  if (!parsed) {
    return NextResponse.json({
      speech: `Command not recognized. I heard "${q}". Try saying: bottle 60, snack 5, wet diaper, dirty diaper, status, or last feed.`,
      error: true,
    });
  }

  // Bottle without amount
  if (parsed.action === "bottle_no_amount") {
    return NextResponse.json({
      speech: "How many ml? Say bottle followed by a number, like bottle 30 or bottle 60.",
      error: true,
    });
  }

  // Bottle
  if (parsed.action === "bottle") {
    const ml = parsed.value || 60;
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log feed." });
    return NextResponse.json({
      speech: `Logged ${ml} ml, ${mlToOz(ml)} ounce bottle feed for Claire.`,
    });
  }

  // Snack
  if (parsed.action === "snack") {
    const min = parsed.value || 5;
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      duration_minutes: min,
      fed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log snack." });
    return NextResponse.json({
      speech: `Logged ${min} minute breast snack for Claire.`,
    });
  }

  // Diaper
  if (parsed.action === "diaper") {
    const type = parsed.type || "both";
    const { error } = await supabase.from("diapers").insert({
      type,
      changed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ speech: "Failed to log diaper." });
    return NextResponse.json({ speech: `Logged ${type} diaper for Claire.` });
  }

  // Last feed
  if (parsed.action === "last") {
    const { data } = await supabase
      .from("feedings")
      .select("*")
      .order("fed_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return NextResponse.json({ speech: "No feeds logged yet." });
    }

    const last = data[0];
    const minAgo =
      (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);
    const warning = minAgo >= 150 ? " She needs to eat soon!" : "";

    if (last.type === "bottle") {
      return NextResponse.json({
        speech: `Last feed was a ${last.amount_ml} ml bottle, ${formatMinutes(minAgo)} ago.${warning}`,
      });
    }
    return NextResponse.json({
      speech: `Last was a ${last.duration_minutes} minute snack, ${formatMinutes(minAgo)} ago.${warning}`,
    });
  }

  // Status
  if (parsed.action === "status") {
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
    const wet = diapers.filter(
      (d) => d.type === "wet" || d.type === "both"
    ).length;
    const dirty = diapers.filter(
      (d) => d.type === "dirty" || d.type === "both"
    ).length;

    let speech = `Today: ${bottles.length} bottles totaling ${totalMl} ml, ${mlToOz(totalMl)} ounces.`;
    speech += ` ${wet} wet and ${dirty} dirty diapers.`;

    if (feedings.length > 0) {
      const minAgo =
        (Date.now() - new Date(feedings[0].fed_at).getTime()) / (1000 * 60);
      speech += ` Last feed ${formatMinutes(minAgo)} ago.`;
      if (minAgo >= 150) speech += " She needs to eat soon!";
    }

    return NextResponse.json({ speech });
  }

  return NextResponse.json({ speech: "Something went wrong." });
}

// GET /api/voice?q=bottle 60
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  return handleVoice(q);
}

// POST /api/voice  body: { q: "bottle 60" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const q = body.q || body.text || body.command || "";
    return handleVoice(q);
  } catch {
    // Handle form-encoded or plain text
    const text = await request.text();
    return handleVoice(text);
  }
}
