// 📁 sendNotificationFromFirestore.cjs

import admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// ✅ تهيئة Firebase Admin
initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

async function sendNotificationToUser(uid) {
  try {
    // 📥 قراءة توكن المستخدم من Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error("❌ المستخدم غير موجود في Firestore");
      return;
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens;

    if (!tokens || tokens.length === 0) {
      console.error("❌ لا يوجد FCM Token مسجل للمستخدم");
      return;
    }

    const token = tokens[0]; // أو loop لو كنت تريد إرسال للجميع

    // 📤 إعداد الرسالة
    const message = {
      notification: {
        title: "🔔 إشعار من الإدارة",
        body: "هذه رسالة تجريبية تم إرسالها عبر Firebase Admin.",
      },
      token: token,
    };

    // 🚀 إرسال الرسالة
    const response = await getMessaging().send(message);
    console.log("✅ تم إرسال الإشعار بنجاح:", response);
  } catch (error) {
    console.error("❌ خطأ أثناء الإرسال:", error);
  }
}

// ✅ أدخل UID المستخدم هنا
sendNotificationToUser("QgGy04Zvi4NyvC9K4g7ZGyfgGQr2");
