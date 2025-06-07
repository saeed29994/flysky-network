// 📁 src/utils/pushNotification.ts

import { messagingPromise } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";

const VAPID_KEY =
  "BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rTyj8r8nl3YEP-eJs9OAAV-fpzZYT6siymHDj6rWhyDNI0";

export const requestPermissionAndToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔕 Notification permission not granted");
      return null;
    }

    const messaging = await messagingPromise;
    if (!messaging) {
      console.warn("❗️ Firebase messaging not available");
      return null;
    }

    const token = await getToken(messaging!, {
      vapidKey: VAPID_KEY,
    });

    console.log("✅ FCM Token:", token);
    return token;
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};

export const listenToForegroundMessages = async () => {
  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn("❗ Firebase messaging not available");
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("🔔 Foreground notification:", payload);
    const { title, body } = payload.notification || {};
    if (title || body) {
      new Notification(title || "📬 إشعار جديد", {
        body: body || "",
        icon: "/fsn-logo.png",
      });
    }
  });
};
