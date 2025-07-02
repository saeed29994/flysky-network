"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const v2_1 = require("@google-cloud/translate/build/src/v2");
// ✅ تهيئة خدمة الترجمة باستخدام Google Cloud Translate API
const translate = new v2_1.Translate();
/**
 * يترجم النص إلى اللغة المطلوبة.
 * @param text النص المطلوب ترجمته
 * @param targetLang رمز اللغة الهدف (مثلاً: 'ar', 'en', 'fr')
 * @returns النص المترجم أو النص الأصلي إذا فشلت الترجمة
 */
const translateText = async (text, targetLang) => {
    try {
        const [translated] = await translate.translate(text, targetLang);
        return Array.isArray(translated) ? translated[0] : translated;
    }
    catch (err) {
        console.error('❌ Translation failed:', err);
        return text; // fallback للنص الأصلي
    }
};
exports.translateText = translateText;
