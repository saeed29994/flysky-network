"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const translateText_1 = require("./translateText");
const allowedOrigins = [
    "http://localhost:5173",
    "https://fsncrew.io",
    "https://www.fsncrew.io"
];
exports.translateFunction = functions.https.onRequest(async (req, res) => {
    const origin = req.headers.origin;
    // ✅ إعداد CORS
    if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        res.set("Access-Control-Allow-Credentials", "true");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    // ✅ رد فوري لطلبات preflight
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
        const translated = await (0, translateText_1.translateText)(text, targetLang);
        res.status(200).json({ translation: translated });
    }
    catch (error) {
        console.error("🔥 Translation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
