// Pull a nap length out of spoken text: "nap 45", "forty five minutes", "1 hour", "an hour and a half".
const WORDS: Record<string, number> = {
  five: 5, ten: 10, fifteen: 15, twenty: 20, "twenty five": 25, thirty: 30,
  "thirty five": 35, forty: 40, "forty five": 45, fifty: 50, "fifty five": 55,
  sixty: 60, ninety: 90, two: 2, three: 3,
};

export function parseMinutes(raw: string): number | null {
  // "a"/"an"/"one" only mean 1 before "hour" ("log a nap" must not become 1 minute)
  let text = raw.toLowerCase().replace(/\b(?:an?|one)\s+(?=hours?\b|hrs?\b)/g, "1 ");
  for (const [w, n] of Object.entries(WORDS).sort((a, b) => b[0].length - a[0].length)) {
    text = text.replace(new RegExp(`\\b${w}\\b`, "g"), String(n));
  }

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/);
  if (hours) {
    let min = parseFloat(hours[1]) * 60;
    if (/and (?:a |1 )?half/.test(text)) min += 30;
    const extra = text.match(/(?:hours?|hrs?)\s*(?:and\s*)?(\d+)\s*min/);
    if (extra) min += parseInt(extra[1]);
    return Math.round(min);
  }

  const num = text.match(/\d+/);
  return num ? parseInt(num[0]) : null;
}
