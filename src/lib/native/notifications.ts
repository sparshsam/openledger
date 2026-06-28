// ─── Native Push Notifications ─────────────────────────────────────────────
// Wraps Capacitor PushNotifications API for local and push notifications.
// Falls back to Web Notification API in browser mode.

export type NotificationPayload = {
  title: string;
  body: string;
  id?: string;
  data?: Record<string, unknown>;
};

/**
 * Show a local notification.
 */
export async function showLocalNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [{
        title: payload.title,
        body: payload.body,
        id: payload.id ? parseInt(payload.id, 36) % 100000 : Date.now(),
        extra: payload.data,
      }],
    });
    return true;
  } catch {
    // Capacitor not available
  }

  try {
    if (!("Notification" in window)) return false;
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(payload.title, { body: payload.body });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Register for push notifications.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.requestPermissions();
    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener("registration", (token: { value?: string }) => {
        resolve(token.value ?? null);
      });
    });
  } catch {
    return null;
  }
}

/**
 * Request notification permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const result = await LocalNotifications.requestPermissions();
    return (result as unknown as { receive?: string }).receive === "granted";
  } catch {
    try {
      if (!("Notification" in window)) return false;
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch {
      return false;
    }
  }
}
