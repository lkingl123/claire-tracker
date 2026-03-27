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

// Step 1: Parse command and return what would be logged
// POST { q: "bottle 30" }
// Returns: { speech: "Log a 30ml bottle feed? Say yes to confirm.", preview: "bottle 30" }
//
// Step 2: Confirm and log
// POST { q: "yes", confirm: "bottle 30" }
// Returns: { speech: "Done! Logged 30ml bottle feed." }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const q = (body.q || "").toLowerCase().trim();
    const confirmCmd = body.confirm || "";

    // STEP 2: User said yes/no to confirm a previous command
    if (confirmCmd) {
      if (
        q.includes("yes") ||
        q.includes("yeah") ||
        q.includes("yep") ||
        q.includes("sure") ||
        q.includes("confirm") ||
        q.includes("do it")
      ) {
        return await executeCommand(confirmCmd);
      }
      return NextResponse.json({
        speech: "Cancelled. Nothing was logged.",
        done: true,
      });
    }

    // STEP 1: Parse the command
    const text = wordToNumber(q);

    // Status — no confirmation needed, just return
    if (
      text.includes("status") ||
      text.includes("summary") ||
      text.includes("how is") ||
      text.includes("how's")
    ) {
      return await getStatus();
    }

    // Last feed — no confirmation needed
    if (
      text.includes("last") ||
      text.includes("when") ||
      text.includes("ago")
    ) {
      return await getLastFeed();
    }

    // Bottle
    const bottleMatch = text.match(
      /(?:bottle|fed|feed)\s*(\d+)|(\d+)\s*(?:ml|milliliter|ounce)/
    );
    if (bottleMatch) {
      let ml = parseInt(bottleMatch[1] || bottleMatch[2]);
      if (ml <= 10) ml = Math.round(ml * 29.5735);
      return NextResponse.json({
        speech: `Log a ${ml} ml bottle feed? Say yes to confirm.`,
        preview: `bottle ${ml}`,
        needsConfirm: true,
      });
    }
    if (text === "bottle" || text === "fed" || text === "feed") {
      return NextResponse.json({
        speech:
          "How many ml? Say bottle followed by a number, like bottle 30.",
        done: true,
      });
    }

    // Snack
    const snackMatch = text.match(/snack\s*(\d+)|(\d+)\s*ml.*snack/);
    if (snackMatch) {
      const ml = parseInt(snackMatch[1] || snackMatch[2]);
      return NextResponse.json({
        speech: `Log a ${ml} ml breast snack? Say yes to confirm.`,
        preview: `snack ${ml}`,
        needsConfirm: true,
      });
    }
    if (text.includes("snack") || text.includes("breast")) {
      return NextResponse.json({
        speech: "How many ml? Say snack followed by a number, like snack 30.",
        done: true,
      });
    }

    // Diaper
    let diaperType: string | null = null;
    if (text.includes("wet") && text.includes("dirty")) diaperType = "both";
    else if (text.includes("both")) diaperType = "both";
    else if (text.includes("wet")) diaperType = "wet";
    else if (text.includes("dirty") || text.includes("poop"))
      diaperType = "dirty";
    else if (text === "diaper" || text === "diaper change")
      diaperType = "both";

    if (diaperType) {
      return NextResponse.json({
        speech: `Log a ${diaperType} diaper? Say yes to confirm.`,
        preview: `diaper ${diaperType}`,
        needsConfirm: true,
      });
    }

    return NextResponse.json({
      speech: `I heard "${body.q}". Try: bottle 30, snack 5, wet diaper, status, or last feed.`,
      done: true,
    });
  } catch {
    return NextResponse.json({ speech: "Something went wrong.", done: true });
  }
}

// Execute the confirmed command
async function executeCommand(cmd: string): Promise<NextResponse> {
  const text = cmd.toLowerCase().trim();

  // Bottle
  const bottleMatch = text.match(/bottle\s*(\d+)/);
  if (bottleMatch) {
    const ml = parseInt(bottleMatch[1]);
    const { error } = await supabase.from("feedings").insert({
      type: "bottle",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error)
      return NextResponse.json({ speech: "Failed to log feed.", done: true });
    return NextResponse.json({
      speech: `Done! Logged ${ml} ml, ${mlToOz(ml)} ounce bottle feed.`,
      done: true,
    });
  }

  // Snack
  const snackMatch = text.match(/snack\s*(\d+)/);
  if (snackMatch) {
    const ml = parseInt(snackMatch[1]);
    const { error } = await supabase.from("feedings").insert({
      type: "breast_snack",
      amount_ml: ml,
      fed_at: new Date().toISOString(),
    });
    if (error)
      return NextResponse.json({ speech: "Failed to log snack.", done: true });
    return NextResponse.json({
      speech: `Done! Logged ${ml} ml breast snack.`,
      done: true,
    });
  }

  // Diaper
  const diaperMatch = text.match(/diaper\s*(wet|dirty|both)/);
  if (diaperMatch) {
    const type = diaperMatch[1];
    const { error } = await supabase.from("diapers").insert({
      type,
      changed_at: new Date().toISOString(),
    });
    if (error)
      return NextResponse.json({
        speech: "Failed to log diaper.",
        done: true,
      });
    return NextResponse.json({
      speech: `Done! Logged ${type} diaper.`,
      done: true,
    });
  }

  return NextResponse.json({ speech: "Something went wrong.", done: true });
}

async function getLastFeed(): Promise<NextResponse> {
  const { data } = await supabase
    .from("feedings")
    .select("*")
    .order("fed_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return NextResponse.json({ speech: "No feeds logged yet.", done: true });
  }

  const last = data[0];
  const minAgo =
    (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);
  const warning = minAgo >= 150 ? " She needs to eat soon!" : "";

  if (last.type === "bottle") {
    return NextResponse.json({
      speech: `Last feed was a ${last.amount_ml} ml bottle, ${formatMinutes(minAgo)} ago.${warning}`,
      done: true,
    });
  }
  return NextResponse.json({
    speech: `Last was a ${last.amount_ml} ml breast snack, ${formatMinutes(minAgo)} ago.${warning}`,
    done: true,
  });
}

async function getStatus(): Promise<NextResponse> {
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

  return NextResponse.json({ speech, done: true });
}
