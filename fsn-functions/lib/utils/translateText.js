"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const v2_1 = require("@google-cloud/translate/build/src/v2");
/**
 * إعداد خدمة Google Translate باستخدام الإعدادات التلقائية
 * (تأكد من أن متغيرات البيئة أو حساب الخدمة مفعّلة بشكل صحيح)
 */
const translate = new v2_1.Translate();
/**
 * يترجم النص إلى اللغة المطلوبة باستخدام Google Cloud Translate API.
 * @param text النص المطلوب ترجمته
 * @param targetLang رمز اللغة الهدف (مثلاً: 'ar', 'en', 'fr')
 * @returns النص المترجم، أو يعيد النص الأصلي في حالة حدوث خطأ
 */
const translateText = async (text, targetLang) => {
    try {
        const [translated] = await translate.translate(text, targetLang);
        return Array.isArray(translated) ? translated[0] : translated;
    }
    catch (error) {
        console.error('❌ Translation failed:', error);
        return text;
    }
};
exports.translateText = translateText;
