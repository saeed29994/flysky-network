import { auth } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export interface InternationalizedNotificationPayload {
  title: string;
  message: string;
  targetAudience: 'all' | 'plans' | 'custom' | 'new' | 'inactive';
  platforms: string[];
  selectedPlans?: string[];
  customUserIds?: string[];
  type?: string;
  data?: Record<string, string>;
}

export interface InternationalizedNotificationResponse {
  success: boolean;
  notificationId: string;
  recipients: number;
  successCount: number;
  errorCount: number;
  status: string;
  deliveryStatus: string;
  error?: string;
  internationalized: boolean;
  languageDistribution: Record<string, number>;
  totalLanguages: number;
  processingTime: number;
}

/**
 * Send internationalized notification using the new Cloud Function
 * This automatically detects user languages and translates notifications
 */
export const sendInternationalizedNotification = async (
  payload: InternationalizedNotificationPayload
): Promise<InternationalizedNotificationResponse> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Call the internationalized notification Cloud Function
    const sendNotification = httpsCallable<
      InternationalizedNotificationPayload, 
      InternationalizedNotificationResponse
    >(functions, 'sendInternationalizedAdminNotification');

    const result = await sendNotification(payload);
    
    if (result.data.success) {
      console.log('✅ Internationalized notification sent successfully!');
      console.log(`🌍 Languages served: ${result.data.totalLanguages}`);
      console.log('📊 Language distribution:', result.data.languageDistribution);
    } else {
      console.warn('⚠️ Notification sent with some issues:', result.data.error);
    }

    return result.data;
    
  } catch (error) {
    console.error('❌ Failed to send internationalized notification:', error);
    throw error;
  }
};

/**
 * Example usage functions for different notification scenarios
 */

// Send to all users
export const sendToAllUsers = async (title: string, message: string) => {
  return sendInternationalizedNotification({
    title,
    message,
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  });
};

// Send to specific subscription plans
export const sendToPlans = async (
  title: string, 
  message: string, 
  plans: string[]
) => {
  return sendInternationalizedNotification({
    title,
    message,
    targetAudience: 'plans',
    selectedPlans: plans,
    platforms: ['mobile', 'web', 'inbox']
  });
};

// Send to custom user selection
export const sendToCustomUsers = async (
  title: string, 
  message: string, 
  userIds: string[]
) => {
  return sendInternationalizedNotification({
    title,
    message,
    targetAudience: 'custom',
    customUserIds: userIds,
    platforms: ['mobile', 'web', 'inbox']
  });
};

// Send to new users (last 7 days)
export const sendToNewUsers = async (title: string, message: string) => {
  return sendInternationalizedNotification({
    title,
    message,
    targetAudience: 'new',
    platforms: ['mobile', 'web', 'inbox']
  });
};

// Send to inactive users (30+ days)
export const sendToInactiveUsers = async (title: string, message: string) => {
  return sendInternationalizedNotification({
    title,
    message,
    targetAudience: 'inactive',
    platforms: ['mobile', 'web', 'inbox']
  });
};

/**
 * Helper function to format language distribution for display
 */
export const formatLanguageDistribution = (
  distribution: Record<string, number>
): string => {
  const languages = Object.entries(distribution)
    .map(([code, count]) => {
      const languageNames: Record<string, string> = {
        'en': 'English',
        'ar': 'Arabic',
        'fr': 'French',
        'tr': 'Turkish',
        'zh-CN': 'Chinese'
      };
      return `${languageNames[code] || code}: ${count}`;
    })
    .join(', ');
  
  return languages;
};

/**
 * Example notification templates with internationalization support
 * These are now localized and will be automatically translated based on user preferences
 */
export const notificationTemplates = {
  welcome: {
    title: "notifications.templates.welcome.title",
    message: "notifications.templates.welcome.body"
  },
  dailyMiningReminder: {
    title: "notifications.templates.dailyMiningReminder.title",
    message: "notifications.templates.dailyMiningReminder.body"
  },
  stakingOpportunity: {
    title: "notifications.templates.stakingOpportunity.title",
    message: "notifications.templates.stakingOpportunity.body"
  },
  referralProgram: {
    title: "notifications.templates.referralProgram.title",
    message: "notifications.templates.referralProgram.body"
  },
  newFeature: {
    title: "notifications.templates.newFeature.title",
    message: "notifications.templates.newFeature.body"
  },
  premiumExclusive: {
    title: "notifications.templates.premiumExclusive.title",
    message: "notifications.templates.premiumExclusive.body"
  },
  inactiveReminder: {
    title: "notifications.templates.inactiveReminder.title",
    message: "notifications.templates.inactiveReminder.body"
  },
  maintenance: {
    title: "notifications.templates.maintenance.title",
    message: "notifications.templates.maintenance.body"
  }
};

/**
 * Test function to demonstrate the system
 */
export const testInternationalizedSystem = async () => {
  console.log('🌍 Testing Internationalized Notification System...');
  
  try {
    // Test sending to all users
    const result = await sendToAllUsers(
      "Test Internationalized Notification",
      "This is a test notification that will be automatically translated to each user's preferred language."
    );
    
    console.log('✅ Test completed successfully!');
    console.log(`📱 Sent to ${result.recipients} users`);
    console.log(`🌍 Languages served: ${result.totalLanguages}`);
    console.log('📊 Language breakdown:', formatLanguageDistribution(result.languageDistribution));
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};
