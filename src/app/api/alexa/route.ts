import { NextRequest, NextResponse } from "next/server";
import {
  deleteLastSleep,
  durationMin,
  endSleep,
  formatDurationSpoken,
  kindForTime,
  startSleep,
  statusSpeech,
} from "@/lib/sleep";
import { SleepKind } from "@/lib/types";

function buildResponse(speech: string, shouldEnd: boolean = true) {
  return NextResponse.json({
    version: "1.0",
    sessionAttributes: {},
    response: {
      outputSpeech: { type: "PlainText", text: speech },
      shouldEndSession: shouldEnd,
    },
  });
}

async function handleStart(kind: SleepKind) {
  const { sleep, alreadyAsleep } = await startSleep(kind);
  if (alreadyAsleep && sleep)
    return buildResponse(`Claire is already asleep, for ${formatDurationSpoken(durationMin(sleep))} so far.`);
  if (!sleep) return buildResponse("Sorry, I couldn't log that.");
  return buildResponse(kind === "night" ? "Goodnight Claire! Bedtime logged." : "Nap started. Sweet dreams!");
}

async function handleWake() {
  const finished = await endSleep();
  if (!finished) return buildResponse("Claire wasn't marked as asleep.");
  return buildResponse(`Good morning! Claire slept for ${formatDurationSpoken(durationMin(finished))}.`);
}

async function handleUndo() {
  const removed = await deleteLastSleep();
  if (!removed) return buildResponse("Nothing to undo.");
  return buildResponse(`Undone! Removed the last ${removed.kind === "night" ? "night sleep" : "nap"}.`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestType = body?.request?.type;
    const intentName = body?.request?.intent?.name;

    if (requestType === "LaunchRequest") {
      return buildResponse(`${await statusSpeech()} What would you like to log?`, false);
    }

    if (
      requestType === "SessionEndedRequest" ||
      intentName === "AMAZON.StopIntent" ||
      intentName === "AMAZON.CancelIntent"
    ) {
      return buildResponse("Bye! Take care of Claire!");
    }

    if (intentName === "AMAZON.HelpIntent") {
      return buildResponse(
        "You can say things like: Claire is napping, it's bedtime, Claire woke up, or how is Claire sleeping.",
        false
      );
    }

    if (intentName === "StartNapIntent") return handleStart("nap");
    if (intentName === "StartNightIntent") return handleStart("night");
    if (intentName === "FellAsleepIntent") return handleStart(kindForTime());
    if (intentName === "WokeUpIntent") return handleWake();
    if (intentName === "SleepStatusIntent") return buildResponse(await statusSpeech());
    if (intentName === "UndoIntent") return handleUndo();

    return buildResponse(
      "I didn't understand that. Try saying: Claire is napping, or Claire woke up.",
      false
    );
  } catch {
    return buildResponse("Sorry, something went wrong. Please try again.");
  }
}
