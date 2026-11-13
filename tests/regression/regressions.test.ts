// Bugs that actually happened (or nearly shipped). Each test names the bug it guards against.
import { describe, it, expect } from "vitest";
import { dayKey, napsForDay, parseWokeAt } from "@/lib/naps";
import { parseMinutes } from "@/lib/parseMinutes";
import { Nap } from "@/lib/types";

describe("regression: add-nap form crashed while date/time was half-typed (2026-11-13)", () => {
  // Browsers report a half-typed <input type=date|time> as "". Formatting the resulting
  // Invalid Date threw a RangeError and took down the whole page in prod.
  it.each([
    ["", "13:05"],
    ["2026-11-13", ""],
    ["", ""],
    ["2026-13-45", "13:05"],
    ["2026-11-13", "99:99"],
  ])("parseWokeAt(%j, %j) is null instead of an Invalid Date", (date, time) => {
    expect(parseWokeAt(date, time)).toBeNull();
  });
});

describe("regression: server runs in UTC, Claire's day is Mountain Time", () => {
  it("tests are actually running in UTC (like Vercel)", () => {
    expect(new Date("2026-11-13T12:00:00Z").getTimezoneOffset()).toBe(0);
  });

  it("an evening nap at 6 PM MT counts for that day, not the next UTC day", () => {
    // 6:00 PM MT Nov 13 = 01:00 UTC Nov 14
    const evening: Nap = {
      id: "e",
      started_at: "2026-11-14T01:00:00Z",
      ended_at: "2026-11-14T01:30:00Z",
      notes: null,
      created_at: "2026-11-14T01:30:00Z",
    };
    expect(napsForDay([evening], "2026-11-13")).toHaveLength(1);
    expect(napsForDay([evening], "2026-11-14")).toHaveLength(0);
  });

  it("'today' at 9 PM MT is still the MT date", () => {
    // 9:00 PM MT Nov 13 = 04:00 UTC Nov 14
    expect(dayKey(new Date("2026-11-14T04:00:00Z"))).toBe("2026-11-13");
  });

  it("handles the DST switch (Mar 8 2026, MT goes UTC-7 -> UTC-6)", () => {
    expect(dayKey(new Date("2026-03-09T05:30:00Z"))).toBe("2026-03-08"); // 11:30 PM MDT
    expect(dayKey(new Date("2026-03-08T06:30:00Z"))).toBe("2026-03-07"); // 11:30 PM MST
  });
});

describe("regression: voice word matching", () => {
  it("'nap' with no number does not produce a length", () => {
    expect(parseMinutes("nap")).toBeNull();
  });

  it("'log a nap' is not a 1-minute nap (caught by this test before shipping, 2026-11-13)", () => {
    expect(parseMinutes("log a nap")).toBeNull();
    expect(parseMinutes("she had a nap")).toBeNull();
    expect(parseMinutes("one nap")).toBeNull();
  });

  it("'a hour' / 'one hour' still mean 60", () => {
    expect(parseMinutes("nap a hour")).toBe(60);
    expect(parseMinutes("nap one hour")).toBe(60);
  });

  it("'nap an hour' is 60, not 1 minute", () => {
    expect(parseMinutes("nap an hour")).toBe(60);
  });
});
