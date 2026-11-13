// Siri + Alexa routing, with the database mocked out.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  logNap: vi.fn(),
  deleteLastNap: vi.fn(),
  statusSpeech: vi.fn(),
}));
vi.mock("@/lib/naps", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/naps")>()),
  ...db,
}));

import { POST as speak, GET as speakGet } from "@/app/api/speak/route";
import { POST as alexa } from "@/app/api/alexa/route";

const ask = async (q: string) =>
  (await speak(
    new NextRequest("http://x/api/speak", { method: "POST", body: JSON.stringify({ q }) })
  )).text();

const alexaIntent = async (name: string, slots: Record<string, { value?: string }> = {}) => {
  const res = await alexa(
    new NextRequest("http://x/api/alexa", {
      method: "POST",
      body: JSON.stringify({ request: { type: "IntentRequest", intent: { name, slots } } }),
    })
  );
  return (await res.json()).response.outputSpeech.text as string;
};

beforeEach(() => {
  vi.clearAllMocks();
  db.logNap.mockResolvedValue({ error: null });
  db.statusSpeech.mockResolvedValue("STATUS");
  db.deleteLastNap.mockResolvedValue({
    id: "1",
    started_at: "2026-11-13T18:00:00Z",
    ended_at: "2026-11-13T18:45:00Z",
    notes: null,
    created_at: "2026-11-13T18:45:00Z",
  });
});

describe("Siri /api/speak", () => {
  it("'nap 45' logs a 45 minute nap", async () => {
    expect(await ask("nap 45")).toBe("Done! Logged a nap of 45 minutes.");
    expect(db.logNap).toHaveBeenCalledWith(45);
  });

  it("'nap 1 hour' logs 60", async () => {
    await ask("nap 1 hour");
    expect(db.logNap).toHaveBeenCalledWith(60);
  });

  it.each(["nap", "log a nap", "she had a nap"])("'%s' asks how long and logs nothing", async (q) => {
    expect(await ask(q)).toMatch(/How long/);
    expect(db.logNap).not.toHaveBeenCalled();
  });

  it("'status' reads the status", async () => {
    expect(await ask("status")).toBe("STATUS");
    expect(db.logNap).not.toHaveBeenCalled();
  });

  it("'how long has she been awake' is a status question, not a nap", async () => {
    expect(await ask("how long has she been awake")).toBe("STATUS");
  });

  it("'undo' removes the last nap", async () => {
    expect(await ask("undo")).toBe("Undone! Removed the last nap, 45 minutes.");
    expect(db.deleteLastNap).toHaveBeenCalled();
  });

  it("'undo' with nothing logged says so", async () => {
    db.deleteLastNap.mockResolvedValue(null);
    expect(await ask("undo")).toBe("Nothing to undo.");
  });

  it("rejects silly lengths (over 5 hours)", async () => {
    await ask("nap 900");
    expect(db.logNap).not.toHaveBeenCalled();
  });

  it("reports a DB failure instead of claiming success", async () => {
    db.logNap.mockResolvedValue({ error: { message: "boom" } });
    expect(await ask("nap 30")).toMatch(/couldn't/);
  });

  it("GET ?q= works too", async () => {
    await (await speakGet(new NextRequest("http://x/api/speak?q=nap%2030"))).text();
    expect(db.logNap).toHaveBeenCalledWith(30);
  });

  it("returns plain text (Siri speaks it directly)", async () => {
    const res = await speak(
      new NextRequest("http://x/api/speak", { method: "POST", body: JSON.stringify({ q: "status" }) })
    );
    expect(res.headers.get("content-type")).toContain("text/plain");
  });
});

describe("Alexa /api/alexa", () => {
  it("LogNapIntent with minutes", async () => {
    expect(await alexaIntent("LogNapIntent", { minutes: { value: "45" } })).toMatch(/45 minutes/);
    expect(db.logNap).toHaveBeenCalledWith(45);
  });

  it("LogNapIntent with hours + minutes", async () => {
    await alexaIntent("LogNapIntent", { hours: { value: "1" }, minutes: { value: "20" } });
    expect(db.logNap).toHaveBeenCalledWith(80);
  });

  it("LogNapIntent with no number asks instead of logging", async () => {
    expect(await alexaIntent("LogNapIntent", { minutes: {} })).toMatch(/How many minutes/);
    expect(db.logNap).not.toHaveBeenCalled();
  });

  it("NapStatusIntent and UndoIntent", async () => {
    expect(await alexaIntent("NapStatusIntent")).toBe("STATUS");
    expect(await alexaIntent("UndoIntent")).toMatch(/Undone/);
  });

  it("every intent in alexa-skill-model.json is handled", async () => {
    const model = (await import("../../alexa-skill-model.json")).default;
    const names: string[] = model.interactionModel.languageModel.intents.map(
      (i: { name: string }) => i.name
    );
    // FallbackIntent is Alexa's "I didn't catch that" - it should say so
    for (const name of names.filter((n) => n !== "AMAZON.FallbackIntent")) {
      const text = await alexaIntent(name, { minutes: { value: "30" } });
      expect(text, name).not.toMatch(/didn't understand/);
    }
  });
});
