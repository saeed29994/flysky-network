// import المكتبة الخاصة بالترجمة
const { TranslationServiceClient } = require('@google-cloud/translate').v3;

// إعداد العميل
const client = new TranslationServiceClient();

// إعدادات الترجمة
const projectId = 'flysky-site';
const location = 'global';

// دالة الترجمة
async function translateText(text, targetLanguage) {
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: 'auto',
    targetLanguageCode: targetLanguage,
  };

  try {
    const [response] = await client.translateText(request);
    return response.translations[0].translatedText;
  } catch (error) {
    console.error('❌ Translation failed:', error);
    return null;
  }
}

// اختبار
(async () => {
  const translated = await translateText('مرحبا بك في فلاي سكاي', 'en');
  console.log('✅ Translated:', translated);
})();
