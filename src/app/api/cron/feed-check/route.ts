import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FEED_INTERVAL_MINUTES = 120; // 2 hours

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the most recent feeding
    const { data: lastFeeding } = await supabase
      .from("feedings")
      .select("fed_at")
      .order("fed_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastFeeding) {
      return NextResponse.json({ skipped: "no feedings found" });
    }

    const minutesSince =
      (Date.now() - new Date(lastFeeding.fed_at).getTime()) / (1000 * 60);

    // Only notify if past the interval and within a 10-minute window (avoid repeat spam)
    if (minutesSince < FEED_INTERVAL_MINUTES || minutesSince > FEED_INTERVAL_MINUTES + 10) {
      return NextResponse.json({
        skipped: true,
        minutesSince: Math.round(minutesSince),
      });
    }

    // Get all push subscriptions
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subs || subs.length === 0) {
      return NextResponse.json({ skipped: "no subscribers" });
    }

    // Lazy import web-push to avoid build-time issues
    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(
      "mailto:claire-tracker@example.com",
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const hours = Math.round((minutesSince / 60) * 10) / 10;
    const payload = JSON.stringify({
      title: "Feeding Reminder",
      body: `It's been ${hours}h since Claire's last feed. Time to check on her!`,
      tag: "feed-reminder",
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          return { endpoint: sub.endpoint, ok: true };
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { endpoint: sub.endpoint, error: String(err) };
        }
      })
    );

    return NextResponse.json({ sent: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
