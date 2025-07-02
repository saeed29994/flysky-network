import * as functions from "firebase-functions";
import { translateText } from "./utils/translateText";

// ✅ السماح بالنطاقين
const allowedOrigins = [
  "http://localhost:5173", // للسماح بالواجهة أثناء التطوير
  "https://fsncrew.io",
  "https://www.fsncrew.io"
];


export const translateFunction = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // ✅ الرد الفوري لطلبات OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      res.status(400).json({ error: "Missing text or targetLang" });
      return;
    }

    const translated = await translateText(text, targetLang);
    res.status(200).json({ translation: translated });
  } catch (error) {
    console.error("🔥 Translation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

