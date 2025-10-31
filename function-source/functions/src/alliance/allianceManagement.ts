import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

/**
 * A simple callable function for testing
 */
export const helloWorld = functions.https.onCall((data, context) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  return { message: `Hello, ${data.name}!` };
});

/**
 * Searches for users by email.
 * Note: Firestore is not optimized for partial string searches.
 * This function currently supports exact email matching.
 */
export const searchUsers = functions.https.onCall(async (data, context) => {
  const { queryText, searchType, startAfter: startAfterId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to search for users.");
  }

  if (!queryText || typeof queryText !== 'string') {
    throw new functions.https.HttpsError("invalid-argument", "A valid search query must be provided.");
  }

  if (searchType !== 'email' && searchType !== 'name') {
    throw new functions.https.HttpsError("invalid-argument", "Invalid search type. Must be 'email' or 'name'.");
  }

  const db = admin.firestore();
  const usersRef = db.collection("users");
  const searchField = searchType === 'name' ? 'fullName' : 'email';

  let usersQuery = usersRef
    .orderBy(searchField)
    .where(searchField, ">=", queryText)
    .where(searchField, "<=", queryText + '\uf8ff')
    .limit(10);

  if (startAfterId) {
    const startAfterDoc = await db.collection("users").doc(startAfterId).get();
    if (startAfterDoc.exists) {
      usersQuery = usersQuery.startAfter(startAfterDoc);
    }
  }

  try {
    const snapshot = await usersQuery.get();
    if (snapshot.empty) {
      return { users: [], lastVisible: null };
    }

    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      fullName: doc.data().fullName,
      avatarUrl: doc.data().avatarUrl,
    }));

    const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id || null;

    return { users, lastVisible };

  } catch (error) {
    functions.logger.error("Error searching for users:", error);
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while searching for users.");
  }
});


/**
 * Invites a user to join an alliance. Only the alliance leader can perform this action.
 */
export const inviteUserToAlliance = functions.https.onCall(async (data, context) => {
  const { allianceId, invitedUserUid } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId || !invitedUserUid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId or invitedUserUid.");
  }

  const db = admin.firestore();
  const membershipQuery = db.collectionGroup("members").where("uid", "==", invitedUserUid).limit(1);
  const membershipSnap = await membershipQuery.get();
  if (!membershipSnap.empty) {
    const existingAllianceId = membershipSnap.docs[0].ref.parent?.parent?.id;
    if (existingAllianceId === allianceId) {
      throw new functions.https.HttpsError("already-exists", "This user is already a member of this alliance.");
    }
    throw new functions.https.HttpsError("failed-precondition", "This user is already a member of another alliance.");
  }


  const allianceRef = db.collection("alliances").doc(allianceId);
  const invitationRef = db.collection("allianceInvitations").doc(`${allianceId}_${invitedUserUid}`);

  try {
    await db.runTransaction(async (transaction) => {
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Alliance not found.");
      }

      const allianceData = allianceDoc.data()!;
      if (allianceData.ownerUid !== callerUid && allianceData.leaderUid !== callerUid) {
        throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can send invitations.");
      }

      const invitationDoc = await transaction.get(invitationRef);
      if (invitationDoc.exists) {
        throw new functions.https.HttpsError("already-exists", "An invitation has already been sent to this user for this alliance.");
      }

      transaction.set(invitationRef, {
        allianceId,
        invitedUserUid,
        inviterUid: callerUid,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { status: "success", message: "Invitation sent successfully." };

  } catch (error) {
    functions.logger.error("Error sending invitation:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while sending the invitation.");
  }
});

/**
 * Accepts an alliance invitation.
 */
export const acceptAllianceInvitation = functions.https.onCall(async (data, context) => {
  const { invitationId } = data; // invitationId is expected to be `${allianceId}_${userId}`
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!invitationId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invitationId.");
  }

  const db = admin.firestore();
  const invitationRef = db.collection("allianceInvitations").doc(invitationId);
  const userRef = db.collection("users").doc(callerUid);

  try {
    await db.runTransaction(async (transaction) => {

      // +++ ADDED COOLDOWN CHECK +++
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists && userDoc.data()?.lastAllianceLeftAt) {
        const lastLeaveTime = userDoc.data()!.lastAllianceLeftAt.toMillis();
        const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
        if (Date.now() - lastLeaveTime < twentyFourHoursInMillis) {
          throw new functions.https.HttpsError("failed-precondition", "You must wait 24 hours after leaving an alliance before you can join a new one.");
        }
      }
      // +++ END COOLDOWN CHECK +++

      const invitationDoc = await transaction.get(invitationRef);
      if (!invitationDoc.exists || invitationDoc.data()!.status !== 'pending') {
        throw new functions.https.HttpsError("not-found", "Invitation not found or has already been processed.");
      }

      const invitationData = invitationDoc.data()!;
      const membershipQuery = db.collectionGroup("members").where("uid", "==", callerUid).limit(1);
      const membershipSnap = await transaction.get(membershipQuery);
      if (!membershipSnap.empty) {
        const existingAllianceId = membershipSnap.docs[0].ref.parent?.parent?.id;
        if (existingAllianceId === invitationData.allianceId) {
          throw new functions.https.HttpsError("already-exists", "You are already a member of this alliance.");
        }
        throw new functions.https.HttpsError("failed-precondition", "You are already a member of another alliance.");
      }

      if (invitationData.invitedUserUid !== callerUid) {
        throw new functions.https.HttpsError("permission-denied", "This invitation is not for you.");
      }

      const allianceRef = db.collection("alliances").doc(invitationData.allianceId);
      const allianceDoc = await transaction.get(allianceRef);

      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Alliance not found.");
      }

      const allianceData = allianceDoc.data()!;
      const newMemberRef = allianceRef.collection("members").doc(callerUid);

      // Add member, update counts, and update invitation status
      transaction.set(newMemberRef, { uid: callerUid, role: 'member', joinedAt: FieldValue.serverTimestamp() });
      transaction.update(allianceRef, {
        memberCount: FieldValue.increment(1),
        safeboxBalance: FieldValue.increment(600)
      });
      transaction.update(invitationRef, { status: 'accepted' });

      // ✨ NEW: Create transaction record for the +600 bonus in alliance transactions
      const allianceTransactionRef = allianceRef.collection("transactions").doc();
      transaction.set(allianceTransactionRef, {
        type: 'invitation_bonus',
        amount: 600,
        currency: 'FSN',
        from: {
          uid: 'system',
          name: 'System',
          type: 'system'
        },
        to: {
          uid: invitationData.allianceId,
          name: allianceData.name,
          type: 'alliance'
        },
        description: `Invitation bonus for accepting member ${callerUid}`,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        metadata: {
          newMemberUid: callerUid,
          inviterUid: invitationData.inviterUid,
          invitationId: invitationId
        }
      });
    });

    return { status: "success", message: "Invitation accepted. Welcome to the alliance!" };

  } catch (error) {
    functions.logger.error("Error accepting invitation:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while accepting the invitation.");
  }
});

