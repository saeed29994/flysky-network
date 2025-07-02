const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

const { updateReferralStatus } = require("./functions/referrals/updateReferralStatus");
const { sendPushNotification } = require("./functions/fcm/sendPushNotification");

exports.updateReferralStatus = updateReferralStatus;
exports.sendPushNotification = sendPushNotification;

// ✅ ترجمة النصوص مع دعم CORS
exports.translateFunction = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { text } = req.body;

      // ❗️قم هنا بإضافة كود الترجمة الفعلي باستخدام API خارجي أو أي منطق ترجمة
      const translated = text + " (translated)"; // مجرد مثال مؤقت

      return res.status(200).json({ translated });
    } catch (error) {
      console.error("❌ Error in translateFunction", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});
