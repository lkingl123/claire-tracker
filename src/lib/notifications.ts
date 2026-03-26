// Register service worker and request notification permission
export async function setupNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;

  try {
    await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

// Send a local notification via service worker
export async function sendLocalNotification(
  title: string,
  body: string,
  tag?: string
) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: tag || "claire-reminder",
  } as NotificationOptions);
}

// Start a reminder timer - checks every minute
let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function startFeedReminder(
  lastFeedTime: Date | null,
  intervalMinutes: number = 180 // default 3 hours
) {
  if (reminderInterval) clearInterval(reminderInterval);

  reminderInterval = setInterval(() => {
    if (!lastFeedTime) return;

    const minutesSinceFeed =
      (Date.now() - lastFeedTime.getTime()) / (1000 * 60);

    if (
      minutesSinceFeed >= intervalMinutes &&
      minutesSinceFeed < intervalMinutes + 1
    ) {
      sendLocalNotification(
        "Feeding Reminder",
        `It's been ${Math.round(minutesSinceFeed / 60)}h since Claire's last feed. Time to check on her!`,
        "feed-reminder"
      );
    }
  }, 60000); // check every minute
}

export function stopFeedReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}
