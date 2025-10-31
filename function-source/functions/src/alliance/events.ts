// function-source/functions/src/alliance/events.ts
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

interface CreateEventRequest {
  allianceId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxAttendees?: number;
  isPublic: boolean;
  tags?: string[];
}

interface ListEventsRequest {
  allianceId: string;
  status?: 'active' | 'past' | 'all';
  limit?: number;
  cursor?: string;
}

interface ListEventsResponse {
  events: any[];
  hasMore: boolean;
  nextCursor?: string;
}

interface UpdateEventRequest {
  eventId: string;
  allianceId: string;
  updates: Partial<CreateEventRequest>;
}

interface DeleteEventRequest {
  eventId: string;
  allianceId: string;
}

interface RSVPEventRequest {
  eventId: string;
  allianceId: string;
  status: 'attending' | 'maybe' | 'declined';
}

export const createEvent = functions.https.onCall(async (data: CreateEventRequest, context) => {
  try {
    const { allianceId, ...eventData } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Check permissions
    if (allianceId !== 'global') {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const allianceDoc = await allianceRef.get();

      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Alliance not found');
      }

      const allianceData = allianceDoc.data()!;
      const isOwner = allianceData.ownerUid === callerUid;
      const isLeader = allianceData.leaderUid === callerUid;

      if (!isOwner && !isLeader) {
        // Check member role
        const memberRef = allianceRef.collection('members').doc(callerUid);
        const memberDoc = await memberRef.get();
        const memberRole = memberDoc.data()?.role;

        if (!['co-leader', 'admin'].includes(memberRole)) {
          throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create events');
        }
      }
    }

    // Validate event data
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);

    if (startDate >= endDate) {
      throw new functions.https.HttpsError('invalid-argument', 'End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new functions.https.HttpsError('invalid-argument', 'Event cannot be in the past');
    }

    // Create event
    const eventsRef = allianceId === 'global'
      ? db.collection('globalEvents')
      : db.collection('alliances').doc(allianceId).collection('events');

    const eventRef = eventsRef.doc();
    const eventDoc = {
      ...eventData,
      id: eventRef.id,
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      attendeeCount: 0,
      status: 'active'
    };

    await eventRef.set(eventDoc);

    // Create notification for alliance members (if alliance event)
    if (allianceId !== 'global') {
      const membersRef = db.collection('alliances').doc(allianceId).collection('members');
      const membersSnap = await membersRef.get();

      const batch = db.batch();
      membersSnap.docs.forEach(memberDoc => {
        const notificationRef = db.collection('users').doc(memberDoc.id)
          .collection('allianceNotifications').doc();

        batch.set(notificationRef, {
          type: 'new_event',
          eventId: eventRef.id,
          eventTitle: eventData.title,
          allianceId,
          createdBy: callerUid,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
    }

    return {
      success: true,
      eventId: eventRef.id,
      message: 'Event created successfully'
    };

  } catch (error) {
    console.error('Error in createEvent:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create event');
  }
});

export const listEvents = functions.https.onCall(async (data: ListEventsRequest, context): Promise<ListEventsResponse> => {
  try {
    const { allianceId, status = 'active', limit = 20, cursor } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Check permissions for private alliance events
    if (allianceId !== 'global') {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const allianceDoc = await allianceRef.get();

      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Alliance not found');
      }

      const allianceData = allianceDoc.data()!;

      if (!allianceData.isPublic) {
        // Check if user is member
        const memberRef = allianceRef.collection('members').doc(callerUid);
        const memberDoc = await memberRef.get();

        if (!memberDoc.exists) {
          throw new functions.https.HttpsError('permission-denied', 'Alliance events are private');
        }
      }
    }

    // Build query
    const eventsRef = allianceId === 'global'
      ? db.collection('globalEvents')
      : db.collection('alliances').doc(allianceId).collection('events');

    let query = eventsRef.orderBy('startDate', 'asc').limit(limit + 1);

    // Filter by status
    if (status === 'active') {
      query = query.where('startDate', '>=', new Date());
    } else if (status === 'past') {
      query = query.where('startDate', '<', new Date());
    }

    if (cursor) {
      const cursorDoc = await eventsRef.doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const events = snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const hasMore = snapshot.docs.length > limit;
    const nextCursor = hasMore ? snapshot.docs[limit - 1].id : undefined;

    return {
      events,
      hasMore,
      nextCursor
    };

  } catch (error) {
    console.error('Error in listEvents:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to list events');
  }
});

export const updateEvent = functions.https.onCall(async (data: UpdateEventRequest, context) => {
  try {
    const { eventId, allianceId, updates } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Get event
    const eventRef = allianceId === 'global'
      ? db.collection('globalEvents').doc(eventId)
      : db.collection('alliances').doc(allianceId).collection('events').doc(eventId);

    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;

    // Check permissions
    const isCreator = eventData.createdBy === callerUid;

    if (!isCreator && allianceId !== 'global') {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const allianceDoc = await allianceRef.get();
      const allianceData = allianceDoc.data()!;

      const isOwner = allianceData.ownerUid === callerUid;
      const isLeader = allianceData.leaderUid === callerUid;

      if (!isOwner && !isLeader) {
        const memberRef = allianceRef.collection('members').doc(callerUid);
        const memberDoc = await memberRef.get();
        const memberRole = memberDoc.data()?.role;

        if (!['co-leader', 'admin'].includes(memberRole)) {
          throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update event');
        }
      }
    }

    // Validate updates
    if (updates.startDate && updates.endDate) {
      const startDate = new Date(updates.startDate);
      const endDate = new Date(updates.endDate);

      if (startDate >= endDate) {
        throw new functions.https.HttpsError('invalid-argument', 'End date must be after start date');
      }
    }

    // Update event
    await eventRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify attendees of changes
    const rsvpsRef = eventRef.collection('rsvps');
    const rsvpsSnap = await rsvpsRef.where('status', '==', 'attending').get();

    if (!rsvpsSnap.empty) {
      const batch = db.batch();
      rsvpsSnap.docs.forEach(rsvpDoc => {
        const notificationRef = db.collection('users').doc(rsvpDoc.id)
          .collection('eventNotifications').doc();

        batch.set(notificationRef, {
          type: 'event_updated',
          eventId,
          eventTitle: updates.title || eventData.title,
          allianceId,
          updatedBy: callerUid,
          changes: Object.keys(updates),
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
    }

    return { success: true, message: 'Event updated successfully' };

  } catch (error) {
    console.error('Error in updateEvent:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update event');
  }
});

export const deleteEvent = functions.https.onCall(async (data: DeleteEventRequest, context) => {
  try {
    const { eventId, allianceId } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Get event
    const eventRef = allianceId === 'global'
      ? db.collection('globalEvents').doc(eventId)
      : db.collection('alliances').doc(allianceId).collection('events').doc(eventId);

    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;

    // Check permissions
    const isCreator = eventData.createdBy === callerUid;

    if (!isCreator && allianceId !== 'global') {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const allianceDoc = await allianceRef.get();
      const allianceData = allianceDoc.data()!;

      const isOwner = allianceData.ownerUid === callerUid;
      const isLeader = allianceData.leaderUid === callerUid;

      if (!isOwner && !isLeader) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to delete event');
      }
    }

    // Notify attendees before deletion
    const rsvpsRef = eventRef.collection('rsvps');
    const rsvpsSnap = await rsvpsRef.where('status', 'in', ['attending', 'maybe']).get();

    if (!rsvpsSnap.empty) {
      const batch = db.batch();
      rsvpsSnap.docs.forEach(rsvpDoc => {
        const notificationRef = db.collection('users').doc(rsvpDoc.id)
          .collection('eventNotifications').doc();

        batch.set(notificationRef, {
          type: 'event_cancelled',
          eventId,
          eventTitle: eventData.title,
          allianceId,
          cancelledBy: callerUid,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
    }

    // Delete event and all subcollections
    const batch = db.batch();

    // Delete RSVPs
    rsvpsSnap.docs.forEach(doc => batch.delete(doc.ref));

    // Delete the event
    batch.delete(eventRef);

    await batch.commit();

    return { success: true, message: 'Event deleted successfully' };

  } catch (error) {
    console.error('Error in deleteEvent:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete event');
  }
});

export const rsvpEvent = functions.https.onCall(async (data: RSVPEventRequest, context) => {
  try {
    const { eventId, allianceId, status } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Get event
    const eventRef = allianceId === 'global'
      ? db.collection('globalEvents').doc(eventId)
      : db.collection('alliances').doc(allianceId).collection('events').doc(eventId);

    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;

    // Check if event is in the future
    const eventStart = eventData.startDate.toDate();
    if (eventStart < new Date()) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot RSVP to past events');
    }

    // Check permissions for private events
    if (allianceId !== 'global' && !eventData.isPublic) {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const memberRef = allianceRef.collection('members').doc(callerUid);
      const memberDoc = await memberRef.get();

      if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Event is private to alliance members');
      }
    }

    // Update RSVP
    const rsvpRef = eventRef.collection('rsvps').doc(callerUid);

    if (status === 'declined') {
      // Remove RSVP
      await rsvpRef.delete();
    } else {
      // Set RSVP
      await rsvpRef.set({
        status,
        respondedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Update attendee count
    const rsvpsSnap = await eventRef.collection('rsvps').where('status', '==', 'attending').get();
    await eventRef.update({
      attendeeCount: rsvpsSnap.size,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `RSVP ${status} successfully` };

  } catch (error) {
    console.error('Error in rsvpEvent:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update RSVP');
  }
});