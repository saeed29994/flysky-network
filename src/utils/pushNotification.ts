// src/utils/pushNotification.ts
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db, messagingPromise } from "../firebase";

/**
 * يطلب صلاحية الإشعارات ويحصل على FCM Token، ثم يحفظه في Firestore
 * @returns Promise<string | null> - FCM Token أو null إذا فشل
 */
export const requestPermissionAndToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const messaging = await messagingPromise;
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: "BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rTyj8r8nl3YEP-eJs9OAAV-fpzZYT6siymHDj6rWhyDNI0",
    });

    if (token) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
      console.log("✅ Token saved to Firestore:", token);
      return token;
    }

    return null;
  } catch (error) {
    console.error("❌ Error saving FCM token:", error);
    return null;
  }
};

/**
 * يستمع إلى الإشعارات أثناء عمل التطبيق في الواجهة الأمامية
 * @returns Promise<Payload>
 */
export const listenToForegroundMessages = () =>
  new Promise((resolve) => {
    messagingPromise.then((messaging) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });

/**
 * يحفظ الـ FCM Token للمستخدم الحالي بدون طلب صلاحيات جديدة
 */
export const saveUserToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messaging = await messagingPromise;
    if (!messaging) return;

    const token = await getToken(messaging, {
      vapidKey: "BCN7Vc7QTqoXbueYfOq-icGXm7ZyKioTu9FTwvJM2rTyj8r8nl3YEP-eJs9OAAV-fpzZYT6siymHDj6rWhyDNI0",
    });

    if (token) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
      console.log("✅ Token saved to Firestore:", token);
    }
  } catch (error) {
    console.error("❌ Error saving FCM token:", error);
  }
};
