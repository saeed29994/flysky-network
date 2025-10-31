// function-source\functions\src\utils\internationalizedNotifications.ts
import * as admin from "firebase-admin";
import { v2 } from "@google-cloud/translate";

const translate = new v2.Translate();

// Supported languages mapping
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'ar': 'العربية',
  'fr': 'Français',
  'tr': 'Türkçe',
  'zh-CN': '中文'
};

// Default language fallback
export const DEFAULT_LANGUAGE = 'en';

/**
 * Get user's preferred language from their profile
 * @param userId - User ID to check
 * @returns User's language preference or default
 */
export async function getUserLanguage(userId: string): Promise<string> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userLanguage = userData?.language || userData?.preferredLanguage;
      
      if (userLanguage && SUPPORTED_LANGUAGES[userLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
        return userLanguage;
      }
    }
    
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn(`⚠️ Failed to get language for user ${userId}:`, error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Translate notification content to user's language
 * @param text - Text to translate
 * @param targetLanguage - Target language code
 * @param fallbackText - Fallback text if translation fails
 * @returns Translated text or fallback
 */
export async function translateNotificationText(
  text: string, 
  targetLanguage: string, 
  fallbackText?: string
): Promise<string> {
  // Don't translate if target language is English (source language)
  if (targetLanguage === 'en') {
    return text;
  }
  
  try {
    const [translated] = await translate.translate(text, targetLanguage);
    const translatedText = Array.isArray(translated) ? translated[0] : translated;
    
    // Validate translation result
    if (translatedText && translatedText.trim() && translatedText !== text) {
      console.log(`✅ Translated to ${targetLanguage}: "${text}" → "${translatedText}"`);
      return translatedText;
    } else {
      console.warn(`⚠️ Translation returned empty or same text for ${targetLanguage}`);
      return fallbackText || text;
    }
  } catch (error) {
    console.error(`❌ Translation failed for ${targetLanguage}:`, error);
    return fallbackText || text;
  }
}

/**
 * Send internationalized notification to a single user
 * @param userId - User ID to send notification to
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Success status
 */
export async function sendInternationalizedNotification(
  userId: string,
  title: string,
  body: string,
  platforms: string[],
  data?: Record<string, string>,
  skipUserCollection: boolean = false
): Promise<boolean> {
  try {
    const userLanguage = await getUserLanguage(userId);
    const translatedTitle = await translateNotificationText(title, userLanguage, title);
    const translatedBody = await translateNotificationText(body, userLanguage, body);

    let inboxSuccess = false;
    if (platforms.includes('inbox') && !skipUserCollection) {
      try {
        await admin.firestore().collection("users").doc(userId).collection("notifications").add({
          type: data?.type || 'system',
          title: translatedTitle,
          body: translatedBody,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          link: data?.link,
          data: {
            ...data,
            originalTitle: title,
            originalBody: body,
            userLanguage,
            translated: 'true'
          }
        });
        console.log(`✅ Added translated in-app notification to user ${userId}'s collection in ${userLanguage}`);
        inboxSuccess = true;
      } catch (error) {
        console.error(`❌ Failed to add in-app notification for user ${userId}:`, error);
      }
    }

    const requiresPush = platforms.includes('web') || platforms.includes('mobile');
    if (!requiresPush) {
      return inboxSuccess;
    }

    const tokenDoc = await admin.firestore().collection('userTokens').doc(userId).get();
    if (!tokenDoc.exists || !tokenDoc.data()?.token) {
      console.warn(`⚠️ No FCM token found for user ${userId}. Push notification skipped.`);
      return false; // Return false if a push notification was required but no token was found.
    }

    const token = tokenDoc.data()!.token;
    const message = {
      notification: {
        title: translatedTitle,
        body: translatedBody,
      },
      token,
      data: {
        ...data,
        originalTitle: title,
        originalBody: body,
        userLanguage,
        translated: 'true'
      }
    };

    await admin.messaging().send(message);
    console.log(`✅ Internationalized push notification sent to user ${userId} in ${userLanguage}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send internationalized notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send internationalized notification to multiple users
 * @param userIds - Array of user IDs
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
export async function sendInternationalizedNotificationsToUsers(
  userIds: string[],
  title: string,
  body: string,
  platforms: string[],
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; results: Array<{ userId: string; success: boolean; language?: string }> }> {
  const results: Array<{ userId: string; success: boolean; language?: string }> = [];
  let successCount = 0;
  let failureCount = 0;
  
  console.log(`🌍 Sending internationalized notifications to ${userIds.length} users on platforms: ${platforms.join(', ')}...`);
  
  // Process users in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (userId) => {
      try {
        const userLanguage = await getUserLanguage(userId);
        
        // This single function now handles inbox, push, or both based on the platforms array.
        const success = await sendInternationalizedNotification(userId, title, body, platforms, data, false);
        
        results.push({ userId, success, language: userLanguage });
        
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        return { userId, success, language: userLanguage };
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        results.push({ userId, success: false });
        failureCount++;
        return { userId, success: false };
      }
    });
    
    // Wait for batch to complete before moving to next batch
    await Promise.allSettled(batchPromises);
    
    // Small delay between batches to be respectful to external services
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ Internationalized notifications completed: ${successCount} success, ${failureCount} failures`);
  
  return { successCount, failureCount, results };
}

/**
 * Send internationalized notification to all users with language detection
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
export async function sendInternationalizedNotificationToAllUsers(
  title: string,
  body: string,
  platforms: string[],
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; totalUsers: number }> {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`🌍 Sending internationalized notification to all ${userIds.length} users...`);
    
    const result = await sendInternationalizedNotificationsToUsers(userIds, title, body, platforms, data);
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalUsers: userIds.length
    };
    
  } catch (error) {
    console.error('❌ Failed to send internationalized notification to all users:', error);
    return { successCount: 0, failureCount: 0, totalUsers: 0 };
  }
}

/**
 * Send internationalized notification to users by subscription plan
 * @param selectedPlans - Array of plan names to target
 * @param title - Notification title (in source language)
 * @param body - Notification body (in source language)
 * @param data - Additional notification data
 * @returns Object with success and failure counts
 */
export async function sendInternationalizedNotificationToPlans(
  selectedPlans: string[],
  title: string,
  body: string,
  platforms: string[],
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; totalUsers: number }> {
  try {
    // Get users with matching subscription plans
    const usersSnapshot = await admin.firestore().collection('users').get();
    const userIds: string[] = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userPlan = userData.membership?.planName;
      
      // Check if user's plan matches any of the selected plans
      const planMatches = selectedPlans.some((selectedPlan: string) => {
        const exactMatch = selectedPlan === userPlan;
        const caseInsensitiveMatch = selectedPlan.toLowerCase() === userPlan?.toLowerCase();
        return exactMatch || caseInsensitiveMatch;
      });
      
      if (planMatches) {
        userIds.push(userDoc.id);
      }
    });
    
    console.log(`🌍 Sending internationalized notification to ${userIds.length} users with plans: ${selectedPlans.join(', ')}`);
    
    if (userIds.length === 0) {
      return { successCount: 0, failureCount: 0, totalUsers: 0 };
    }
    
    const result = await sendInternationalizedNotificationsToUsers(userIds, title, body, platforms, data);
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalUsers: userIds.length
    };
    
  } catch (error) {
    console.error('❌ Failed to send internationalized notification to plans:', error);
    return { successCount: 0, failureCount: 0, totalUsers: 0 };
  }
}

/**
 * Get language statistics for notification recipients
 * @param userIds - Array of user IDs
 * @returns Object with language distribution
 */
export async function getLanguageDistribution(userIds: string[]): Promise<Record<string, number>> {
  const languageCounts: Record<string, number> = {};
  
  for (const userId of userIds) {
    const language = await getUserLanguage(userId);
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  }
  
  return languageCounts;
}
