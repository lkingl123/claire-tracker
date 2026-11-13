import { NextRequest, NextResponse } from "next/server";
import { deleteLastNap, formatMinutesSpoken, logNap, napMinutes, statusSpeech } from "@/lib/naps";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestType = body?.request?.type;
    const intentName = body?.request?.intent?.name;
    const slots = body?.request?.intent?.slots || {};

    if (requestType === "LaunchRequest") {
      return buildResponse(`${await statusSpeech()} How long was her nap?`, false);
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
        "You can say things like: log a 45 minute nap, how are her naps today, or undo.",
        false
      );
    }

    if (intentName === "LogNapIntent") {
      const hours = parseFloat(slots.hours?.value) || 0;
      const minutes = Math.round(hours * 60) + (parseInt(slots.minutes?.value) || 0);
      if (minutes <= 0) return buildResponse("How many minutes was her nap?", false);
      const { error } = await logNap(minutes);
      if (error) return buildResponse("Sorry, I couldn't log that nap.");
      return buildResponse(`Done! Logged a nap of ${formatMinutesSpoken(minutes)}.`);
    }

    if (intentName === "NapStatusIntent") return buildResponse(await statusSpeech());

    if (intentName === "UndoIntent") {
      const removed = await deleteLastNap();
      if (!removed) return buildResponse("Nothing to undo.");
      return buildResponse(`Undone! Removed the last nap, ${formatMinutesSpoken(napMinutes(removed))}.`);
    }

    return buildResponse("I didn't understand that. Try saying: log a 45 minute nap.", false);
  } catch {
    return buildResponse("Sorry, something went wrong. Please try again.");
  }
}