/**
 * Rejects an alliance invitation.
 * Can be called by either the invited user (to decline) or the inviter (to cancel).
 */
export const rejectAllianceInvitation = functions.https.onCall(async (data, context) => {
  const { invitationId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!invitationId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invitationId.");
  }

  const db = admin.firestore();
  const invitationRef = db.collection("allianceInvitations").doc(invitationId);

  const invitationDoc = await invitationRef.get();
  if (!invitationDoc.exists || invitationDoc.data()!.status !== 'pending') {
    throw new functions.https.HttpsError("not-found", "Invitation not found or has already been processed.");
  }

  const invitationData = invitationDoc.data()!;
  const isInvitedUser = invitationData.invitedUserUid === callerUid;
  const isInviter = invitationData.inviterUid === callerUid;

  // Allow either the invited user or the inviter to reject/cancel the invitation
  if (!isInvitedUser && !isInviter) {
    throw new functions.https.HttpsError("permission-denied", "You can only reject invitations sent to you or cancel invitations you sent.");
  }

  await invitationRef.update({
    status: isInviter ? 'cancelled' : 'rejected',
    updatedAt: FieldValue.serverTimestamp()
  });

  const message = isInviter ? "Invitation cancelled successfully." : "Invitation rejected.";
  return { status: "success", message };
});

/**
 * Submits a request to join an alliance.
 */
export const requestToJoinAlliance = functions.https.onCall(async (data, context) => {
  const { allianceId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to request to join an alliance.");
  }

  if (!allianceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId.");
  }

  const db = admin.firestore();

  // +++ ADDED COOLDOWN CHECK +++
  const userRef = db.collection("users").doc(callerUid);
  const userDoc = await userRef.get();
  if (userDoc.exists && userDoc.data()?.lastAllianceLeftAt) {
    const lastLeaveTime = userDoc.data()!.lastAllianceLeftAt.toMillis();
    const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
    if (Date.now() - lastLeaveTime < twentyFourHoursInMillis) {
      throw new functions.https.HttpsError("failed-precondition", "You must wait 24 hours after leaving an alliance before you can join a new one.");
    }
  }
  // +++ END COOLDOWN CHECK +++

  const activeMembershipQuery = db.collectionGroup("members").where("uid", "==", callerUid).limit(1);
  const activeMembershipSnap = await activeMembershipQuery.get();
  if (!activeMembershipSnap.empty) {
    const existingAllianceId = activeMembershipSnap.docs[0].ref.parent?.parent?.id;
    if (existingAllianceId === allianceId) {
      throw new functions.https.HttpsError("already-exists", "You are already a member of this alliance.");
    }
    throw new functions.https.HttpsError("failed-precondition", "You are already a member of another alliance.");
  }

  const allianceRef = db.collection("alliances").doc(allianceId);
  const requestRef = allianceRef.collection("joinRequests").doc(callerUid); // Use UID to prevent duplicate requests

  try {
    const allianceDoc = await allianceRef.get();
    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError("not-found", "The alliance you are trying to join does not exist.");
    }

    const requestDoc = await requestRef.get();
    if (requestDoc.exists) {
      const requestData = requestDoc.data();
      // If the request is pending, don't allow duplicate
      if (requestData?.status === 'pending') {
        throw new functions.https.HttpsError("already-exists", "You have already sent a join request to this alliance.");
      }
      // If the request was rejected, allow re-requesting by updating the existing document
      if (requestData?.status === 'rejected') {
        await requestRef.update({
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
          rejectedAt: FieldValue.delete(), // Remove the rejection timestamp
        });
        return { status: "success", message: "Your request to join the alliance has been sent again." };
      }
    }

    // Create new request if it doesn't exist
    await requestRef.set({
      requesterUid: callerUid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { status: "success", message: "Your request to join the alliance has been sent." };

  } catch (error) {
    functions.logger.error("Error requesting to join alliance:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while sending your join request.");
  }
});


/**
 * Updates an alliance's information. Only the leader can do this.
 */
export const updateAllianceInfo = functions.https.onCall(async (data, context) => {
  const { allianceId, name, logoUrl } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId.");
  }

  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 50) {
    throw new functions.https.HttpsError("invalid-argument", "Alliance name must be between 3 and 50 characters.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);

  try {
    const allianceDoc = await allianceRef.get();
    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Alliance not found.");
    }

    const allianceData = allianceDoc.data()!;
    if (allianceData.ownerUid !== callerUid && allianceData.leaderUid !== callerUid) {
      throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can update information.");
    }

    const updateData: { name: string; logoUrl?: string; updatedAt: any } = {
      name,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }

    await allianceRef.update(updateData);

    return { status: "success", message: "Alliance information updated successfully." };

  } catch (error) {
    functions.logger.error("Error updating alliance info:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
  }
});


/**
 * Creates a new alliance after validating complex business rules.
 */
export const createAlliance = functions.https.onCall(async (data, context) => {
  functions.logger.info("[createAlliance] Function started.", { structuredData: true });

  const uid = context.auth?.uid;
  if (!uid) {
    functions.logger.error("[createAlliance] User is not authenticated.");
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create an alliance.");
  }

  functions.logger.info(`[createAlliance] Authenticated user: ${uid}`);
  functions.logger.info("[createAlliance] Request data:", data);

  const { name, slug, visibility, logoUrl } = data;

  // Basic input validation
  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 50) {
    throw new functions.https.HttpsError("invalid-argument", "Alliance name must be between 3 and 50 characters.");
  }
  if (!slug || typeof slug !== 'string' || slug.length < 3 || slug.length > 50) {
    throw new functions.https.HttpsError("invalid-argument", "Alliance slug must be between 3 and 50 characters.");
  }

  try {
    functions.logger.info("[createAlliance] Initializing Firestore and references.");
    const fsnDb = admin.firestore();
    const userRef = fsnDb.collection("users").doc(uid);
    const alliancesRef = fsnDb.collection("alliances");
    functions.logger.info("[createAlliance] Firestore initialized. Starting transaction.");

    const result = await fsnDb.runTransaction(async (transaction) => {
      functions.logger.info("[createAlliance] Inside transaction.");

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        functions.logger.error(`[createAlliance] User profile not found for UID: ${uid}`);
        throw new functions.https.HttpsError("not-found", "Your user profile was not found.");
      }
      functions.logger.info("[createAlliance] User document fetched.");

      const userData = userDoc.data()!;

      // Cooldown Check
      if (userData.lastAllianceCreatedAt) {
        const lastCreationTime = userData.lastAllianceCreatedAt.toMillis();
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastCreationTime < sevenDaysInMillis) {
          throw new functions.https.HttpsError("failed-precondition", "You must wait 7 days between creating alliances.");
        }
      }

      const ledAlliancesQuery = alliancesRef.where("leaderUid", "==", uid);
      const ledAlliancesSnap = await transaction.get(ledAlliancesQuery);
      const ledAllianceCount = ledAlliancesSnap.size;
      const isAlreadyLeader = ledAllianceCount > 0;
      functions.logger.info(`[createAlliance] User currently leads ${ledAllianceCount} alliances.`);

      const ownedAlliancesQuery = alliancesRef.where("ownerUid", "==", uid);
      const ownedAlliancesSnap = await transaction.get(ownedAlliancesQuery);
      const ownedAllianceCount = ownedAlliancesSnap.size;
      functions.logger.info(`[createAlliance] User currently owns ${ownedAllianceCount} alliances.`);

      const userPlan = userData.plan || 'economy';
      const userBalance = userData.balance || 0;
      functions.logger.debug("[createAlliance] User data:", { userPlan, userBalance });

      let creationCost = 0;
      switch (userPlan) {
        case 'economy':
          creationCost = ownedAllianceCount === 0 ? 5000 : 100000;
          break;
        case 'business':
          creationCost = ownedAllianceCount === 0 ? 0 : 100000;
          break;
        case 'first-6':
        case 'first-lifetime':
          if (ownedAllianceCount >= 3) {
            throw new functions.https.HttpsError("permission-denied", "First Class members can create a maximum of 3 alliances.");
          }
          creationCost = 0;
          break;
        default:
          if (ownedAllianceCount > 0) {
            throw new functions.https.HttpsError("permission-denied", "Default members can only create one alliance.");
          }
          creationCost = 5000;
          break;
      }
      functions.logger.info(`[createAlliance] Calculated creation cost for plan '${userPlan}': ${creationCost}`);

      if (userBalance < creationCost) {
        functions.logger.error(`[createAlliance] Insufficient balance. Needed: ${creationCost}, Has: ${userBalance}`);
        throw new functions.https.HttpsError("failed-precondition", `Insufficient balance. You need ${creationCost} FSN, but you only have ${userBalance} FSN.`);
      }
      functions.logger.info("[createAlliance] Balance check passed.");

      const newAllianceRef = alliancesRef.doc(slug);
      const creatorRole = isAlreadyLeader ? 'co-leader' : 'leader';

      const newAllianceData = {
        id: slug,
        name,
        slug,
        ownerUid: uid, // Explicitly set owner to the creator's UID
        leaderUid: isAlreadyLeader ? null : uid, // Explicitly set leader to the creator's UID if they are not already a leader
        visibility: visibility || 'public',
        logoUrl: logoUrl || null,
        memberCount: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        level: 1,
        safeboxBalance: 0,
      };

      functions.logger.info("[createAlliance] Performing transaction writes.");

      const userUpdateData: { balance?: FieldValue; lastAllianceCreatedAt?: any; } = {};
      if (creationCost > 0) {
        userUpdateData.balance = FieldValue.increment(-creationCost);
      }
      userUpdateData.lastAllianceCreatedAt = FieldValue.serverTimestamp();

      transaction.update(userRef, userUpdateData);
      transaction.set(newAllianceRef, newAllianceData);

      const memberRef = newAllianceRef.collection('members').doc(uid);
      transaction.set(memberRef, { uid: uid, role: creatorRole, joinedAt: FieldValue.serverTimestamp() });
      functions.logger.info("[createAlliance] Transaction writes prepared.");

      return { slug: newAllianceData.slug, cost: creationCost };
    });

    functions.logger.info("[createAlliance] Transaction completed successfully.", { result });
    return { status: "success", message: `Alliance '${result.slug}' created successfully.`, cost: result.cost };

  } catch (error) {
    functions.logger.error("[createAlliance] Error creating alliance:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while creating the alliance.");
  }
});

