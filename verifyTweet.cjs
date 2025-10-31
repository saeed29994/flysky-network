require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

// إعداد الاتصال عبر التوكنات
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// تويتة البانر المطلوب التحقق منها
const EXPECTED_TEXT = '🔥 Join FlySky Network and earn 50 FSN for sharing this banner!\n\nhttps://2u.pw/Np639\n\n🔗 https://www.fsncrew.io/ #FSN #Web3 #Crypto #FlySky';

// الدالة للتحقق من تغريدات مستخدم معين
async function checkUserTweet(username) {
  try {
    const user = await client.v2.userByUsername(username);
    const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });

    const matchedTweet = tweets.data.data.find((tweet) =>
      tweet.text.includes('https://2u.pw/Np639')
    );

    if (matchedTweet) {
      console.log(`✅ ${username} قام بنشر التويتة المؤهلة`);
      // 🎁 هنا يمكنك تنفيذ منطق المكافأة (Firestore, Firebase Function, إلخ)
    } else {
      console.log(`❌ لم يتم العثور على تويتة مؤهلة من ${username}`);
    }
  } catch (error) {
    console.error('❌ خطأ أثناء التحقق:', error);
  }
}

// مثال
checkUserTweet('اسم_المستخدم');
