const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register service worker, request permission, and subscribe to push
export async function setupNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Subscribe to web push
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    // Send subscription to our backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    return true;
  } catch {
    return false;
  }
}

// Keep the local reminder as a fallback for when the tab is open
let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function startFeedReminder(
  lastFeedTime: Date | null,
  intervalMinutes: number = 180
) {
  if (reminderInterval) clearInterval(reminderInterval);

  reminderInterval = setInterval(async () => {
    if (!lastFeedTime) return;

    const minutesSinceFeed =
      (Date.now() - lastFeedTime.getTime()) / (1000 * 60);

    if (minutesSinceFeed >= intervalMinutes && minutesSinceFeed < intervalMinutes + 5) {
      if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Feeding Reminder", {
          body: `It's been ${Math.round(minutesSinceFeed / 60 * 10) / 10}h since Claire's last feed.`,
          icon: "/icon-192.png",
          tag: "feed-reminder",
        } as NotificationOptions);
      }
    }
  }, 60000);
}

export function stopFeedReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}