/**
 * Removes a member from an alliance. Only the alliance leader can perform this action.
 */
export const removeAllianceMember = functions.https.onCall(async (data, context) => {
  const { allianceId, memberUid } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId || !memberUid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId or memberUid.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);
  const memberRef = allianceRef.collection("members").doc(memberUid);
  const userRef = db.collection("users").doc(memberUid);

  try {
    await db.runTransaction(async (transaction) => {
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Alliance not found.");
      }

      const allianceData = allianceDoc.data()!;
      if (allianceData.ownerUid !== callerUid && allianceData.leaderUid !== callerUid) {
        throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can remove members.");
      }

      if (memberUid === callerUid) {
        throw new functions.https.HttpsError("invalid-argument", "The leader cannot remove themselves from the alliance.");
      }

      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists) {
        throw new functions.https.HttpsError("not-found", "The specified member does not exist in this alliance.");
      }

      // Perform the deletion and decrement member count
      transaction.delete(memberRef);
      transaction.update(allianceRef, { memberCount: FieldValue.increment(-1) });
      transaction.set(userRef, { lastAllianceLeftAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    return { status: "success", message: "Member removed successfully." };

  } catch (error) {
    functions.logger.error("Error removing member:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while removing the member.");
  }
});

/**
 * Sets the role of a member in an alliance with enhanced security and audit logging.
 * - The Owner can make any role changes.
 * - The Leader (if not the owner) can only demote others to co-leader or member.
 * - Enforces a single co-leader per alliance.
 * - Includes comprehensive audit logging and notifications.
 */
export const setMemberRole = functions.https.onCall(async (data, context) => {
  try {
    const { allianceId, memberUid, newRole } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!allianceId || !memberUid || !newRole) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing allianceId, memberUid, or newRole');
    }

    if (!['leader', 'co-leader', 'member'].includes(newRole)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role specified');
    }

    const db = admin.firestore();
    const allianceRef = db.collection('alliances').doc(allianceId);
    const memberRef = allianceRef.collection('members').doc(memberUid);

    const result = await db.runTransaction(async (transaction) => {
      // Get alliance and check permissions
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Alliance not found');
      }

      const allianceData = allianceDoc.data()!;
      const isOwner = allianceData.ownerUid === callerUid;
      const isLeader = allianceData.leaderUid === callerUid;

      // Permission checks
      if (!isOwner && !isLeader) {
        throw new functions.https.HttpsError('permission-denied', 'Only owner or leader can modify roles');
      }

      if (isLeader && !isOwner && newRole === 'leader') {
        throw new functions.https.HttpsError('permission-denied', 'Only owner can promote to leader');
      }

      // Check if target member exists
      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Member not found');
      }

      const oldRole = memberDoc.data()!.role;

      // Handle role-specific logic
      if (newRole === 'leader') {
        // Ensure only one leader - demote current leader if different
        if (allianceData.leaderUid && allianceData.leaderUid !== memberUid) {
          const oldLeaderRef = allianceRef.collection('members').doc(allianceData.leaderUid);
          transaction.update(oldLeaderRef, { role: 'member' });
        }
        transaction.update(allianceRef, { leaderUid: memberUid });
      } else if (newRole === 'co-leader') {
        // Ensure only one co-leader
        const coLeadersQuery = allianceRef.collection('members').where('role', '==', 'co-leader');
        const coLeadersSnap = await transaction.get(coLeadersQuery);
        for (const doc of coLeadersSnap.docs) {
          if (doc.id !== memberUid) {
            transaction.update(doc.ref, { role: 'member' });
          }
        }
      }

      // Update member role
      transaction.update(memberRef, { role: newRole, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      // Log the action
      const logRef = allianceRef.collection('activityLogs').doc();
      transaction.set(logRef, {
        type: 'role_change',
        actorUid: callerUid,
        targetUid: memberUid,
        oldRole,
        newRole,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notification for the affected member
      const notificationRef = db.collection('users').doc(memberUid).collection('allianceNotifications').doc();
      transaction.set(notificationRef, {
        type: 'role_changed',
        allianceId,
        allianceName: allianceData.name,
        oldRole,
        newRole,
        changedBy: callerUid,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, oldRole, newRole };
    });

    return { success: true, message: 'Member role updated successfully' };

  } catch (error) {
    console.error('Error in setMemberRole:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update member role');
  }
});

/**
 * Deletes an alliance and all its subcollections. Only the alliance leader can perform this action.
 */
export const deleteAlliance = functions.https.onCall(async (data, context) => {
  const { allianceId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);

  try {
    const allianceDoc = await allianceRef.get();
    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Alliance not found.");
    }

    const allianceData = allianceDoc.data()!;
    if (allianceData.ownerUid !== callerUid) {
      throw new functions.https.HttpsError("permission-denied", "Only the alliance owner can delete the alliance.");
    }

    // Delete all subcollections
    const subcollections = ['members', 'joinRequests']; // Add other subcollections here if any
    for (const subcollection of subcollections) {
      const snapshot = await allianceRef.collection(subcollection).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete the main alliance document
    await allianceRef.delete();

    return { status: "success", message: "Alliance deleted successfully." };

  } catch (error) {
    functions.logger.error("Error deleting alliance:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while deleting the alliance.");
  }
});

// Enhanced distributeProfits with better validation
export const distributeProfits = functions.https.onCall(async (data, context) => {
  try {
    const { allianceId, memberUid, amount } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!allianceId || !memberUid || !amount || typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid distribution parameters');
    }

    const db = admin.firestore();

    // Use transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      const allianceRef = db.collection('alliances').doc(allianceId);
      const memberRef = db.collection('users').doc(memberUid);

      // Get documents
      const allianceDoc = await transaction.get(allianceRef);
      const memberDoc = await transaction.get(memberRef);

      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Alliance not found');
      }

      if (!memberDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Member not found');
      }

      const allianceData = allianceDoc.data()!;
      const memberData = memberDoc.data()!;

      // Check permissions
      const isOwner = allianceData.ownerUid === callerUid;
      const isLeader = allianceData.leaderUid === callerUid;

      if (!isOwner && !isLeader) {
        throw new functions.https.HttpsError('permission-denied', 'Only owner or leader can distribute profits');
      }

      // Verify member is part of alliance
      const memberCheckRef = allianceRef.collection('members').doc(memberUid);
      const memberCheckDoc = await transaction.get(memberCheckRef);

      if (!memberCheckDoc.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'User is not a member of this alliance');
      }

      // Check sufficient safebox balance
      const safeboxBalance = allianceData.safeboxBalance || 0;
      if (safeboxBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient safebox balance');
      }

      // Distribution limits (optional)
      const maxDistributionPerMember = 50000; // FSN per distribution
      if (amount > maxDistributionPerMember) {
        throw new functions.https.HttpsError('failed-precondition', 'Distribution amount exceeds limit');
      }

      // Perform the distribution
      transaction.update(allianceRef, { safeboxBalance: admin.firestore.FieldValue.increment(-amount) });
      transaction.update(memberRef, { balance: admin.firestore.FieldValue.increment(amount) });

      // Create transaction records
      const memberTransactionRef = memberRef.collection('transactions').doc();
      transaction.set(memberTransactionRef, {
        type: 'profit',
        amount,
        allianceId,
        allianceName: allianceData.name,
        description: `Profit distribution from ${allianceData.name}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          distributorUid: callerUid,
          allianceLogoUrl: allianceData.logoUrl || null
        }
      });

      const allianceTransactionRef = allianceRef.collection('transactions').doc();
      transaction.set(allianceTransactionRef, {
        type: 'profit_distribution',
        amount,
        from: {
          uid: allianceId,
          name: allianceData.name,
          type: 'alliance'
        },
        to: {
          uid: memberUid,
          name: memberData.fullName || 'Unknown',
          type: 'user'
        },
        description: `Profit distribution to ${memberData.fullName || 'Unknown'}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          distributorUid: callerUid
        }
      });

      // Create notification for the member
      const notificationRef = db.collection('users').doc(memberUid)
        .collection('allianceNotifications').doc();

      transaction.set(notificationRef, {
        type: 'profit_distribution',
        amount,
        allianceId,
        allianceName: allianceData.name,
        allianceLogoUrl: allianceData.logoUrl || null,
        distributorUid: callerUid,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        newSafeboxBalance: safeboxBalance - amount,
        distributedAmount: amount
      };
    });

    return {
      success: true,
      newSafeboxBalance: result.newSafeboxBalance,
      message: `Successfully distributed ${amount} FSN to member`
    };

  } catch (error) {
    console.error('Error in distributeProfits:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to distribute profits');
  }
});

