import { describe, it, expect } from "vitest";
import { parseMinutes } from "@/lib/parseMinutes";

describe("parseMinutes", () => {
  it.each([
    ["nap 45", 45],
    ["nap 30 minutes", 30],
    ["she napped for 20 minutes", 20],
    ["nap forty five", 45],
    ["nap twenty five minutes", 25],
    ["nap 1 hour", 60],
    ["nap two hours", 120],
    ["nap an hour and a half", 90],
    ["nap 1 hour and a half", 90],
    ["nap 1 hour 20 minutes", 80],
    ["nap 1.5 hours", 90],
    ["NAP 45", 45],
  ])("%s -> %i", (input, expected) => {
    expect(parseMinutes(input)).toBe(expected);
  });

  it.each(["nap", "status", "undo", ""])("returns null when there is no number: %j", (input) => {
    expect(parseMinutes(input)).toBeNull();
  });
});
