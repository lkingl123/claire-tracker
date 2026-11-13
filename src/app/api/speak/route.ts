import { NextRequest, NextResponse } from "next/server";
import { SleepKind } from "@/lib/types";
import {
  deleteLastSleep,
  durationMin,
  endSleep,
  formatDurationSpoken,
  kindForTime,
  startSleep,
  statusSpeech,
} from "@/lib/sleep";

// Siri Shortcut endpoint. Returns plain text so Siri can speak it directly.
function say(text: string) {
  return new NextResponse(text, { headers: { "Content-Type": "text/plain" } });
}

// Match at word starts so "up" doesn't hit "update" and "nap" doesn't hit "snap"
const has = (text: string, words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`).test(text));

async function handleSpeak(raw: string) {
  const text = raw.toLowerCase().trim();

  if (has(text, ["undo", "cancel", "delete last"])) {
    const removed = await deleteLastSleep();
    return say(removed ? `Undone! Removed the last ${removed.kind === "night" ? "night sleep" : "nap"}.` : "Nothing to undo.");
  }

  if (has(text, ["status", "summary", "how", "last"])) {
    return say(await statusSpeech());
  }

  // Check "awake" before "asleep" ("woke up" / "she's up" / "awake")
  if (has(text, ["awake", "woke", "wake", "up\\b"])) {
    const finished = await endSleep();
    if (!finished) return say("Claire wasn't marked as asleep.");
    return say(`Good morning! Claire slept for ${formatDurationSpoken(durationMin(finished))}.`);
  }

  if (has(text, ["asleep", "sleep", "nap", "bed", "night"])) {
    const kind: SleepKind = has(text, ["nap"])
      ? "nap"
      : has(text, ["bed", "night"])
        ? "night"
        : kindForTime();
    const { sleep, alreadyAsleep } = await startSleep(kind);
    if (alreadyAsleep && sleep)
      return say(`Claire is already asleep, for ${formatDurationSpoken(durationMin(sleep))} so far.`);
    if (!sleep) return say("Sorry, I couldn't log that.");
    return say(kind === "night" ? "Goodnight Claire! Bedtime logged." : "Nap started. Sweet dreams!");
  }

  return say(`I heard ${raw}. Try: nap, bedtime, woke up, status, or undo.`);
}

// GET /api/speak?q=nap
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handleSpeak(searchParams.get("q") || "");
}

// POST /api/speak  body: { q: "nap" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handleSpeak(body.q || "");
  } catch {
    return handleSpeak(await request.text());
  }
}