/**
 * Approves a join request for an alliance. Only leaders or admins can do this.
 */
export const approveJoinRequest = functions.https.onCall(async (data, context) => {
  const { allianceId, requesterUid } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId || !requesterUid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId or requesterUid.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);
  const callerMemberRef = allianceRef.collection("members").doc(callerUid);
  const requestRef = allianceRef.collection("joinRequests").doc(requesterUid);
  const newMemberRef = allianceRef.collection("members").doc(requesterUid);

  try {
    await db.runTransaction(async (transaction) => {
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Alliance not found.");
      }
      const allianceData = allianceDoc.data()!;
      const isOwner = allianceData.ownerUid === callerUid;

      const callerMemberDoc = await transaction.get(callerMemberRef);
      const memberRole = callerMemberDoc.exists ? callerMemberDoc.data()!.role : '';
      const canManage = isOwner || ['leader', 'co-leader', 'admin'].includes(memberRole);

      if (!canManage) {
        throw new functions.https.HttpsError("permission-denied", "Only the owner, leader, or co-leaders can approve requests.");
      }

      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Join request not found. It may have been cancelled.");
      }

      const existingMembershipQuery = db.collectionGroup("members").where("uid", "==", requesterUid).limit(1);
      const existingMembershipSnap = await transaction.get(existingMembershipQuery);
      if (!existingMembershipSnap.empty) {
        const existingAllianceId = existingMembershipSnap.docs[0].ref.parent?.parent?.id;
        if (existingAllianceId === allianceId) {
          throw new functions.https.HttpsError("already-exists", "This user is already a member of this alliance.");
        }
        throw new functions.https.HttpsError("failed-precondition", "This user is already a member of another alliance.");
      }

      // Create new member, delete request, and update counts
      transaction.set(newMemberRef, { uid: requesterUid, role: 'member', joinedAt: FieldValue.serverTimestamp() });
      transaction.delete(requestRef);
      transaction.update(allianceRef, {
        memberCount: FieldValue.increment(1),
        safeboxBalance: FieldValue.increment(600)
      });

      // ✨ NEW: Create transaction record for the +600 bonus in alliance transactions
      const allianceTransactionRef = allianceRef.collection("transactions").doc();
      transaction.set(allianceTransactionRef, {
        type: 'join_bonus',
        amount: 600,
        currency: 'FSN',
        from: {
          uid: 'system',
          name: 'System',
          type: 'system'
        },
        to: {
          uid: allianceId,
          name: allianceData.name,
          type: 'alliance'
        },
        description: `Join bonus for approving member ${requesterUid}`,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        metadata: {
          newMemberUid: requesterUid,
          approverUid: callerUid
        }
      });
    });

    return { status: "success", message: "Member approved and added to the alliance." };

  } catch (error) {
    functions.logger.error("Error approving join request:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while approving the request.");
  }
});

