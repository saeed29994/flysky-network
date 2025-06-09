import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, messagingPromise } from "../firebase";

/**
 * يطلب صلاحية الإشعارات ويحصل على FCM Token، ثم يحفظه في userTokens/{uid}
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
      const tokenRef = doc(db, "userTokens", currentUser.uid);
      await setDoc(tokenRef, { token }); // ✅ الحفظ في المسار الصحيح
      console.log("✅ Token saved to Firestore:", token);
      return token;
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting or saving FCM token:", error);
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
          console.log("🔔 Foreground message received:", payload);
          resolve(payload);
        });
      }
    });
  });

/**
 * يحفظ الـ FCM Token للمستخدم الحالي بدون طلب صلاحيات جديدة
 * مفيد عند إعادة الدخول للتطبيق
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
      const tokenRef = doc(db, "userTokens", currentUser.uid);
      await setDoc(tokenRef, { token }); // ✅ نفس التنسيق
      console.log("✅ Token saved to Firestore (silent):", token);
    }
  } catch (error) {
    console.error("❌ Error silently saving FCM token:", error);
  }
};
