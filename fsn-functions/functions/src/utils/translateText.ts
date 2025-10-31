import { Translate } from '@google-cloud/translate/build/src/v2';

/**
 * إعداد خدمة Google Translate باستخدام الإعدادات التلقائية
 * (تأكد من أن متغيرات البيئة أو حساب الخدمة مفعّلة بشكل صحيح)
 */
const translate = new Translate();

/**
 * يترجم النص إلى اللغة المطلوبة باستخدام Google Cloud Translate API.
 * @param text النص المطلوب ترجمته
 * @param targetLang رمز اللغة الهدف (مثلاً: 'ar', 'en', 'fr')
 * @returns النص المترجم، أو يعيد النص الأصلي في حالة حدوث خطأ
 */
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const [translated] = await translate.translate(text, targetLang);
    return Array.isArray(translated) ? translated[0] : translated;
  } catch (error) {
    console.error('❌ Translation failed:', error);
    return text;
  }
};