/**
 * Rejects a join request for an alliance. Only leaders or admins can do this.
 */
export const rejectJoinRequest = functions.https.onCall(async (data, context) => {
  const { allianceId, requesterUid } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!allianceId || !requesterUid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId or requesterUid.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);
  const callerMemberRef = allianceRef.collection("members").doc(callerUid);
  const requestRef = allianceRef.collection("joinRequests").doc(requesterUid);

  try {
    const allianceDoc = await allianceRef.get();
    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Alliance not found.");
    }
    const allianceData = allianceDoc.data()!;
    const isOwner = allianceData.ownerUid === callerUid;

    const callerMemberDoc = await callerMemberRef.get();
    const memberRole = callerMemberDoc.exists ? callerMemberDoc.data()!.role : '';
    const canManage = isOwner || ['leader', 'co-leader', 'admin'].includes(memberRole);

    if (!canManage) {
      throw new functions.https.HttpsError("permission-denied", "Only the owner, leader, or co-leaders can reject requests.");
    }

    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Join request not found. It may have been cancelled.");
    }

    // Update the request status to 'rejected'
    await requestRef.update({
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
    });

    return { status: "success", message: "Join request rejected." };

  } catch (error) {
    functions.logger.error("Error rejecting join request:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while rejecting the request.");
  }
});

/**
 * Gets all pending actions (requests and invitations) related to the current user.
 */
