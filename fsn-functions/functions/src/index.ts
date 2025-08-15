import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Import notification functions
import { notifyMiningComplete } from "./notifications/notifyMiningComplete";
import { notifyNewMessage } from "./notifications/notifyNewMessage";
import { notifyReferralBonus } from "./notifications/notifyReferralBonus";
import { sendDailyReminders } from "./notifications/sendPeriodicReminders";
import { 
  trackNotificationOpen, 
  trackNotificationClick, 
  getNotificationAnalytics 
} from "./notifications/trackNotificationEvents";

// process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + "/../flysky-site-3daa1e4343c4.json";

if (!admin.apps.length) {
  admin.initializeApp();
}



// Note: translateFunction and sendPushNotification are defined in their respective files
// to avoid duplicate function definitions

// Add the scheduled function to process scheduled notifications
export const processScheduledNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Query notifications that are scheduled and due to be sent
      const scheduledNotificationsSnapshot = await admin.firestore()
        .collection('notifications')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .get();
      
      if (scheduledNotificationsSnapshot.empty) {
        console.log('✅ No scheduled notifications to process at this time');
        return null;
      }
      
      console.log(`🔔 Found ${scheduledNotificationsSnapshot.size} scheduled notifications to process`);
      
      // Process each scheduled notification
      const batch = admin.firestore().batch();
      const logsBatch = admin.firestore().batch();
      
      for (const doc of scheduledNotificationsSnapshot.docs) {
        const notification = doc.data();
        const notificationId = doc.id;
        const processingStartTime = Date.now();
        
        // Create a log entry for this notification processing attempt
        const logRef = admin.firestore().collection('notificationLogs').doc();
        
        try {
          // Get tokens based on target audience
          let userTokensQuery = admin.firestore().collection('userTokens');
          let userIds: string[] = [];
          
          // Filter by audience if not 'all'
          if (notification.targetAudience !== 'all') {
            const usersSnapshot = await admin.firestore().collection('users').get();
            
            usersSnapshot.forEach((userDoc) => {
              const userData = userDoc.data();
              
              switch (notification.targetAudience) {
                case 'premium':
                  if (userData.membership?.isPremium || userData.isPremium) {
                    userIds.push(userDoc.id);
                  }
                  break;
                case 'new':
                  // Users created in the last 7 days
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  if (userData.createdAt?.toDate() >= oneWeekAgo) {
                    userIds.push(userDoc.id);
                  }
                  break;
                case 'inactive':
                  // Users not active in the last 30 days
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  if (userData.lastLogin?.toDate() <= thirtyDaysAgo) {
                    userIds.push(userDoc.id);
                  }
                  break;
              }
            });
          }
          
          // Get tokens
          const tokensSnapshot = await userTokensQuery.get();
          const tokens: string[] = [];
          
          tokensSnapshot.forEach((tokenDoc) => {
            const tokenData = tokenDoc.data();
            if (tokenData.token && (notification.targetAudience === 'all' || userIds.includes(tokenDoc.id))) {
              tokens.push(tokenData.token);
            }
          });
          
          if (tokens.length === 0) {
            console.warn(`⚠️ No tokens found for notification ${notificationId}`);
            
            // Log the failure
            logsBatch.set(logRef, {
              notificationId: notificationId,
              title: notification.title,
              message: notification.message,
              status: 'failed',
              error: 'No tokens found for the target audience',
              targetAudience: notification.targetAudience,
              platforms: notification.platforms || [],
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              processingTime: Date.now() - processingStartTime,
              recipients: 0,
              successCount: 0,
              errorCount: 0
            });
            
            // Update notification status
            batch.update(doc.ref, {
              status: 'failed',
              error: 'No tokens found for the target audience',
              processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            continue;
          }
          
          // Send notification to all tokens
          const messaging = admin.messaging();
          const results = await Promise.allSettled(
            tokens.map(token => 
              messaging.send({
                token,
                notification: {
                  title: notification.title,
                  body: notification.message,
                },
                data: notification.data || {},
              })
            )
          );
          
          // Count successes and failures
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const errorCount = results.filter(r => r.status === 'rejected').length;
          
          // Collect detailed error information
          const errors = results
            .map((result, index) => {
              if (result.status === 'rejected') {
                return {
                  token: tokens[index],
                  error: result.reason.toString()
                };
              }
              return null;
            })
            .filter(Boolean);
          
          console.log(`✅ Notification ${notificationId} sent to ${successCount} devices with ${errorCount} failures`);
          
          // Log the success/partial success
          logsBatch.set(logRef, {
            notificationId: notificationId,
            title: notification.title,
            message: notification.message,
            status: errorCount === 0 ? 'success' : 'partial_success',
            targetAudience: notification.targetAudience,
            platforms: notification.platforms || [],
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            processingTime: Date.now() - processingStartTime,
            recipients: tokens.length,
            successCount: successCount,
            errorCount: errorCount,
            errors: errors.length > 0 ? errors : null
          });
          
          // Update notification status
          batch.update(doc.ref, {
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            recipients: tokens.length,
            opened: 0,
            clicked: 0,
            successCount,
            errorCount,
            errors: errors.length > 0 ? errors : null
          });
          
          // Handle inbox notifications if platform includes 'inbox'
          if (notification.platforms?.includes('inbox')) {
            // Add to users' inboxes
            const inboxTargetUserIds = userIds.length > 0 ? userIds : tokensSnapshot.docs.map(d => d.id);
            console.log(`📥 Adding notification to ${inboxTargetUserIds.length} user inboxes`);
            
            for (const userId of inboxTargetUserIds) {
              const inboxRef = admin.firestore()
                .collection('users')
                .doc(userId)
                .collection('inbox')
                .doc();
              
              batch.set(inboxRef, {
                title: notification.title,
                message: notification.message,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                type: notification.type || 'info',
                data: notification.data || {},
                notificationId: notificationId
              });
            }
          }
        } catch (err) {
          console.error(`❌ Error processing notification ${notificationId}:`, err);
          
          // Log the error
          logsBatch.set(logRef, {
            notificationId: notificationId,
            title: notification.title,
            message: notification.message,
            status: 'failed',
            error: (err as Error).message || 'Unknown error',
            errorDetails: (err as Error).stack,
            targetAudience: notification.targetAudience,
            platforms: notification.platforms || [],
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            processingTime: Date.now() - processingStartTime,
            recipients: 0,
            successCount: 0,
            errorCount: 0
          });
          
          // Mark as failed
          batch.update(doc.ref, {
            status: 'failed',
            error: (err as Error).message || 'Unknown error',
            processedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      // Commit all updates
      await Promise.all([batch.commit(), logsBatch.commit()]);
      console.log('✅ Scheduled notifications processed successfully');
      
      return null;
    } catch (err) {
      console.error('❌ Error in processScheduledNotifications:', err);
      
      // Log the global error
      try {
        await admin.firestore().collection('notificationLogs').add({
          status: 'failed',
          error: (err as Error).message || 'Unknown error',
          errorDetails: (err as Error).stack,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: 'system_error',
          component: 'processScheduledNotifications'
        });
      } catch (logErr) {
        console.error('❌ Failed to log error:', logErr);
      }
      
      return null;
    }
  });

// Add a function to manually send notifications with detailed logging
export const sendManualNotification = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to send notifications');
  }
  
  try {
    const adminSnapshot = await admin.firestore().collection('admins').doc(context.auth.uid).get();
    if (!adminSnapshot.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
  } catch (err) {
    throw new functions.https.HttpsError('internal', 'Error checking admin status');
  }
  
  // Validate request data
  if (!data.title || !data.message || !data.platforms || data.platforms.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  const processingStartTime = Date.now();
  const notificationRef = admin.firestore().collection('notifications').doc();
  const logRef = admin.firestore().collection('notificationLogs').doc();
  
  try {
    // Create notification document
    const notificationData = {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      status: 'processing',
      targetAudience: data.targetAudience || 'all',
      platforms: data.platforms,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      data: data.data || {}
    };
    
    await notificationRef.set(notificationData);
    
    // Get tokens based on target audience
    let userIds: string[] = [];
    if (data.targetAudience && data.targetAudience !== 'all') {
      const usersSnapshot = await admin.firestore().collection('users').get();
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        
        switch (data.targetAudience) {
          case 'premium':
            if (userData.membership?.isPremium || userData.isPremium) {
              userIds.push(userDoc.id);
            }
            break;
          case 'new':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (userData.createdAt?.toDate() >= oneWeekAgo) {
              userIds.push(userDoc.id);
            }
            break;
          case 'inactive':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (userData.lastLogin?.toDate() <= thirtyDaysAgo) {
              userIds.push(userDoc.id);
            }
            break;
        }
      });
    }
    
    // Get tokens
    const tokensSnapshot = await admin.firestore().collection('userTokens').get();
    const tokens: string[] = [];
    
    tokensSnapshot.forEach((tokenDoc) => {
      const tokenData = tokenDoc.data();
      if (tokenData.token && (data.targetAudience === 'all' || !data.targetAudience || userIds.includes(tokenDoc.id))) {
        tokens.push(tokenData.token);
      }
    });
    
    if (tokens.length === 0) {
      console.warn(`⚠️ No tokens found for manual notification ${notificationRef.id}`);
      
      await Promise.all([
        // Update notification status
        notificationRef.update({
          status: 'failed',
          error: 'No tokens found for the target audience',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        }),
        
        // Log the failure
        logRef.set({
          notificationId: notificationRef.id,
          title: data.title,
          message: data.message,
          status: 'failed',
          error: 'No tokens found for the target audience',
          targetAudience: data.targetAudience || 'all',
          platforms: data.platforms,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          processingTime: Date.now() - processingStartTime,
          recipients: 0,
          successCount: 0,
          errorCount: 0
        })
      ]);
      
      return {
        success: false,
        error: 'No tokens found for the target audience',
        notificationId: notificationRef.id
      };
    }
    
    // Send notification to all tokens
    const messaging = admin.messaging();
    const results = await Promise.allSettled(
      tokens.map(token => 
        messaging.send({
          token,
          notification: {
            title: data.title,
            body: data.message,
          },
          data: data.data || {},
        })
      )
    );
    
    // Count successes and failures
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    // Collect detailed error information
    const errors = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          return {
            token: tokens[index],
            error: result.reason.toString()
          };
        }
        return null;
      })
      .filter(Boolean);
    
    console.log(`✅ Manual notification ${notificationRef.id} sent to ${successCount} devices with ${errorCount} failures`);
    
    // Handle inbox notifications if platform includes 'inbox'
    if (data.platforms.includes('inbox')) {
      const inboxTargetUserIds = userIds.length > 0 ? userIds : tokensSnapshot.docs.map(d => d.id);
      console.log(`📥 Adding notification to ${inboxTargetUserIds.length} user inboxes`);
      
      const inboxBatch = admin.firestore().batch();
      
      for (const userId of inboxTargetUserIds) {
        const inboxRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('inbox')
          .doc();
        
        inboxBatch.set(inboxRef, {
          title: data.title,
          message: data.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          type: data.type || 'info',
          data: data.data || {},
          notificationId: notificationRef.id
        });
      }
      
      await inboxBatch.commit();
    }
    
    await Promise.all([
      // Update notification status
      notificationRef.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        recipients: tokens.length,
        opened: 0,
        clicked: 0,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : null
      }),
      
      // Log the success/partial success
      logRef.set({
        notificationId: notificationRef.id,
        title: data.title,
        message: data.message,
        status: errorCount === 0 ? 'success' : 'partial_success',
        targetAudience: data.targetAudience || 'all',
        platforms: data.platforms,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processingTime: Date.now() - processingStartTime,
        recipients: tokens.length,
        successCount: successCount,
        errorCount: errorCount,
        errors: errors.length > 0 ? errors : null
      })
    ]);
    
    return {
      success: true,
      notificationId: notificationRef.id,
      recipients: tokens.length,
      successCount,
      errorCount
    };
  } catch (err) {
    console.error(`❌ Error sending manual notification:`, err);
    
    await Promise.all([
      // Update notification status
      notificationRef.update({
        status: 'failed',
        error: (err as Error).message || 'Unknown error',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      }),
      
      // Log the error
      logRef.set({
        notificationId: notificationRef.id,
        title: data.title,
        message: data.message,
        status: 'failed',
        error: (err as Error).message || 'Unknown error',
        errorDetails: (err as Error).stack,
        targetAudience: data.targetAudience || 'all',
        platforms: data.platforms || [],
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processingTime: Date.now() - processingStartTime,
        recipients: 0,
        successCount: 0,
        errorCount: 0
      })
    ]);
    
    throw new functions.https.HttpsError('internal', `Error sending notification: ${(err as Error).message}`);
  }
});

// Configure functions for proper CORS and region
const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '256MB',
  cors: true
};

// Export notification functions with configuration
export { 
  notifyMiningComplete, 
  notifyNewMessage, 
  notifyReferralBonus, 
  sendDailyReminders,
  trackNotificationOpen,
  trackNotificationClick,
  getNotificationAnalytics
};
