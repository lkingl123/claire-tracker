import { NextRequest, NextResponse } from "next/server";
import { deleteLastNap, formatMinutesSpoken, logNap, napMinutes, statusSpeech } from "@/lib/naps";
import { parseMinutes } from "@/lib/parseMinutes";

// Siri Shortcut endpoint. Returns plain text so Siri can speak it directly.
function say(text: string) {
  return new NextResponse(text, { headers: { "Content-Type": "text/plain" } });
}

const has = (text: string, words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`).test(text));

async function handleSpeak(raw: string) {
  const text = raw.toLowerCase().trim();

  if (has(text, ["undo", "cancel", "delete last"])) {
    const removed = await deleteLastNap();
    return say(removed ? `Undone! Removed the last nap, ${formatMinutesSpoken(napMinutes(removed))}.` : "Nothing to undo.");
  }

  if (has(text, ["status", "summary", "how", "last"])) {
    return say(await statusSpeech());
  }

  const minutes = parseMinutes(text);
  if (minutes && minutes > 0 && minutes <= 300) {
    const { error } = await logNap(minutes);
    if (error) return say("Sorry, I couldn't log that nap.");
    return say(`Done! Logged a nap of ${formatMinutesSpoken(minutes)}.`);
  }

  if (has(text, ["nap", "sleep", "slept"])) {
    return say("How long? Say nap followed by the minutes, like nap 45.");
  }

  return say(`I heard ${raw}. Try: nap 45, status, or undo.`);
}

// GET /api/speak?q=nap+45
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handleSpeak(searchParams.get("q") || "");
}

// POST /api/speak  body: { q: "nap 45" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handleSpeak(body.q || "");
  } catch {
    return handleSpeak(await request.text());
  }
}
