import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { db, messaging } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

// ✅ طلب الإذن وحفظ التوكن داخل حقل fcmTokens في وثيقة المستخدم
export const requestPermissionAndToken = async (uid: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('🔒 تم رفض إذن الإشعارات');
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    console.log('📱 معلومات الجهاز:', {
      userAgent: navigator.userAgent,
      token,
      permission: Notification.permission,
    });

    if (token) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: serverTimestamp(),
        lastUserAgent: navigator.userAgent,
      });

      console.log('✅ تم حفظ التوكن داخل حقل fcmTokens');
    } else {
      console.warn('⚠️ لم يتم الحصول على توكن FCM');
    }
  } catch (error: any) {
    console.error('❌ خطأ أثناء طلب التوكن:', error?.message || error);
  }
};

// ✅ حذف التوكن الحالي من المتصفح فقط
export const deleteCurrentToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      await deleteToken(messaging);
      console.log('🗑️ تم حذف التوكن من المتصفح');
    }
  } catch (error) {
    console.error('❌ خطأ أثناء حذف التوكن:', error);
  }
};

// ✅ الاستماع للإشعارات في وضع foreground
export const listenToForegroundMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('📥 تم استقبال إشعار أثناء فتح التطبيق:', payload);
  });
};
