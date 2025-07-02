import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import { translateText } from '../../utils/translateText';
import { NOTIFICATION_TEMPLATES, DEFAULT_DASHBOARD_URL, DEFAULT_ICON_URL } from '../../utils/constants';

admin.initializeApp();
const db = admin.firestore();

export const updateReferralStatus = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change: Change<FirebaseFirestore.DocumentSnapshot>, context: EventContext) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return null;

    const prevStatus = (before.kycStatus || '').toLowerCase();
    const newStatus = (after.kycStatus || '').toLowerCase();
    const referredEmail = after.email;
    if (prevStatus === newStatus || newStatus !== 'verified') return null;

    const usersSnapshot = await db.collection('users').get();
    for (const docSnap of usersSnapshot.docs) {
      const data = docSnap.data();
      const referralList = data.referralList || [];

      let updated = false;

      const newList = referralList.map((entry: any) => {
        if (entry.email === referredEmail && entry.status === 'Pending') {
          entry.status = 'Verified';
          updated = true;
        }
        return entry;
      });

      if (updated) {
        await docSnap.ref.update({ referralList: newList });

        const tokens: string[] = data.fcmTokens || [];
        const lang = data.language || 'en';

        const titleEn = NOTIFICATION_TEMPLATES.referralVerified.title;
        const bodyEn = NOTIFICATION_TEMPLATES.referralVerified.body(referredEmail);

        let translatedTitle = titleEn;
        let translatedBody = bodyEn;

        try {
          translatedTitle = await translateText(titleEn, lang);
          translatedBody = await translateText(bodyEn, lang);
        } catch (err) {
          console.error('❌ Translation failed:', err);
        }

        if (tokens.length > 0) {
          const message = {
            notification: { title: translatedTitle, body: translatedBody },
            tokens,
            webpush: {
              fcmOptions: { link: DEFAULT_DASHBOARD_URL },
              notification: {
                icon: DEFAULT_ICON_URL,
                click_action: DEFAULT_DASHBOARD_URL,
              },
            },
          };

          try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`📨 FCM sent: ${response.successCount}/${tokens.length}`);
          } catch (error) {
            console.error('❌ FCM error:', error);
          }
        }
      }
    }

    return null;
  });