export const getPendingActions = functions.https.onCall(async (data, context) => {
  const callerUid = context.auth?.uid;
  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const db = admin.firestore();

  // 1. Get INCOMING JOIN REQUESTS (requests for alliances I manage)
  const getIncomingRequests = async () => {
    const memberDocs = await db.collectionGroup('members')
      .where('uid', '==', callerUid)
      .where('role', 'in', ['leader', 'co-leader'])
      .get();
    const managedAllianceIdsFromRoles = memberDocs.docs.map(doc => doc.ref.parent.parent!.id);

    const ownerSnapshot = await db.collection('alliances').where('ownerUid', '==', callerUid).get();
    const ownerAllianceIds = ownerSnapshot.docs.map(doc => doc.id);

    const managedAllianceIds = Array.from(new Set([
      ...managedAllianceIdsFromRoles,
      ...ownerAllianceIds,
    ]));
    if (managedAllianceIds.length === 0) return [];

    const requestsPromises = managedAllianceIds.map(async (allianceId) => {
      const requestsQuery = db.collection('alliances').doc(allianceId).collection('joinRequests').where('status', '==', 'pending');
      const snapshot = await requestsQuery.get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, allianceId }));
    });
    const nestedRequests = await Promise.all(requestsPromises);
    const flatRequests = nestedRequests.flat();

    return Promise.all(flatRequests.map(async (req: any) => {
      // Skip if requesterUid or allianceId is missing
      if (!req.requesterUid || !req.allianceId) {
        functions.logger.warn(`Skipping request with missing data: ${JSON.stringify(req)}`);
        return null;
      }

      const [requesterDoc, allianceDoc] = await Promise.all([
        db.collection('users').doc(req.requesterUid).get(),
        db.collection('alliances').doc(req.allianceId).get(),
      ]);
      return {
        ...req,
        type: 'incoming_request',
        requester: requesterDoc.exists ? { fullName: requesterDoc.data()!.fullName, avatarUrl: requesterDoc.data()!.avatarUrl } : {},
        alliance: allianceDoc.exists ? { name: allianceDoc.data()!.name, logoUrl: allianceDoc.data()!.logoUrl } : {},
      };
    })).then(results => results.filter(r => r !== null));
  };

  // 2. Get INCOMING INVITATIONS (invitations sent to me)
  const getInvitations = async () => {
    const invitationsQuery = db.collection('allianceInvitations').where('invitedUserUid', '==', callerUid).where('status', '==', 'pending');
    const snapshot = await invitationsQuery.get();

    return Promise.all(snapshot.docs.map(async (doc) => {
      const invitation = doc.data();
      const [inviterDoc, allianceDoc] = await Promise.all([
        db.collection('users').doc(invitation.inviterUid).get(),
        db.collection('alliances').doc(invitation.allianceId).get(),
      ]);
      return {
        ...invitation,
        id: doc.id,
        type: 'invitation',
        inviter: inviterDoc.exists ? { fullName: inviterDoc.data()!.fullName, avatarUrl: inviterDoc.data()!.avatarUrl } : {},
        alliance: allianceDoc.exists ? { name: allianceDoc.data()!.name, logoUrl: allianceDoc.data()!.logoUrl } : {},
      };
    }));
  };

  // 3. Get OUTGOING JOIN REQUESTS (requests I have sent)
  const getOutgoingRequests = async () => {
    const requestsQuery = db.collectionGroup('joinRequests').where('requesterUid', '==', callerUid).where('status', '==', 'pending');
    const snapshot = await requestsQuery.get();

    return Promise.all(snapshot.docs.map(async (doc) => {
      const req = doc.data();
      const allianceId = doc.ref.parent.parent!.id;
      const allianceDoc = await db.collection('alliances').doc(allianceId).get();
      return {
        ...req,
        id: doc.id,
        allianceId,
        type: 'outgoing_request',
        alliance: allianceDoc.exists ? { name: allianceDoc.data()!.name, logoUrl: allianceDoc.data()!.logoUrl } : {},
      };
    }));
  };

  const getSentInvitations = async () => {
    const invitationsQuery = db.collection('allianceInvitations')
      .where('inviterUid', '==', callerUid)
      .where('status', '==', 'pending');
    const snapshot = await invitationsQuery.get();

    return Promise.all(snapshot.docs.map(async (doc) => {
      const invitation = doc.data();
      const inviterUid = typeof invitation.inviterUid === 'string' ? invitation.inviterUid : null;
      const invitedUserUid = typeof invitation.invitedUserUid === 'string' ? invitation.invitedUserUid : null;
      const allianceId = typeof invitation.allianceId === 'string' ? invitation.allianceId : null;

      const invitedUserDoc = invitedUserUid ? await db.collection('users').doc(invitedUserUid).get() : null;
      const allianceDoc = allianceId ? await db.collection('alliances').doc(allianceId).get() : null;

      return {
        ...invitation,
        id: doc.id,
        type: 'sent_invitation',
        invitedUser: invitedUserDoc?.exists
          ? { fullName: invitedUserDoc.data()!.fullName, avatarUrl: invitedUserDoc.data()!.avatarUrl }
          : {},
        alliance: allianceDoc?.exists
          ? { name: allianceDoc.data()!.name, logoUrl: allianceDoc.data()!.logoUrl }
          : {},
        inviterUid
      };
    }));
  };

  try {
    const [incomingRequests, invitations, outgoingRequests, sentInvitations] = await Promise.all([
      getIncomingRequests(),
      getInvitations(),
      getOutgoingRequests(),
      getSentInvitations(),
    ]);

    const allActions = [...incomingRequests, ...invitations, ...outgoingRequests, ...sentInvitations];

    // Sort by creation date, newest first
    allActions.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });

    return allActions;

  } catch (error) {
    functions.logger.error("Error getting pending actions:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching pending actions.");
  }
});

export const cancelJoinRequest = functions.https.onCall(async (data, context) => {
  const { allianceId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }
  if (!allianceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId.");
  }

  const db = admin.firestore();
  const requestRef = db.collection('alliances').doc(allianceId).collection('joinRequests').doc(callerUid);

  const requestDoc = await requestRef.get();
  if (!requestDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Join request not found or was already processed.");
  }

  if (requestDoc.data()!.requesterUid !== callerUid) {
    throw new functions.https.HttpsError("permission-denied", "You can only cancel your own join requests.");
  }

  await requestRef.delete();

  return { status: "success", message: "Your join request has been cancelled." };
});

export const leaveAlliance = functions.https.onCall(async (data, context) => {
  const { allianceId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }
  if (!allianceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing allianceId.");
  }

  const db = admin.firestore();
  const allianceRef = db.collection("alliances").doc(allianceId);
  const memberRef = allianceRef.collection("members").doc(callerUid);
  const userRef = db.collection("users").doc(callerUid); // <-- ADDED

  return db.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists) {
      throw new functions.https.HttpsError("not-found", "You are not a member of this alliance.");
    }
    if (memberDoc.data()?.role === 'leader') {
      throw new functions.https.HttpsError("permission-denied", "A leader cannot leave their alliance. You must delete it or transfer ownership.");
    }

    transaction.delete(memberRef);
    transaction.update(allianceRef, { memberCount: FieldValue.increment(-1) });
    // +++ ADDED +++
    transaction.update(userRef, { lastAllianceLeftAt: FieldValue.serverTimestamp() });

    return { status: "success", message: "You have left the alliance." };
  });
});

