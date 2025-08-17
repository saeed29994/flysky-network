/**
 * يرسل النص المطلوب ترجمته إلى دالة سحابية (Cloud Function) منشورة.
 * @param text النص المطلوب ترجمته
 * @param targetLang رمز اللغة الهدف (مثل: 'ar' أو 'fr' أو 'en')
 * @returns النص المترجم أو النص الأصلي عند الفشل
 */
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const response = await fetch(
      'https://us-central1-flysky-site.cloudfunctions.net/translateFunction',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      }
    );

    if (!response.ok) throw new Error('Translation request failed');

    const data = await response.json();
    return data.translation || text; // Fixed: changed from translatedText to translation
  } catch (error) {
    console.error('❌ Translation API error:', error);
    return text;
  }
};
