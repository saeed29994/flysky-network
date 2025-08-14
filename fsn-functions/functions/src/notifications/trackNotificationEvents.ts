import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Use admin.firestore() directly instead of getFirestore()
const db = admin.firestore();

/**
 * Track when a notification is opened
 * This function is called when a user opens a notification
 */
export const trackNotificationOpen = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { notificationId } = data;
  if (!notificationId) {
    throw new functions.https.HttpsError("invalid-argument", "notificationId is required");
  }

  try {
    // Get the notification document
    const notificationRef = db.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Notification not found");
    }

    // Update the opened count
    await notificationRef.update({
      opened: admin.firestore.FieldValue.increment(1)
    });

    // Log the open event
    await db.collection("notificationEvents").add({
      notificationId,
      userId: context.auth.uid,
      eventType: "open",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      platform: data.platform || "unknown", // mobile, web, etc.
      deviceInfo: data.deviceInfo || {}
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking notification open:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error tracking notification open"
    );
  }
});

/**
 * Track when a notification is clicked
 * This function is called when a user clicks on a notification
 */
export const trackNotificationClick = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { notificationId } = data;
  if (!notificationId) {
    throw new functions.https.HttpsError("invalid-argument", "notificationId is required");
  }

  try {
    // Get the notification document
    const notificationRef = db.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Notification not found");
    }

    // Update the clicked count
    await notificationRef.update({
      clicked: admin.firestore.FieldValue.increment(1)
    });

    // Log the click event
    await db.collection("notificationEvents").add({
      notificationId,
      userId: context.auth.uid,
      eventType: "click",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      platform: data.platform || "unknown", // mobile, web, etc.
      deviceInfo: data.deviceInfo || {},
      destination: data.destination || null // Where the notification led to
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking notification click:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error tracking notification click"
    );
  }
});

/**
 * Get analytics for a specific notification
 * This function returns detailed analytics for a notification
 */
export const getNotificationAnalytics = functions.https.onCall(async (data, context) => {
  // Ensure user is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const adminSnapshot = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminSnapshot.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User does not have admin privileges');
    }
  } catch (err) {
    throw new functions.https.HttpsError('internal', 'Error checking admin status');
  }

  const { notificationId } = data;
  if (!notificationId) {
    throw new functions.https.HttpsError("invalid-argument", "notificationId is required");
  }

  try {
    // Get the notification document
    const notificationRef = db.collection("notifications").doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Notification not found");
    }

    const notification = notificationDoc.data();

    // Get all events for this notification
    const eventsSnapshot = await db.collection("notificationEvents")
      .where("notificationId", "==", notificationId)
      .orderBy("timestamp", "desc")
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        notificationId: data.notificationId || '',
        userId: data.userId || '',
        eventType: data.eventType || '',
        timestamp: data.timestamp,
        platform: data.platform || 'unknown',
        deviceInfo: data.deviceInfo || {},
        destination: data.destination || null
      };
    });

    // Calculate analytics
    const openEvents = events.filter(event => event.eventType === "open");
    const clickEvents = events.filter(event => event.eventType === "click");

    // Get unique users who opened/clicked
    const uniqueOpenUsers = new Set(openEvents.map(event => event.userId)).size;
    const uniqueClickUsers = new Set(clickEvents.map(event => event.userId)).size;

    // Group by platform
    const platformOpenCounts: Record<string, number> = {};
    const platformClickCounts: Record<string, number> = {};

    openEvents.forEach(event => {
      const platform = event.platform || "unknown";
      platformOpenCounts[platform] = (platformOpenCounts[platform] || 0) + 1;
    });

    clickEvents.forEach(event => {
      const platform = event.platform || "unknown";
      platformClickCounts[platform] = (platformClickCounts[platform] || 0) + 1;
    });

    // Get most recent events
    const recentEvents = events.slice(0, 50);

    return {
      notification: {
        id: notificationId,
        ...notification
      },
      analytics: {
        totalOpens: openEvents.length,
        totalClicks: clickEvents.length,
        uniqueOpenUsers,
        uniqueClickUsers,
        openRate: notification?.recipients ? (uniqueOpenUsers / notification.recipients) * 100 : 0,
        clickRate: uniqueOpenUsers ? (uniqueClickUsers / uniqueOpenUsers) * 100 : 0,
        platformOpenCounts,
        platformClickCounts,
      },
      recentEvents
    };
  } catch (error) {
    console.error("Error getting notification analytics:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error getting notification analytics"
    );
  }
});