// Enhanced donateToAlliance with better security
export const donateToAlliance = functions.https.onCall(async (data, context) => {
  try {
    const { allianceId, amount } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!allianceId || !amount || typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid donation parameters');
    }

    const db = admin.firestore();

    // Use transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(callerUid);
      const allianceRef = db.collection('alliances').doc(allianceId);

      // Get current balances
      const userDoc = await transaction.get(userRef);
      const allianceDoc = await transaction.get(allianceRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      if (!allianceDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Alliance not found');
      }

      const userData = userDoc.data()!;
      const allianceData = allianceDoc.data()!;
      const currentBalance = userData.balance || 0;

      // Validate sufficient balance
      if (currentBalance < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
      }

      // Check donation limits (optional)
      const dailyDonationLimit = 10000; // FSN per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check recent donations (last 24 hours)
      const recentDonationsQuery = db.collection('users').doc(callerUid)
        .collection('transactions')
        .where('type', '==', 'donation')
        .where('allianceId', '==', allianceId)
        .where('createdAt', '>=', today);

      const recentDonationsSnap = await transaction.get(recentDonationsQuery);
      const totalToday = recentDonationsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      if (totalToday + amount > dailyDonationLimit) {
        throw new functions.https.HttpsError('failed-precondition', 'Daily donation limit exceeded');
      }

      // Perform the donation
      transaction.update(userRef, { balance: admin.firestore.FieldValue.increment(-amount) });
      transaction.update(allianceRef, { safeboxBalance: admin.firestore.FieldValue.increment(amount) });

      // Create transaction records
      const userTransactionRef = userRef.collection('transactions').doc();
      transaction.set(userTransactionRef, {
        type: 'donation',
        amount,
        allianceId,
        allianceName: allianceData.name,
        description: `Donation to ${allianceData.name}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const allianceTransactionRef = allianceRef.collection('transactions').doc();
      transaction.set(allianceTransactionRef, {
        type: 'donation',
        amount,
        from: {
          uid: callerUid,
          name: userData.fullName || 'Anonymous',
          type: 'user'
        },
        to: {
          uid: allianceId,
          name: allianceData.name,
          type: 'alliance'
        },
        description: `Donation from ${userData.fullName || 'Anonymous'}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notification for alliance leaders (if not self-donation)
      const isLeader = allianceData.leaderUid === callerUid || allianceData.ownerUid === callerUid;
      if (!isLeader) {
        const notificationRef = allianceRef.collection('notifications').doc();
        transaction.set(notificationRef, {
          type: 'donation',
          amount,
          donatorUid: callerUid,
          donatorName: userData.fullName || 'Anonymous',
          donatorAvatarUrl: userData.avatarUrl || null,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { newBalance: currentBalance - amount };
    });

    return {
      success: true,
      newBalance: result.newBalance,
      message: 'Donation completed successfully'
    };

  } catch (error) {
    console.error('Error in donateToAlliance:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to process donation');
  }
});

/**
 * A scheduled function that runs every 24 hours to delete inactive alliances.
 * An alliance is considered inactive if it is older than 30 days and has fewer than 5 members.
 */
export const checkInactiveAlliances = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  functions.logger.info('Running scheduled job: checkInactiveAlliances');
  const db = admin.firestore();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const alliancesRef = db.collection('alliances');
  const inactiveQuery = alliancesRef
    .where('memberCount', '<', 5)
    .where('createdAt', '<', thirtyDaysAgo);

  try {
    const snapshot = await inactiveQuery.get();
    if (snapshot.empty) {
      functions.logger.info('No inactive alliances found to delete.');
      return null;
    }

    functions.logger.info(`Found ${snapshot.size} inactive alliances to delete.`);
    const deletionPromises: Promise<any>[] = [];

    snapshot.forEach(doc => {
      const allianceId = doc.id;
      functions.logger.info(`Preparing to delete alliance: ${allianceId}`);
      const allianceRef = doc.ref;

      // Replicate deletion logic from deleteAlliance function to ensure atomicity for each deletion
      const deletePromise = (async () => {
        const subcollections = ['members', 'joinRequests', 'donations']; // Ensure all relevant subcollections are listed
        for (const subcollection of subcollections) {
          try {
            const subSnapshot = await allianceRef.collection(subcollection).limit(500).get(); // Limit to 500 per batch
            if (!subSnapshot.empty) {
              const batch = db.batch();
              subSnapshot.docs.forEach(subDoc => batch.delete(subDoc.ref));
              await batch.commit();
              functions.logger.info(`Deleted ${subSnapshot.size} documents from ${subcollection} for alliance ${allianceId}`);
            }
          } catch (subError) {
            functions.logger.error(`Error deleting subcollection ${subcollection} for alliance ${allianceId}:`, subError);
          }
        }
        await allianceRef.delete();
        functions.logger.info(`Successfully deleted alliance document: ${allianceId}`);
      })();
      deletionPromises.push(deletePromise);
    });

    await Promise.all(deletionPromises);
    functions.logger.info(`Completed deletion of ${snapshot.size} inactive alliances.`);
    return { status: 'success', deletedCount: snapshot.size };

  } catch (error) {
    functions.logger.error('Error in checkInactiveAlliances scheduled function:', error);
    return null;
  }
});

/**
 * Gets alliance notifications for leaders/co-leaders/owners (NEW for Task 6)
 * Returns donation notifications from alliances/{allianceId}/notifications
 * And profit distribution notifications from users/{userId}/allianceNotifications
 */
export const getAllianceNotifications = functions.https.onCall(async (data, context) => {
  const callerUid = context.auth?.uid;
  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const db = admin.firestore();

  try {
    // 1. Get alliances where user is leader/co-leader/owner
    const memberDocs = await db.collectionGroup('members')
      .where('uid', '==', callerUid)
      .where('role', 'in', ['leader', 'co-leader'])
      .get();
    const managedAllianceIdsFromRoles = memberDocs.docs.map(doc => doc.ref.parent.parent!.id);

    const ownerSnapshot = await db.collection('alliances').where('ownerUid', '==', callerUid).get();
    const ownerAllianceIds = ownerSnapshot.docs.map(doc => doc.id);

    const managedAllianceIds = Array.from(new Set([
      ...managedAllianceIdsFromRoles,
      ...ownerAllianceIds,
    ]));

    // 2. Get donation notifications from managed alliances
    const donationNotifications: any[] = [];
    if (managedAllianceIds.length > 0) {
      const notificationsPromises = managedAllianceIds.map(async (allianceId) => {
        const notificationsQuery = db.collection('alliances').doc(allianceId)
          .collection('notifications')
          .where('type', '==', 'donation')
          .where('read', '==', false)
          .orderBy('createdAt', 'desc')
          .limit(20);
        const snapshot = await notificationsQuery.get();
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, allianceId }));
      });
      const nestedNotifications = await Promise.all(notificationsPromises);
      donationNotifications.push(...nestedNotifications.flat());
    }

    // 3. Get profit distribution notifications for this user
    const profitNotificationsQuery = db.collection('users').doc(callerUid)
      .collection('allianceNotifications')
      .where('type', '==', 'profit_distribution')
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(20);
    const profitSnapshot = await profitNotificationsQuery.get();
    const profitNotifications = profitSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // 4. Combine and sort all notifications
    const allNotifications = [...donationNotifications, ...profitNotifications];
    allNotifications.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });

    return allNotifications;

  } catch (error) {
    functions.logger.error("Error getting alliance notifications:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching notifications.");
  }
});

/**
 * Gets rejected join requests for the current user
 */
export const getRejectedRequests = functions.https.onCall(async (data, context) => {
  const callerUid = context.auth?.uid;
  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const db = admin.firestore();

  try {
    // Get rejected requests where user is the requester
    const requestsQuery = db.collectionGroup('joinRequests')
      .where('requesterUid', '==', callerUid)
      .where('status', '==', 'rejected');
    const snapshot = await requestsQuery.get();

    const rejectedRequests = await Promise.all(snapshot.docs.map(async (doc) => {
      const req = doc.data();
      const allianceId = doc.ref.parent.parent!.id;
      const allianceDoc = await db.collection('alliances').doc(allianceId).get();
      return {
        ...req,
        id: doc.id,
        allianceId,
        type: 'rejected_request',
        alliance: allianceDoc.exists
          ? { name: allianceDoc.data()!.name, logoUrl: allianceDoc.data()!.logoUrl }
          : {},
      };
    }));

    // Sort by rejection date, newest first
    rejectedRequests.sort((a: any, b: any) => {
      const timeA = a.rejectedAt?.toMillis() || 0;
      const timeB = b.rejectedAt?.toMillis() || 0;
      return timeB - timeA;
    });

    return rejectedRequests;

  } catch (error) {
    functions.logger.error("Error getting rejected requests:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching rejected requests.");
  }
});

