import { describe, it, expect } from "vitest";
import {
  ageLabel,
  dayKey,
  formatMinutes,
  formatMinutesSpoken,
  napMinutes,
  napRow,
  napsForDay,
  parseWokeAt,
  totalMinutes,
} from "@/lib/naps";
import { Nap } from "@/lib/types";

function nap(startIso: string, endIso: string, id = startIso): Nap {
  return { id, started_at: startIso, ended_at: endIso, notes: null, created_at: endIso };
}

describe("formatMinutes", () => {
  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [59, "59 min"],
    [60, "1h"],
    [75, "1h 15m"],
    [135, "2h 15m"],
    [44.6, "45 min"],
  ])("%d -> %s", (min, text) => {
    expect(formatMinutes(min)).toBe(text);
  });
});

describe("formatMinutesSpoken", () => {
  it.each([
    [1, "1 minute"],
    [45, "45 minutes"],
    [60, "1 hour"],
    [61, "1 hour and 1 minute"],
    [150, "2 hours and 30 minutes"],
  ])("%d -> %s", (min, text) => {
    expect(formatMinutesSpoken(min)).toBe(text);
  });
});

describe("napRow / napMinutes", () => {
  it("stores a nap as ending at wake-up time and starting `minutes` earlier", () => {
    const woke = new Date("2026-11-13T20:00:00Z");
    const row = napRow(45, woke);
    expect(row).toEqual({
      kind: "nap",
      started_at: "2026-11-13T19:15:00.000Z",
      ended_at: "2026-11-13T20:00:00.000Z",
    });
    expect(napMinutes(nap(row.started_at, row.ended_at))).toBe(45);
  });

  it("round-trips odd lengths", () => {
    for (const m of [5, 37, 90, 125]) {
      const row = napRow(m, new Date("2026-11-13T18:00:00Z"));
      expect(napMinutes(nap(row.started_at, row.ended_at))).toBe(m);
    }
  });
});

describe("totalMinutes", () => {
  it("adds up nap lengths", () => {
    const naps = [
      nap("2026-11-13T16:00:00Z", "2026-11-13T16:45:00Z"),
      nap("2026-11-13T20:00:00Z", "2026-11-13T21:30:00Z"),
    ];
    expect(totalMinutes(naps)).toBe(135);
  });
  it("is 0 for no naps", () => {
    expect(totalMinutes([])).toBe(0);
  });
});

describe("ageLabel", () => {
  it("counts whole months from March 21, 2026", () => {
    expect(ageLabel(new Date(2026, 10, 13))).toBe("7 months");
    expect(ageLabel(new Date(2026, 10, 20))).toBe("7 months");
    expect(ageLabel(new Date(2026, 10, 21))).toBe("8 months");
    expect(ageLabel(new Date(2026, 3, 21))).toBe("1 month");
  });
});

describe("parseWokeAt", () => {
  it("combines date and time", () => {
    const d = parseWokeAt("2026-11-13", "13:05");
    expect(d).not.toBeNull();
    expect(d!.getHours()).toBe(13);
    expect(d!.getMinutes()).toBe(5);
  });
});

describe("napsForDay", () => {
  it("groups naps by the Mountain Time day they started", () => {
    const naps = [
      nap("2026-11-13T17:00:00Z", "2026-11-13T17:45:00Z", "today-a"), // 10:00 AM MT Nov 13
      nap("2026-11-13T21:00:00Z", "2026-11-13T22:00:00Z", "today-b"), // 2:00 PM MT Nov 13
      nap("2026-11-12T20:00:00Z", "2026-11-12T21:00:00Z", "yday"), //   1:00 PM MT Nov 12
    ];
    expect(napsForDay(naps, "2026-11-13").map((n) => n.id)).toEqual(["today-a", "today-b"]);
    expect(napsForDay(naps, "2026-11-12").map((n) => n.id)).toEqual(["yday"]);
    expect(napsForDay(naps, "2026-11-11")).toEqual([]);
  });

  it("dayKey formats as yyyy-MM-dd", () => {
    expect(dayKey(new Date("2026-11-13T18:00:00Z"))).toBe("2026-11-13");
  });
});
