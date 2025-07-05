require('dotenv').config({ path: './.env' });
const { TwitterApi } = require('twitter-api-v2');

// ✅ التحقق من توفر المتغيرات المطلوبة
const requiredEnvVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
];

let missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`❌ المتغيرات التالية غير موجودة في ملف .env:\n${missingVars.join('\n')}`);
  process.exit(1);
}

// ✅ تعيين اسم المستخدم
const username = process.env.TWITTER_USERNAME || 'fsncrew';
console.log('📌 سيتم التحقق من حساب:', username);

// ✅ إنشاء عميل Twitter
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// ✅ النص المطلوب وجوده في التغريدة
const EXPECTED_TEXT = 'https://2u.pw/Np639';

// ✅ الدالة للتحقق من وجود التغريدة
async function checkUserTweet(username) {
  try {
    const user = await client.v2.userByUsername(username);
    const tweets = await client.v2.userTimeline(user.data.id, { max_results: 10 });

    const matchedTweet = tweets.data?.data?.find((tweet) =>
      tweet.text.includes(EXPECTED_TEXT)
    );

    if (matchedTweet) {
      console.log(`✅ ${username} قام بنشر التويتة المؤهلة`);
      // 🎁 نفذ منطق المكافأة هنا
    } else {
      console.log(`❌ لم يتم العثور على تويتة مؤهلة من ${username}`);
    }
  } catch (error) {
    console.error('❌ خطأ أثناء التحقق:', error);
  }
}

// ✅ التشغيل
checkUserTweet('fsncrew');