/**
 * Marks alliance notifications as read (NEW for Task 6)
 */
export const markAllianceNotificationsAsRead = functions.https.onCall(async (data, context) => {
  const { notificationIds, allianceId } = data;
  const callerUid = context.auth?.uid;

  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!notificationIds || !Array.isArray(notificationIds)) {
    throw new functions.https.HttpsError("invalid-argument", "notificationIds must be an array.");
  }

  const db = admin.firestore();

  try {
    const batch = db.batch();

    for (const notifId of notificationIds) {
      // Check if it's an alliance notification or user notification
      if (allianceId) {
        const notifRef = db.collection('alliances').doc(allianceId).collection('notifications').doc(notifId);
        batch.update(notifRef, { read: true, readAt: FieldValue.serverTimestamp() });
      } else {
        const notifRef = db.collection('users').doc(callerUid).collection('allianceNotifications').doc(notifId);
        batch.update(notifRef, { read: true, readAt: FieldValue.serverTimestamp() });
      }
    }

    await batch.commit();
    return { status: "success", message: "Notifications marked as read." };

  } catch (error) {
    functions.logger.error("Error marking notifications as read:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
  }
});

/**
 * Updates member online status in their alliance
 * Called when user enters/exits alliance dashboard
 */
export const updateMemberOnlineStatus = functions.https.onCall(async (data, context) => {
  const { status } = data; // 'online' | 'offline'
  const callerUid = context.auth?.uid;

  functions.logger.info(`[updateMemberOnlineStatus] 🚀 Function called`);
  functions.logger.info(`[updateMemberOnlineStatus] 👤 User: ${callerUid}`);
  functions.logger.info(`[updateMemberOnlineStatus] 📊 Status: ${status}`);

  if (!callerUid) {
    functions.logger.error(`[updateMemberOnlineStatus] ❌ No authenticated user`);
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!status || !['online', 'offline'].includes(status)) {
    functions.logger.error(`[updateMemberOnlineStatus] ❌ Invalid status: ${status}`);
    throw new functions.https.HttpsError("invalid-argument", "Status must be 'online' or 'offline'.");
  }

  const db = admin.firestore();

  try {
    functions.logger.info(`[updateMemberOnlineStatus] 🔍 Searching for user memberships...`);

    // Find all alliances where user is a member
    const memberQuery = db.collectionGroup('members').where('uid', '==', callerUid);
    const memberSnapshot = await memberQuery.get();

    functions.logger.info(`[updateMemberOnlineStatus] 📦 Found ${memberSnapshot.size} membership(s)`);

    if (memberSnapshot.empty) {
      functions.logger.warn(`[updateMemberOnlineStatus] ⚠️ User is not a member of any alliance`);
      return { status: "success", message: "No alliance memberships found.", updated: 0 };
    }

    // Log alliance IDs
    memberSnapshot.docs.forEach(doc => {
      const allianceId = doc.ref.parent.parent?.id;
      functions.logger.info(`[updateMemberOnlineStatus] 🏰 Alliance: ${allianceId}`);
    });

    // Update status in all alliances (usually just one, but could be multiple if co-leader)
    const batch = db.batch();
    let updateCount = 0;

    memberSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        onlineStatus: status,
        lastSeen: FieldValue.serverTimestamp()
      });
      updateCount++;
    });

    functions.logger.info(`[updateMemberOnlineStatus] 💾 Committing batch update...`);
    await batch.commit();
    functions.logger.info(`[updateMemberOnlineStatus] ✅ Batch committed successfully`);

    functions.logger.info(`[updateMemberOnlineStatus] ✅ Updated online status to '${status}' for user ${callerUid} in ${updateCount} alliance(s)`);

    return {
      status: "success",
      message: `Online status updated to '${status}' in ${updateCount} alliance(s).`,
      updated: updateCount
    };

  } catch (error) {
    functions.logger.error("[updateMemberOnlineStatus] ❌ Error:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while updating online status.");
  }
});

/**
 * Cloud Function to securely fetch alliance details and members
 * Implements permission checks and proper data filtering
 */
interface GetAllianceRequest {
  allianceId: string;
}

interface GetAllianceResponse {
  alliance: {
    id: string;
    name: string;
    slug: string;
    ownerUid: string;
    leaderUid?: string;
    visibility: string;
    logoUrl?: string;
    memberCount: number;
    safeboxBalance: number;
    level: number;
    createdAt: any;
    updatedAt: any;
  };
  members: Array<{
    uid: string;
    role: string;
    joinedAt: any;
    onlineStatus?: string;
    lastSeen?: any;
  }>;
  isMember: boolean;
  canManage: boolean;
}

export const getAlliance = functions.https.onCall(async (data: GetAllianceRequest, context): Promise<GetAllianceResponse> => {
  try {
    const { allianceId } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();
    const allianceRef = db.collection('alliances').doc(allianceId);
    const allianceDoc = await allianceRef.get();

    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Alliance not found');
    }

    const allianceData = allianceDoc.data()!;

    // Check visibility permissions
    if (allianceData.visibility === 'private') {
      // Check if user is a member
      const memberRef = allianceRef.collection('members').doc(callerUid);
      const memberDoc = await memberRef.get();
      if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Alliance is private');
      }
    }

    // Get members
    const membersSnapshot = await allianceRef.collection('members').get();
    const members = membersSnapshot.docs.map(doc => ({
      uid: doc.id,
      role: doc.data().role || 'member',
      joinedAt: doc.data().joinedAt,
      onlineStatus: doc.data().onlineStatus,
      lastSeen: doc.data().lastSeen
    }));

    // Check user permissions
    const isOwner = allianceData.ownerUid === callerUid;
    const isLeader = allianceData.leaderUid === callerUid;
    const userMemberData = members.find(m => m.uid === callerUid);
    const canManage = isOwner || isLeader || ['co-leader', 'admin'].includes(userMemberData?.role);

    return {
      alliance: {
        id: allianceDoc.id,
        name: allianceData.name,
        slug: allianceData.slug,
        ownerUid: allianceData.ownerUid,
        leaderUid: allianceData.leaderUid,
        visibility: allianceData.visibility,
        logoUrl: allianceData.logoUrl,
        memberCount: allianceData.memberCount || 0,
        safeboxBalance: allianceData.safeboxBalance || 0,
        level: allianceData.level || 1,
        createdAt: allianceData.createdAt,
        updatedAt: allianceData.updatedAt
      },
      members,
      isMember: !!userMemberData,
      canManage
    };

  } catch (error) {
    console.error('Error in getAlliance function:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch alliance');
  }
});