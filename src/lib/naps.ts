import { format, subMinutes } from "date-fns";
import { supabase } from "./supabase";
import { Nap } from "./types";

// Claire's birthday: March 21, 2026
export const BIRTHDAY = new Date(2026, 2, 21);

// ---------- Pure helpers (safe on client + server) ----------

// The server runs in UTC, so day logic uses Claire's time zone.
const TZ = "America/Denver";
function local(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: TZ }));
}

export function napMinutes(n: Nap): number {
  return Math.round((new Date(n.ended_at).getTime() - new Date(n.started_at).getTime()) / 60000);
}

// "45 min" or "2h 15m"
export function formatMinutes(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// "45 minutes" / "2 hours and 15 minutes" for Siri / Alexa
export function formatMinutesSpoken(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total} minute${total !== 1 ? "s" : ""}`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hours = `${h} hour${h !== 1 ? "s" : ""}`;
  return m > 0 ? `${hours} and ${m} minute${m !== 1 ? "s" : ""}` : hours;
}

export function dayKey(date: Date = new Date()): string {
  return format(local(date), "yyyy-MM-dd");
}

export function napDayKey(n: Nap): string {
  return dayKey(new Date(n.started_at));
}

export function napsForDay(naps: Nap[], key: string): Nap[] {
  return naps.filter((n) => napDayKey(n) === key);
}

export function totalMinutes(naps: Nap[]): number {
  return naps.reduce((sum, n) => sum + napMinutes(n), 0);
}

export function ageLabel(now: Date = new Date()): string {
  const months =
    (now.getFullYear() - BIRTHDAY.getFullYear()) * 12 +
    (now.getMonth() - BIRTHDAY.getMonth()) -
    (now.getDate() < BIRTHDAY.getDate() ? 1 : 0);
  return `${months} month${months !== 1 ? "s" : ""}`;
}

// Date + time from the form inputs. Inputs are "" while half-typed, so this can be null.
export function parseWokeAt(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return isNaN(d.getTime()) ? null : d;
}

// Row to insert/update for a nap of `minutes` that ended at `wokeAt`
export function napRow(minutes: number, wokeAt: Date = new Date()) {
  return {
    kind: "nap",
    started_at: subMinutes(wokeAt, minutes).toISOString(),
    ended_at: wokeAt.toISOString(),
  };
}

// ---------- Database ----------

export async function fetchRecentNaps(limit = 50): Promise<Nap[]> {
  const { data } = await supabase
    .from("sleeps")
    .select("*")
    .eq("kind", "nap")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data || []) as Nap[];
}

export async function logNap(minutes: number, wokeAt: Date = new Date()) {
  return supabase.from("sleeps").insert(napRow(minutes, wokeAt));
}

export async function deleteLastNap(): Promise<Nap | null> {
  const { data } = await supabase
    .from("sleeps")
    .select("*")
    .eq("kind", "nap")
    .order("created_at", { ascending: false })
    .limit(1);
  const last = data?.[0] as Nap | undefined;
  if (!last) return null;
  await supabase.from("sleeps").delete().eq("id", last.id);
  return last;
}

// One-sentence status used by Siri and Alexa.
export async function statusSpeech(): Promise<string> {
  const naps = await fetchRecentNaps();
  const today = napsForDay(naps, dayKey());
  if (today.length === 0) return "No naps logged today.";
  const total = totalMinutes(today);
  const last = today[0];
  const awakeMin = (Date.now() - new Date(last.ended_at).getTime()) / 60000;
  return `Claire has had ${today.length} nap${today.length !== 1 ? "s" : ""} today, ${formatMinutesSpoken(total)} total. Her last nap was ${formatMinutesSpoken(napMinutes(last))}, and she's been awake for ${formatMinutesSpoken(awakeMin)}.`;
}
