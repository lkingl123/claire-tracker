import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function mlToOz(ml) {
  return (ml / 29.5735).toFixed(1);
}

function formatMinutes(min) {
  if (min < 60) return `${Math.round(min)} minutes`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h} hours and ${m} minutes` : `${h} hours`;
}

function buildResponse(speech, shouldEnd = true) {
  return {
    version: "1.0",
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: "PlainText",
        text: speech,
      },
      shouldEndSession: shouldEnd,
    },
  };
}

async function getStatus() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [feedRes, diaperRes] = await Promise.all([
    supabase
      .from("feedings")
      .select("*")
      .gte("fed_at", todayStart.toISOString())
      .order("fed_at", { ascending: false }),
    supabase
      .from("diapers")
      .select("*")
      .gte("changed_at", todayStart.toISOString())
      .order("changed_at", { ascending: false }),
  ]);

  return {
    feedings: feedRes.data || [],
    diapers: diaperRes.data || [],
  };
}

async function handleLastFeed() {
  const { feedings } = await getStatus();
  if (feedings.length === 0) {
    return buildResponse("Claire hasn't been fed yet today.");
  }

  const last = feedings[0];
  const minAgo = (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);
  const timeStr = formatMinutes(minAgo);

  if (last.type === "bottle") {
    return buildResponse(
      `Claire's last feed was a bottle of ${last.amount_ml} milliliters, that's ${mlToOz(last.amount_ml)} ounces, about ${timeStr} ago.${
        minAgo >= 150
          ? " It's been over 2 and a half hours. She probably needs to eat soon!"
          : ""
      }`
    );
  } else {
    return buildResponse(
      `Claire had a breast snack of ${last.amount_ml} ml, about ${timeStr} ago.${
        minAgo >= 150
          ? " It's been over 2 and a half hours. She probably needs a full feed soon!"
          : ""
      }`
    );
  }
}

async function handleDailyStatus() {
  const { feedings, diapers } = await getStatus();

  const bottles = feedings.filter((f) => f.type === "bottle");
  const snacks = feedings.filter((f) => f.type === "breast_snack");
  const totalMl = bottles.reduce((sum, f) => sum + (f.amount_ml || 0), 0);
  const wet = diapers.filter(
    (d) => d.type === "wet" || d.type === "both"
  ).length;
  const dirty = diapers.filter(
    (d) => d.type === "dirty" || d.type === "both"
  ).length;

  let speech = `Today Claire has had ${bottles.length} bottle${bottles.length !== 1 ? "s" : ""} totaling ${totalMl} milliliters, that's ${mlToOz(totalMl)} ounces.`;

  if (snacks.length > 0) {
    speech += ` Plus ${snacks.length} breast snack${snacks.length !== 1 ? "s" : ""}.`;
  }

  speech += ` For diapers, ${wet} wet and ${dirty} dirty, ${diapers.length} total.`;

  return buildResponse(speech);
}

async function handleLogBottle(ml) {
  const { error } = await supabase.from("feedings").insert({
    type: "bottle",
    amount_ml: ml,
    fed_at: new Date().toISOString(),
  });

  if (error) {
    return buildResponse("Sorry, I couldn't log that feed. Please try again.");
  }

  return buildResponse(
    `Got it! Logged a ${ml} milliliter bottle feed for Claire. That's ${mlToOz(ml)} ounces.`
  );
}

async function handleLogSnack(minutes) {
  const { error } = await supabase.from("feedings").insert({
    type: "breast_snack",
    amount_ml: minutes,
    fed_at: new Date().toISOString(),
  });

  if (error) {
    return buildResponse(
      "Sorry, I couldn't log that snack. Please try again."
    );
  }

  return buildResponse(
    `Got it! Logged a ${minutes} minute breast snack for Claire.`
  );
}

async function handleLogDiaper(type) {
  const diaperType =
    type === "wet" ? "wet" : type === "dirty" ? "dirty" : "both";

  const { error } = await supabase.from("diapers").insert({
    type: diaperType,
    changed_at: new Date().toISOString(),
  });

  if (error) {
    return buildResponse(
      "Sorry, I couldn't log that diaper. Please try again."
    );
  }

  return buildResponse(`Got it! Logged a ${diaperType} diaper for Claire.`);
}

async function handleDiaperCount() {
  const { diapers } = await getStatus();
  const wet = diapers.filter(
    (d) => d.type === "wet" || d.type === "both"
  ).length;
  const dirty = diapers.filter(
    (d) => d.type === "dirty" || d.type === "both"
  ).length;

  return buildResponse(
    `Claire has had ${diapers.length} diaper changes today. ${wet} wet and ${dirty} dirty.`
  );
}

export const handler = async (event) => {
  try {
    const requestType = event?.request?.type;
    const intentName = event?.request?.intent?.name;
    const slots = event?.request?.intent?.slots || {};

    // Launch request
    if (requestType === "LaunchRequest") {
      const { feedings } = await getStatus();
      if (feedings.length > 0) {
        const last = feedings[0];
        const minAgo =
          (Date.now() - new Date(last.fed_at).getTime()) / (1000 * 60);
        const timeStr = formatMinutes(minAgo);
        const urgency =
          minAgo >= 150 ? " She might need to eat soon!" : "";
        return buildResponse(
          `Claire Tracker here! Last feed was ${timeStr} ago.${urgency} What would you like to do?`,
          false
        );
      }
      return buildResponse(
        "Claire Tracker here! No feeds logged yet today. What would you like to do?",
        false
      );
    }

    // Session ended
    if (
      requestType === "SessionEndedRequest" ||
      intentName === "AMAZON.StopIntent" ||
      intentName === "AMAZON.CancelIntent"
    ) {
      return buildResponse("Bye! Take care of Claire!");
    }

    // Help
    if (intentName === "AMAZON.HelpIntent") {
      return buildResponse(
        "You can say things like: log a 60 milliliter bottle, log a breast snack, log a wet diaper, when was the last feed, or how is Claire doing today.",
        false
      );
    }

    // Custom intents
    if (intentName === "LastFeedIntent") {
      return await handleLastFeed();
    }

    if (intentName === "DailyStatusIntent") {
      return await handleDailyStatus();
    }

    if (intentName === "LogBottleIntent") {
      const ml = parseInt(slots.amount?.value) || 60;
      return await handleLogBottle(ml);
    }

    if (intentName === "LogSnackIntent") {
      const minutes = parseInt(slots.duration?.value) || 5;
      return await handleLogSnack(minutes);
    }

    if (intentName === "LogDiaperIntent") {
      const type = slots.diaperType?.value || "both";
      return await handleLogDiaper(type);
    }

    if (intentName === "DiaperCountIntent") {
      return await handleDiaperCount();
    }

    return buildResponse(
      "I didn't understand that. Try saying: when was the last feed, or log a 60 milliliter bottle.",
      false
    );
  } catch (err) {
    console.error("Claire Tracker error:", err);
    return buildResponse("Sorry, something went wrong. Please try again.");
  }
};
