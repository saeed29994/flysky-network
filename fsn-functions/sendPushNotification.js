const express = require("express");
const admin = require("firebase-admin");
const { Translate } = require("@google-cloud/translate").v2;

// تعيين ملف الخدمة
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./flysky-site-3daa1e4343c4.json";

// Firebase Admin
admin.initializeApp();

// Express
const app = express();
app.use(express.json());

// Google Translate
const translate = new Translate();

app.post("/sendPushNotification", async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    // 📌 1. جلب اللغة من وثيقة المستخدم
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const lang = userDoc.exists && userDoc.data().language ? userDoc.data().language : "ar";

    // 📌 2. جلب التوكن من userTokens
    const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
    if (!tokenDoc.exists || !tokenDoc.data().token) {
      return res.status(404).json({ success: false, message: "FCM token not found for user." });
    }
    const token = tokenDoc.data().token;

    // 📌 3. الترجمة
    const [translatedTitle] = await translate.translate(title, lang);
    const [translatedBody] = await translate.translate(body, lang);

    // 📌 4. إرسال الإشعار
    const message = {
      notification: {
        title: translatedTitle,
        body: translatedBody,
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    res.status(200).json({ success: true, message: "Notification sent successfully" });

  } catch (error) {
    console.error("❌ Error sending notification:", error);

    // حذف التوكن غير الصالح
    if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {
      await admin.firestore().collection("userTokens").doc(userId).delete();
      console.log("🚫 تم حذف التوكن غير الصالح.");
    }

    res.status(500).json({ success: false, message: "Error sending notification" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
