import { addHours, format, startOfDay } from "date-fns";
import { supabase } from "./supabase";
import { Sleep, SleepKind } from "./types";

// Claire's birthday: March 21, 2026
export const BIRTHDAY = new Date(2026, 2, 21);

// Recommended total sleep per 24h (incl. naps) for 4-12 months (AASM)
export const SLEEP_GOAL_HOURS = { min: 12, max: 16 };

// ---------- Pure helpers (safe on client + server) ----------

// The server runs in UTC, so all day/clock logic uses Claire's time zone.
const TZ = "America/Denver";
function local(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: TZ }));
}

export function durationMin(s: Sleep, now: Date = new Date()): number {
  const end = s.ended_at ? new Date(s.ended_at) : now;
  return Math.max(0, (end.getTime() - new Date(s.started_at).getTime()) / 60000);
}

// "1h 12m" for the UI
export function formatDuration(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// "1 hour and 12 minutes" for Siri / Alexa
export function formatDurationSpoken(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total} minute${total !== 1 ? "s" : ""}`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hours = `${h} hour${h !== 1 ? "s" : ""}`;
  return m > 0 ? `${hours} and ${m} minute${m !== 1 ? "s" : ""}` : hours;
}

// Guess nap vs night from the clock: 7 PM - 6 AM counts as night.
export function kindForTime(date: Date = new Date()): SleepKind {
  const h = local(date).getHours();
  return h >= 19 || h < 6 ? "night" : "nap";
}

// Which day a sleep belongs to (yyyy-MM-dd).
// Naps belong to the day they start. Night sleep belongs to the morning it
// ends in, so bedtime at 7 PM on the 12th counts as the 13th's "last night".
export function sleepDayKey(s: Sleep): string {
  const start = local(new Date(s.started_at));
  const anchor = s.kind === "night" ? addHours(start, 12) : start;
  return format(startOfDay(anchor), "yyyy-MM-dd");
}

export function dayKey(date: Date = new Date()): string {
  return format(local(date), "yyyy-MM-dd");
}

export interface DaySummary {
  nightMin: number;
  napMin: number;
  napCount: number;
  totalMin: number;
}

export function summarize(sleeps: Sleep[], now: Date = new Date()): DaySummary {
  let nightMin = 0;
  let napMin = 0;
  let napCount = 0;
  for (const s of sleeps) {
    const d = durationMin(s, now);
    if (s.kind === "night") nightMin += d;
    else {
      napMin += d;
      napCount++;
    }
  }
  return { nightMin, napMin, napCount, totalMin: nightMin + napMin };
}

export function sleepsForDay(sleeps: Sleep[], key: string): Sleep[] {
  return sleeps.filter((s) => sleepDayKey(s) === key);
}

export function sortNewestFirst(sleeps: Sleep[]): Sleep[] {
  return [...sleeps].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

export function ageLabel(now: Date = new Date()): string {
  const months =
    (now.getFullYear() - BIRTHDAY.getFullYear()) * 12 +
    (now.getMonth() - BIRTHDAY.getMonth()) -
    (now.getDate() < BIRTHDAY.getDate() ? 1 : 0);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

// ---------- Database ----------

export async function fetchRecentSleeps(limit = 50): Promise<Sleep[]> {
  const { data } = await supabase
    .from("sleeps")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data || []) as Sleep[];
}

export async function getActiveSleep(): Promise<Sleep | null> {
  const { data } = await supabase
    .from("sleeps")
    .select("*")
    .is("ended_at", null)
    .limit(1);
  return (data?.[0] as Sleep) || null;
}

// Start a sleep. If one is already running, returns it instead of creating a second.
export async function startSleep(
  kind: SleepKind = kindForTime()
): Promise<{ sleep: Sleep | null; alreadyAsleep: boolean }> {
  const active = await getActiveSleep();
  if (active) return { sleep: active, alreadyAsleep: true };
  const { data } = await supabase
    .from("sleeps")
    .insert({ kind, started_at: new Date().toISOString() })
    .select()
    .single();
  return { sleep: (data as Sleep) || null, alreadyAsleep: false };
}

// End the running sleep (she woke up). Returns the finished sleep, or null if none was running.
export async function endSleep(): Promise<Sleep | null> {
  const active = await getActiveSleep();
  if (!active) return null;
  const { data } = await supabase
    .from("sleeps")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", active.id)
    .select()
    .single();
  return (data as Sleep) || null;
}

export async function deleteLastSleep(): Promise<Sleep | null> {
  const [last] = await fetchRecentSleeps(1);
  if (!last) return null;
  await supabase.from("sleeps").delete().eq("id", last.id);
  return last;
}

// One-sentence status used by Siri and Alexa.
export async function statusSpeech(): Promise<string> {
  const now = new Date();
  const sleeps = await fetchRecentSleeps();
  const today = summarize(sleepsForDay(sleeps, dayKey(now)), now);
  const latest = sleeps[0];

  let speech = "";
  if (!latest) return "No sleep logged yet.";
  if (!latest.ended_at) {
    speech = `Claire is asleep. She's been sleeping for ${formatDurationSpoken(durationMin(latest, now))}.`;
  } else {
    const awakeMin = (now.getTime() - new Date(latest.ended_at).getTime()) / 60000;
    speech = `Claire is awake. She's been up for ${formatDurationSpoken(awakeMin)}.`;
  }
  speech += ` Today: ${formatDurationSpoken(today.totalMin)} of sleep`;
  if (today.napCount > 0)
    speech += `, including ${today.napCount} nap${today.napCount !== 1 ? "s" : ""}`;
  return speech + ".";
}
