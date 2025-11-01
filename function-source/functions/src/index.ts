import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Import notification functions
import { notifyMiningComplete } from "./notifications/notifyMiningComplete";
import { notifyNewMessage } from "./notifications/notifyNewMessage";
import { notifyReferralBonus } from "./notifications/notifyReferralBonus";
import { sendDailyReminders } from "./notifications/sendPeriodicReminders";
import { notifyKycRejection } from "./notifications/notifyKycRejection";


// process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + "/../flysky-site-3daa1e4343c4.json";

if (!admin.apps.length) {
  admin.initializeApp();
}



// Note: translateFunction is defined in its respective file
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
export const sendManualNotification = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  
  try {
    const data = req.body;
    
    // Check if the user is authenticated and has admin privileges
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No valid token provided' });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }
    
    // Check admin privileges in users collection
    const userSnapshot = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (!userSnapshot.exists) {
      res.status(403).json({ error: 'User not found' });
      return;
    }
    
    const userData = userSnapshot.data();
    if (userData?.role !== 'admin') {
      res.status(403).json({ error: 'User does not have admin privileges' });
      return;
    }
    
    // Validate request data
    if (!data.title || !data.message || !data.platforms || data.platforms.length === 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const processingStartTime = Date.now();
    const notificationRef = admin.firestore().collection('notifications').doc();
    const logRef = admin.firestore().collection('notificationLogs').doc();
    
    // Create notification document
    const notificationData: Record<string, any> = {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      status: 'processing',
      targetAudience: data.targetAudience || 'all',
      platforms: data.platforms,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: decodedToken.uid,
      data: data.data || {},
      // Add delivery status fields
      deliveryStatus: 'pending',
      deliveryDetails: {
        totalRecipients: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0
      }
    };

    // Only add titleKey and bodyKey if they exist and are not undefined
    if (data.titleKey) {
      notificationData.titleKey = data.titleKey;
    }
    if (data.bodyKey) {
      notificationData.bodyKey = data.bodyKey;
    }
    
    await notificationRef.set(notificationData);
    
    // Get users and tokens based on target audience
    let userIds: string[] = [];
    let allTokens: string[] = [];
    
    console.log(`🔍 Target Audience: ${data.targetAudience}`);
    console.log(`🔍 Selected Plans:`, data.selectedPlans);
    console.log(`🔍 Custom User IDs:`, data.customUserIds);
    console.log(`🔍 DEBUG: data.selectedPlans type:`, typeof data.selectedPlans);
    console.log(`🔍 DEBUG: data.selectedPlans length:`, data.selectedPlans?.length);
    console.log(`🔍 DEBUG: data.selectedPlans isArray:`, Array.isArray(data.selectedPlans));
    
    if (data.targetAudience === 'all') {
      // Get all users and their tokens
      const usersSnapshot = await admin.firestore().collection('users').get();
      console.log(`📊 Total users found: ${usersSnapshot.size}`);
      
      // Get all tokens from userTokens collection
      const tokensSnapshot = await admin.firestore().collection('userTokens').get();
      console.log(`📱 Total tokens found: ${tokensSnapshot.size}`);
      
      tokensSnapshot.forEach((tokenDoc) => {
        const tokenData = tokenDoc.data();
        if (tokenData.token) {
          allTokens.push(tokenData.token);
        }
      });
      
    } else if (data.targetAudience === 'plans' && data.selectedPlans) {
      console.log(`🔍 DEBUG: Entering plans logic with selectedPlans:`, data.selectedPlans);
      
      // Get users with specific subscription plans
      const usersSnapshot = await admin.firestore().collection('users').get();
      console.log(`📊 Total users found: ${usersSnapshot.size}`);
      
      // Collect user IDs that match the selected plans
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const userPlan = userData.membership?.planName;
        console.log(`🔍 User ${userDoc.id}: Plan = ${userPlan}, Selected Plans = ${data.selectedPlans}`);
        
        // More robust plan matching - check for exact match and case-insensitive
        const planMatches = data.selectedPlans.some((selectedPlan: string) => {
          const exactMatch = selectedPlan === userPlan;
          const caseInsensitiveMatch = selectedPlan.toLowerCase() === userPlan?.toLowerCase();
          return exactMatch || caseInsensitiveMatch;
        });
        
        if (planMatches) {
          userIds.push(userDoc.id);
          console.log(`✅ User ${userDoc.id} matches plan ${userPlan}`);
        } else {
          console.log(`❌ User ${userDoc.id}: Plan ${userPlan} not in selected plans ${data.selectedPlans}`);
        }
      });
      
      console.log(`📋 Users matching selected plans: ${userIds.length}`);
      console.log(`📋 userIds array:`, userIds);
      
      // Get tokens for the matching users
      if (userIds.length > 0) {
        const tokensSnapshot = await admin.firestore().collection('userTokens').get();
        console.log(`📱 Total tokens in collection: ${tokensSnapshot.size}`);
        
        let tokensFound = 0;
        tokensSnapshot.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          console.log(`🔍 Token doc ${tokenDoc.id}: token = ${tokenData.token}, userIds.includes = ${userIds.includes(tokenDoc.id)}`);
          
          // Check if this token belongs to one of our target users
          if (tokenData.token && userIds.includes(tokenDoc.id)) {
            console.log(`✅ Found token for user ${tokenDoc.id}`);
            allTokens.push(tokenData.token);
            tokensFound++;
          }
        });
        
        console.log(`🔍 Total tokens found for matching users: ${tokensFound}`);
        console.log(`🔍 allTokens array length: ${allTokens.length}`);
      } else {
        console.log(`🔍 No users found matching the selected plans`);
      }
      
    } else if (data.targetAudience === 'custom' && data.customUserIds) {
      // Get specific users by IDs
      userIds = data.customUserIds;
      console.log(`📋 Custom user IDs: ${userIds.length}`);
      
      // Get tokens for the custom users
      const tokensSnapshot = await admin.firestore().collection('userTokens').get();
      console.log(`📱 Total tokens in collection: ${tokensSnapshot.size}`);
      
      tokensSnapshot.forEach((tokenDoc) => {
        const tokenData = tokenDoc.data();
        if (tokenData.token && userIds.includes(tokenDoc.id)) {
          console.log(`✅ Found token for user ${tokenDoc.id}`);
          allTokens.push(tokenData.token);
        }
      });
      
    } else if (data.targetAudience === 'new') {
      // Users created in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const usersSnapshot = await admin.firestore().collection('users').get();
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.createdAt?.toDate() >= oneWeekAgo) {
          userIds.push(userDoc.id);
        }
      });
      
      // Get tokens for new users
      if (userIds.length > 0) {
        const tokensSnapshot = await admin.firestore().collection('userTokens').get();
        tokensSnapshot.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          if (tokenData.token && userIds.includes(tokenDoc.id)) {
            allTokens.push(tokenData.token);
          }
        });
      }
      
    } else if (data.targetAudience === 'inactive') {
      // Users not active in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const usersSnapshot = await admin.firestore().collection('users').get();
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.lastLogin?.toDate() <= thirtyDaysAgo) {
          userIds.push(userDoc.id);
        }
      });
      
      // Get tokens for inactive users
      if (userIds.length > 0) {
        const tokensSnapshot = await admin.firestore().collection('userTokens').get();
        tokensSnapshot.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          if (tokenData.token && userIds.includes(tokenDoc.id)) {
            allTokens.push(tokenData.token);
          }
        });
      }
    }
    
    // Filter out empty/null tokens and get unique tokens
    const tokens = allTokens.filter(token => token && token.trim() !== '');
    const uniqueTokens = [...new Set(tokens)]; // Remove duplicates
    
    console.log(`📱 Raw tokens found: ${allTokens.length}`);
    console.log(`📱 Valid tokens after filtering: ${tokens.length}`);
    console.log(`📱 Unique tokens after deduplication: ${uniqueTokens.length}`);
    console.log(`📱 Found ${uniqueTokens.length} unique FCM tokens from ${userIds.length > 0 ? userIds.length : 'all'} users`);
    
    if (uniqueTokens.length === 0) {
      console.warn(`⚠️ No tokens found for manual notification ${notificationRef.id}`);
      console.log(`🔍 Debug Info:`);
      console.log(`   - Target Audience: ${data.targetAudience}`);
      console.log(`   - Selected Plans: ${data.selectedPlans || 'N/A'}`);
      console.log(`   - Custom User IDs: ${data.customUserIds || 'N/A'}`);
      console.log(`   - Raw tokens collected: ${allTokens.length}`);
      console.log(`   - Valid tokens after filtering: ${tokens.length}`);
      console.log(`   - Unique tokens after deduplication: ${uniqueTokens.length}`);
      
      await Promise.all([
        // Update notification status
        notificationRef.update({
          status: 'failed',
          error: 'No tokens found for the target audience',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Update delivery status
          deliveryStatus: 'failed',
          deliveryDetails: {
            totalRecipients: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            errorMessage: 'No tokens found for the target audience'
          }
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
      
      res.status(200).json({
        success: false,
        error: 'No tokens found for the target audience',
        notificationId: notificationRef.id
      });
      return;
    }

    // Filter out invalid tokens and proceed with valid ones
    console.log(`📱 Found ${tokens.length} valid tokens, proceeding with notification delivery`);
    
    // Send notification to all tokens
    const messaging = admin.messaging();
    const results = await Promise.allSettled(
      uniqueTokens.map(token => 
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
    
    // Determine notification status based on results
    let notificationStatus = 'sent';
    let deliveryStatus = 'delivered';
    let errorMessage = null;
    
    if (successCount === 0) {
      // Complete failure - no notifications delivered
      notificationStatus = 'failed';
      deliveryStatus = 'failed';
      errorMessage = 'All notification attempts failed';
    } else if (errorCount > 0) {
      // Partial success - some delivered, some failed
      notificationStatus = 'sent'; // Still consider it sent since some succeeded
      deliveryStatus = 'partial_success';
      errorMessage = `${errorCount} notifications failed to deliver`;
    } else {
      // Complete success - all notifications delivered
      notificationStatus = 'sent';
      deliveryStatus = 'delivered';
    }
    
    console.log(`✅ Manual notification ${notificationRef.id}: ${successCount} successful, ${errorCount} failed (Status: ${notificationStatus})`);
    
    // Handle inbox notifications if platform includes 'inbox'
    if (data.platforms.includes('inbox')) {
      // For inbox, we need to determine which users to add to
      let inboxUserIds: string[] = [];
      
      if (data.targetAudience === 'all') {
        // Get all user IDs for inbox
        const usersSnapshot = await admin.firestore().collection('users').get();
        inboxUserIds = usersSnapshot.docs.map(doc => doc.id);
      } else if (data.targetAudience === 'plans' && data.selectedPlans) {
        // Use the userIds we already collected for plans
        inboxUserIds = userIds;
      } else if (data.targetAudience === 'custom' && data.customUserIds) {
        // Use the custom user IDs
        inboxUserIds = data.customUserIds;
      } else {
        // For other target audiences, use the userIds we collected
        inboxUserIds = userIds;
      }
      
      console.log(`📥 Adding notification to ${inboxUserIds.length} user inboxes`);
      
      const inboxBatch = admin.firestore().batch();
      
      for (const userId of inboxUserIds) {
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
        status: notificationStatus,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        recipients: uniqueTokens.length,
        opened: 0,
        clicked: 0,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : null,
        error: errorMessage, // Add error message if any
        // Update delivery status
        deliveryStatus: deliveryStatus,
        deliveryDetails: {
          totalRecipients: uniqueTokens.length,
          successfulDeliveries: successCount,
          failedDeliveries: errorCount,
          errorMessage: errorMessage,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        }
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
        recipients: uniqueTokens.length,
        successCount: successCount,
        errorCount: errorCount,
        errors: errors.length > 0 ? errors : null
      })
    ]);
    
    res.status(200).json({
      success: successCount > 0, // Consider it successful if at least one notification was delivered
      notificationId: notificationRef.id,
      recipients: uniqueTokens.length,
      successCount,
      errorCount,
      status: notificationStatus,
      deliveryStatus: deliveryStatus,
      error: errorMessage
    });
  } catch (err) {
    console.error(`❌ Error sending manual notification:`, err);
    
    res.status(500).json({
      success: false,
      error: `Error sending notification: ${(err as Error).message}`
    });
  }
});


export const publicDataDeletion = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Enable CORS for web requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { fullName, email, reason } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !reason) {
      res.status(400).json({ 
        error: 'Missing required fields: fullName, email, reason' 
      });
      return;
    }

    // Generate unique request ID
    const requestId = `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if user already exists
    const usersRef = admin.firestore().collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();
    
    let existingUser = null;
    if (!userQuery.empty) {
      existingUser = userQuery.docs[0];
    }

    // Create deletion request
    const deletionRequest = {
      fullName,
      email,
      reason,
      source: 'public_web',
      userAgent: req.headers['user-agent'] || '',
      language: req.headers['accept-language'] || 'en',
      timestamp: new Date().toISOString(),
      status: 'pending',
      requestDate: admin.firestore.FieldValue.serverTimestamp(),
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isPublicRequest: true,
      existingUser: !!existingUser,
      existingUserId: existingUser ? existingUser.id : null
    };

    // Save to dataDeletionRequests collection
    await admin.firestore()
      .collection('dataDeletionRequests')
      .doc(requestId)
      .set(deletionRequest);

    // Save to publicDeletionRequests collection for tracking
    await admin.firestore()
      .collection('publicDeletionRequests')
      .doc(requestId)
      .set({
        ...deletionRequest,
        requestId
      });

    // If user exists, update their user document
    if (existingUser) {
      await existingUser.ref.update({
        dataDeletionRequested: true,
        dataDeletionStatus: 'pending',
        publicDeletionRequest: true,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ 
      success: true, 
      message: 'Data deletion request submitted successfully',
      requestId
    });

  } catch (error) {
    console.error('Error processing deletion request:', error);
    res.status(500).json({ 
      error: 'Failed to submit deletion request',
      details: (error as Error).message || 'Unknown error occurred'
    });
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
  notifyKycRejection
};

// Export referral functions
export { updateReferralStatus } from './referrals/updateReferralStatus';

// Export internationalized admin notification function
export { sendInternationalizedAdminNotification } from './adminNotifications';

// Export gift management functions
export { distributeGifts, grantWelcomeBonus } from './adminNotifications';

// Export alliance functions
export { helloWorld } from './alliance/allianceManagement';
export { searchUsers } from './alliance/allianceManagement';
export { inviteUserToAlliance } from './alliance/allianceManagement';
export { acceptAllianceInvitation } from './alliance/allianceManagement';
export { rejectAllianceInvitation } from './alliance/allianceManagement';
export { requestToJoinAlliance } from './alliance/allianceManagement';
export { updateAllianceInfo } from './alliance/allianceManagement';
export { createAlliance } from './alliance/allianceManagement';
export { removeAllianceMember } from './alliance/allianceManagement';
export { modifyAllianceMemberRole } from './alliance/allianceManagement';
export { deleteAlliance } from './alliance/allianceManagement';
export { distributeProfits } from './alliance/allianceManagement';
export { approveJoinRequest } from './alliance/allianceManagement';
export { rejectJoinRequest } from './alliance/allianceManagement';
export { getPendingActions } from './alliance/allianceManagement';
export { cancelJoinRequest } from './alliance/allianceManagement';
export { leaveAlliance } from './alliance/allianceManagement';
export { donateToAlliance } from './alliance/allianceManagement';
export { checkInactiveAlliances } from './alliance/allianceManagement';
export { getAllianceNotifications } from './alliance/allianceManagement';
export { getRejectedRequests } from './alliance/allianceManagement';
export { markAllianceNotificationsAsRead } from './alliance/allianceManagement';
export { updateMemberOnlineStatus } from './alliance/allianceManagement';

export { calculateQuestRankings } from './alliance/globalQuests';
export { distributeQuestRewards } from './alliance/globalQuests';
export { sendQuestDeadlineReminders } from './alliance/globalQuests';

export { onPublicMessageCreate } from './alliance/notifications';
export { onAllianceMessageCreate } from './alliance/notifications';
export { onGlobalPostCreate } from './alliance/notifications';
export { onAlliancePostCreate } from './alliance/notifications';
export { onGlobalCommentCreate } from './alliance/notifications';
export { onAllianceCommentCreate } from './alliance/notifications';
export { onGlobalPostReactionCreate } from './alliance/notifications';
export { onAlliancePostReactionCreate } from './alliance/notifications';

export { onPublicRoomMessageCreate } from './alliance/chatNotifications';
export { onAllianceRoomMessageCreate } from './alliance/chatNotifications';

export { onGlobalPostCreateReward } from './alliance/dailyRewards';
export { onAlliancePostCreateReward } from './alliance/dailyRewards';
export { onGlobalPostReactionReward } from './alliance/dailyRewards';
export { onAlliancePostReactionReward } from './alliance/dailyRewards';
export { onPublicMessageReward } from './alliance/dailyRewards';
export { onAllianceMessageReward } from './alliance/dailyRewards';
export { initializeAllianceUser } from './alliance/dailyRewards';
export { getUserDailyRewards } from './alliance/dailyRewards';
export { getUserDailyRewardsSummary } from './alliance/dailyRewards';

export { getPosts } from './alliance/posts';
export { createPost } from './alliance/posts';

export { addComment } from './alliance/comments';
export { toggleReaction } from './alliance/comments';
