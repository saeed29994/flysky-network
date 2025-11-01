"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberOnlineStatus = exports.markAllianceNotificationsAsRead = exports.getRejectedRequests = exports.getAllianceNotifications = exports.checkInactiveAlliances = exports.donateToAlliance = exports.leaveAlliance = exports.cancelJoinRequest = exports.getPendingActions = exports.rejectJoinRequest = exports.approveJoinRequest = exports.distributeProfits = exports.deleteAlliance = exports.modifyAllianceMemberRole = exports.removeAllianceMember = exports.createAlliance = exports.updateAllianceInfo = exports.requestToJoinAlliance = exports.rejectAllianceInvitation = exports.acceptAllianceInvitation = exports.inviteUserToAlliance = exports.searchUsers = exports.helloWorld = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
/**
 * A simple callable function for testing
 */
exports.helloWorld = functions.https.onCall((data, context) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    return { message: `Hello, ${data.name}!` };
});
/**
 * Searches for users by email.
 * Note: Firestore is not optimized for partial string searches.
 * This function currently supports exact email matching.
 */
exports.searchUsers = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        functions.logger.error("Error searching for users:", error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while searching for users.");
    }
});
/**
 * Invites a user to join an alliance. Only the alliance leader can perform this action.
 */
exports.inviteUserToAlliance = functions.https.onCall(async (data, context) => {
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
            const allianceData = allianceDoc.data();
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
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        return { status: "success", message: "Invitation sent successfully." };
    }
    catch (error) {
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
exports.acceptAllianceInvitation = functions.https.onCall(async (data, context) => {
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
                const lastLeaveTime = userDoc.data().lastAllianceLeftAt.toMillis();
                const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
                if (Date.now() - lastLeaveTime < twentyFourHoursInMillis) {
                    throw new functions.https.HttpsError("failed-precondition", "You must wait 24 hours after leaving an alliance before you can join a new one.");
                }
            }
            // +++ END COOLDOWN CHECK +++
            const invitationDoc = await transaction.get(invitationRef);
            if (!invitationDoc.exists || invitationDoc.data().status !== 'pending') {
                throw new functions.https.HttpsError("not-found", "Invitation not found or has already been processed.");
            }
            const invitationData = invitationDoc.data();
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
            const allianceData = allianceDoc.data();
            const newMemberRef = allianceRef.collection("members").doc(callerUid);
            // Add member, update counts, and update invitation status
            transaction.set(newMemberRef, { uid: callerUid, role: 'member', joinedAt: firestore_1.FieldValue.serverTimestamp() });
            transaction.update(allianceRef, {
                memberCount: firestore_1.FieldValue.increment(1),
                safeboxBalance: firestore_1.FieldValue.increment(600)
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
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                completedAt: firestore_1.FieldValue.serverTimestamp(),
                metadata: {
                    newMemberUid: callerUid,
                    inviterUid: invitationData.inviterUid,
                    invitationId: invitationId
                }
            });
        });
        return { status: "success", message: "Invitation accepted. Welcome to the alliance!" };
    }
    catch (error) {
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
exports.rejectAllianceInvitation = functions.https.onCall(async (data, context) => {
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
    if (!invitationDoc.exists || invitationDoc.data().status !== 'pending') {
        throw new functions.https.HttpsError("not-found", "Invitation not found or has already been processed.");
    }
    const invitationData = invitationDoc.data();
    const isInvitedUser = invitationData.invitedUserUid === callerUid;
    const isInviter = invitationData.inviterUid === callerUid;
    // Allow either the invited user or the inviter to reject/cancel the invitation
    if (!isInvitedUser && !isInviter) {
        throw new functions.https.HttpsError("permission-denied", "You can only reject invitations sent to you or cancel invitations you sent.");
    }
    await invitationRef.update({
        status: isInviter ? 'cancelled' : 'rejected',
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    });
    const message = isInviter ? "Invitation cancelled successfully." : "Invitation rejected.";
    return { status: "success", message };
});
/**
 * Submits a request to join an alliance.
 */
exports.requestToJoinAlliance = functions.https.onCall(async (data, context) => {
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
        const lastLeaveTime = userDoc.data().lastAllianceLeftAt.toMillis();
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
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                    rejectedAt: firestore_1.FieldValue.delete(), // Remove the rejection timestamp
                });
                return { status: "success", message: "Your request to join the alliance has been sent again." };
            }
        }
        // Create new request if it doesn't exist
        await requestRef.set({
            requesterUid: callerUid,
            status: 'pending',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { status: "success", message: "Your request to join the alliance has been sent." };
    }
    catch (error) {
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
exports.updateAllianceInfo = functions.https.onCall(async (data, context) => {
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
        const allianceData = allianceDoc.data();
        if (allianceData.ownerUid !== callerUid && allianceData.leaderUid !== callerUid) {
            throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can update information.");
        }
        const updateData = {
            name,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (logoUrl) {
            updateData.logoUrl = logoUrl;
        }
        await allianceRef.update(updateData);
        return { status: "success", message: "Alliance information updated successfully." };
    }
    catch (error) {
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
exports.createAlliance = functions.https.onCall(async (data, context) => {
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
            const userData = userDoc.data();
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
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                level: 1,
                safeboxBalance: 0,
            };
            functions.logger.info("[createAlliance] Performing transaction writes.");
            const userUpdateData = {};
            if (creationCost > 0) {
                userUpdateData.balance = firestore_1.FieldValue.increment(-creationCost);
            }
            userUpdateData.lastAllianceCreatedAt = firestore_1.FieldValue.serverTimestamp();
            transaction.update(userRef, userUpdateData);
            transaction.set(newAllianceRef, newAllianceData);
            const memberRef = newAllianceRef.collection('members').doc(uid);
            transaction.set(memberRef, { uid: uid, role: creatorRole, joinedAt: firestore_1.FieldValue.serverTimestamp() });
            functions.logger.info("[createAlliance] Transaction writes prepared.");
            return { slug: newAllianceData.slug, cost: creationCost };
        });
        functions.logger.info("[createAlliance] Transaction completed successfully.", { result });
        return { status: "success", message: `Alliance '${result.slug}' created successfully.`, cost: result.cost };
    }
    catch (error) {
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
exports.removeAllianceMember = functions.https.onCall(async (data, context) => {
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
            const allianceData = allianceDoc.data();
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
            transaction.update(allianceRef, { memberCount: firestore_1.FieldValue.increment(-1) });
            transaction.set(userRef, { lastAllianceLeftAt: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
        });
        return { status: "success", message: "Member removed successfully." };
    }
    catch (error) {
        functions.logger.error("Error removing member:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while removing the member.");
    }
});
/**
 * Modifies the role of a member in an alliance based on a granular permission model.
 * - The Owner can make any role changes.
 * - The Leader (if not the owner) can only demote others to co-leader or member.
 * - Enforces a single co-leader per alliance.
 */
exports.modifyAllianceMemberRole = functions.https.onCall(async (data, context) => {
    const { allianceId, memberUid, newRole } = data;
    const callerUid = context.auth?.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    if (!allianceId || !memberUid || !newRole) {
        throw new functions.https.HttpsError("invalid-argument", "Missing allianceId, memberUid, or newRole.");
    }
    if (!['leader', 'co-leader', 'member'].includes(newRole)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid role specified.");
    }
    const db = admin.firestore();
    const allianceRef = db.collection("alliances").doc(allianceId);
    const memberRef = allianceRef.collection("members").doc(memberUid);
    try {
        await db.runTransaction(async (transaction) => {
            const allianceDoc = await transaction.get(allianceRef);
            if (!allianceDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Alliance not found.");
            }
            const allianceData = allianceDoc.data();
            const isOwner = allianceData.ownerUid === callerUid;
            const isLeader = allianceData.leaderUid === callerUid;
            // 1. Permission Check: Only owner or leader can modify roles.
            if (!isOwner && !isLeader) {
                throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can modify roles.");
            }
            // 2. Rule Enforcement for Leaders: Leaders cannot promote others to leader.
            if (isLeader && !isOwner && newRole === 'leader') {
                throw new functions.https.HttpsError("permission-denied", "Only the alliance owner can promote a member to leader.");
            }
            const memberDoc = await transaction.get(memberRef);
            if (!memberDoc.exists) {
                throw new functions.https.HttpsError("not-found", "The specified member does not exist in this alliance.");
            }
            // 3. Data Integrity & Rule Enforcement
            if (newRole === 'leader') {
                const otherLeaderQuery = db.collection("alliances").where("leaderUid", "==", memberUid);
                const otherLeaderSnapshot = await transaction.get(otherLeaderQuery);
                const leadsAnotherAlliance = otherLeaderSnapshot.docs.some(doc => doc.id !== allianceId);
                if (leadsAnotherAlliance) {
                    throw new functions.https.HttpsError("failed-precondition", "This member already leads another alliance.");
                }
                // This can only be done by the owner due to check #2.
                const currentLeaderUid = allianceData.leaderUid;
                if (currentLeaderUid && currentLeaderUid !== memberUid) {
                    const oldLeaderRef = allianceRef.collection('members').doc(currentLeaderUid);
                    transaction.update(oldLeaderRef, { role: 'member' }); // Demote old leader to member
                }
                transaction.update(allianceRef, { leaderUid: memberDoc.id });
            }
            else if (newRole === 'co-leader') {
                // NEW: Enforce a single co-leader. Demote the old one if exists.
                const coLeaderQuery = allianceRef.collection('members').where('role', '==', 'co-leader');
                const coLeaderSnapshot = await transaction.get(coLeaderQuery);
                coLeaderSnapshot.forEach(doc => {
                    if (doc.id !== memberUid) {
                        transaction.update(doc.ref, { role: 'member' });
                    }
                });
            }
            else { // newRole is 'member'
                // If the person being demoted is the current leader, nullify the alliance's leaderUid.
                // This can only be done by the owner.
                if (isOwner && allianceData.leaderUid === memberUid) {
                    transaction.update(allianceRef, { leaderUid: null });
                }
            }
            // 4. Update the target member's role.
            transaction.update(memberRef, { role: newRole });
        });
        return { status: "success", message: "Member role updated successfully." };
    }
    catch (error) {
        functions.logger.error("Error modifying member role:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while modifying the role.");
    }
});
/**
 * Deletes an alliance and all its subcollections. Only the alliance leader can perform this action.
 */
exports.deleteAlliance = functions.https.onCall(async (data, context) => {
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
        const allianceData = allianceDoc.data();
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
    }
    catch (error) {
        functions.logger.error("Error deleting alliance:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while deleting the alliance.");
    }
});
/**
 * Distributes profits from the alliance safebox to a member. Only the leader can do this.
 */
exports.distributeProfits = functions.https.onCall(async (data, context) => {
    const { allianceId, memberUid, amount } = data;
    const callerUid = context.auth?.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    if (!allianceId || !memberUid || !amount) {
        throw new functions.https.HttpsError("invalid-argument", "Missing allianceId, memberUid, or amount.");
    }
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Amount must be a positive number.");
    }
    const db = admin.firestore();
    const allianceRef = db.collection("alliances").doc(allianceId);
    const userRef = db.collection("users").doc(memberUid);
    try {
        await db.runTransaction(async (transaction) => {
            const allianceDoc = await transaction.get(allianceRef);
            const memberDoc = await transaction.get(userRef);
            if (!allianceDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Alliance not found.");
            }
            if (!memberDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Member not found.");
            }
            const allianceData = allianceDoc.data();
            if (allianceData.ownerUid !== callerUid && allianceData.leaderUid !== callerUid) {
                throw new functions.https.HttpsError("permission-denied", "Only the alliance owner or leader can distribute profits.");
            }
            if (allianceData.safeboxBalance < amount) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient safebox balance.");
            }
            // Decrement alliance safebox and increment user balance
            transaction.update(allianceRef, { safeboxBalance: firestore_1.FieldValue.increment(-amount) });
            transaction.update(userRef, { balance: firestore_1.FieldValue.increment(amount) });
            // ✨ NEW: Create transaction record for the user
            const userTransactionRef = userRef.collection("transactions").doc();
            transaction.set(userTransactionRef, {
                type: 'profit',
                amount,
                currency: 'FSN',
                allianceId,
                allianceName: allianceData.name,
                description: `Profit distribution from ${allianceData.name}`,
                status: 'completed',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                completedAt: firestore_1.FieldValue.serverTimestamp(),
                metadata: {
                    distributorUid: callerUid,
                    allianceLogoUrl: allianceData.logoUrl || null,
                }
            });
            // Create notification for the member
            const userNotificationRef = db.collection("users").doc(memberUid).collection("allianceNotifications").doc();
            transaction.set(userNotificationRef, {
                type: 'profit_distribution',
                amount,
                allianceId,
                allianceName: allianceData.name,
                allianceLogoUrl: allianceData.logoUrl || null,
                distributorUid: callerUid,
                read: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        return { status: "success", message: `Successfully distributed ${amount} to member.` };
    }
    catch (error) {
        functions.logger.error("Error distributing profits:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while distributing profits.");
    }
});
/**
 * Approves a join request for an alliance. Only leaders or admins can do this.
 */
exports.approveJoinRequest = functions.https.onCall(async (data, context) => {
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
            const allianceData = allianceDoc.data();
            const isOwner = allianceData.ownerUid === callerUid;
            const callerMemberDoc = await transaction.get(callerMemberRef);
            const memberRole = callerMemberDoc.exists ? callerMemberDoc.data().role : '';
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
            transaction.set(newMemberRef, { uid: requesterUid, role: 'member', joinedAt: firestore_1.FieldValue.serverTimestamp() });
            transaction.delete(requestRef);
            transaction.update(allianceRef, {
                memberCount: firestore_1.FieldValue.increment(1),
                safeboxBalance: firestore_1.FieldValue.increment(600)
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
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                completedAt: firestore_1.FieldValue.serverTimestamp(),
                metadata: {
                    newMemberUid: requesterUid,
                    approverUid: callerUid
                }
            });
        });
        return { status: "success", message: "Member approved and added to the alliance." };
    }
    catch (error) {
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
exports.rejectJoinRequest = functions.https.onCall(async (data, context) => {
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
        const allianceData = allianceDoc.data();
        const isOwner = allianceData.ownerUid === callerUid;
        const callerMemberDoc = await callerMemberRef.get();
        const memberRole = callerMemberDoc.exists ? callerMemberDoc.data().role : '';
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
            rejectedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { status: "success", message: "Join request rejected." };
    }
    catch (error) {
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
exports.getPendingActions = functions.https.onCall(async (data, context) => {
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
        const managedAllianceIdsFromRoles = memberDocs.docs.map(doc => doc.ref.parent.parent.id);
        const ownerSnapshot = await db.collection('alliances').where('ownerUid', '==', callerUid).get();
        const ownerAllianceIds = ownerSnapshot.docs.map(doc => doc.id);
        const managedAllianceIds = Array.from(new Set([
            ...managedAllianceIdsFromRoles,
            ...ownerAllianceIds,
        ]));
        if (managedAllianceIds.length === 0)
            return [];
        const requestsPromises = managedAllianceIds.map(async (allianceId) => {
            const requestsQuery = db.collection('alliances').doc(allianceId).collection('joinRequests').where('status', '==', 'pending');
            const snapshot = await requestsQuery.get();
            return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, allianceId }));
        });
        const nestedRequests = await Promise.all(requestsPromises);
        const flatRequests = nestedRequests.flat();
        return Promise.all(flatRequests.map(async (req) => {
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
                requester: requesterDoc.exists ? { fullName: requesterDoc.data().fullName, avatarUrl: requesterDoc.data().avatarUrl } : {},
                alliance: allianceDoc.exists ? { name: allianceDoc.data().name, logoUrl: allianceDoc.data().logoUrl } : {},
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
                inviter: inviterDoc.exists ? { fullName: inviterDoc.data().fullName, avatarUrl: inviterDoc.data().avatarUrl } : {},
                alliance: allianceDoc.exists ? { name: allianceDoc.data().name, logoUrl: allianceDoc.data().logoUrl } : {},
            };
        }));
    };
    // 3. Get OUTGOING JOIN REQUESTS (requests I have sent)
    const getOutgoingRequests = async () => {
        const requestsQuery = db.collectionGroup('joinRequests').where('requesterUid', '==', callerUid).where('status', '==', 'pending');
        const snapshot = await requestsQuery.get();
        return Promise.all(snapshot.docs.map(async (doc) => {
            const req = doc.data();
            const allianceId = doc.ref.parent.parent.id;
            const allianceDoc = await db.collection('alliances').doc(allianceId).get();
            return {
                ...req,
                id: doc.id,
                allianceId,
                type: 'outgoing_request',
                alliance: allianceDoc.exists ? { name: allianceDoc.data().name, logoUrl: allianceDoc.data().logoUrl } : {},
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
                    ? { fullName: invitedUserDoc.data().fullName, avatarUrl: invitedUserDoc.data().avatarUrl }
                    : {},
                alliance: allianceDoc?.exists
                    ? { name: allianceDoc.data().name, logoUrl: allianceDoc.data().logoUrl }
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
        allActions.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
        return allActions;
    }
    catch (error) {
        functions.logger.error("Error getting pending actions:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching pending actions.");
    }
});
exports.cancelJoinRequest = functions.https.onCall(async (data, context) => {
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
    if (requestDoc.data().requesterUid !== callerUid) {
        throw new functions.https.HttpsError("permission-denied", "You can only cancel your own join requests.");
    }
    await requestRef.delete();
    return { status: "success", message: "Your join request has been cancelled." };
});
exports.leaveAlliance = functions.https.onCall(async (data, context) => {
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
        transaction.update(allianceRef, { memberCount: firestore_1.FieldValue.increment(-1) });
        // +++ ADDED +++
        transaction.update(userRef, { lastAllianceLeftAt: firestore_1.FieldValue.serverTimestamp() });
        return { status: "success", message: "You have left the alliance." };
    });
});
exports.donateToAlliance = functions.https.onCall(async (data, context) => {
    const { allianceId, amount } = data;
    const callerUid = context.auth?.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    if (!allianceId || !amount) {
        throw new functions.https.HttpsError("invalid-argument", "Missing allianceId or amount.");
    }
    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Amount must be a positive number.");
    }
    const db = admin.firestore();
    const userRef = db.collection("users").doc(callerUid);
    const allianceRef = db.collection("alliances").doc(allianceId);
    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const allianceDoc = await transaction.get(allianceRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Your user profile was not found.");
        }
        if (!allianceDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Alliance not found.");
        }
        const userData = userDoc.data();
        const allianceData = allianceDoc.data();
        const userBalance = userData.balance ?? 0;
        if (userBalance < amount) {
            throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
        }
        const newBalance = userBalance - amount;
        // 1. Update balances
        transaction.update(userRef, { balance: firestore_1.FieldValue.increment(-amount) });
        transaction.update(allianceRef, { safeboxBalance: firestore_1.FieldValue.increment(amount) });
        // 2. Log donation for the alliance (for leader view)
        const donationRef = allianceRef.collection("donations").doc(); // Auto-generate ID
        transaction.set(donationRef, {
            amount,
            donatorUid: callerUid,
            donatorName: userData.fullName || 'Anonymous',
            donatorAvatarUrl: userData.avatarUrl || null,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // 3. Log transaction for the user (for personal history)
        const userTransactionRef = userRef.collection("transactions").doc(); // Auto-generate ID
        transaction.set(userTransactionRef, {
            type: 'donation',
            amount,
            allianceId,
            allianceName: allianceData.name,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // 4. Create notification for alliance leaders (NEW for Task 6)
        // ⚠️ IMPORTANT: Do NOT create notification if the donor is the leader/owner
        // This prevents self-notification spam
        const isLeaderOrOwner = allianceData.leaderUid === callerUid || allianceData.ownerUid === callerUid;
        if (!isLeaderOrOwner) {
            const notificationRef = allianceRef.collection("notifications").doc(); // Auto-generate ID
            transaction.set(notificationRef, {
                type: 'donation',
                amount,
                donatorUid: callerUid,
                donatorName: userData.fullName || 'Anonymous',
                donatorAvatarUrl: userData.avatarUrl || null,
                allianceId,
                allianceName: allianceData.name,
                read: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        return { status: "success", newBalance };
    });
});
/**
 * A scheduled function that runs every 24 hours to delete inactive alliances.
 * An alliance is considered inactive if it is older than 30 days and has fewer than 5 members.
 */
exports.checkInactiveAlliances = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
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
        const deletionPromises = [];
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
                    }
                    catch (subError) {
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
    }
    catch (error) {
        functions.logger.error('Error in checkInactiveAlliances scheduled function:', error);
        return null;
    }
});
/**
 * Gets alliance notifications for leaders/co-leaders/owners (NEW for Task 6)
 * Returns donation notifications from alliances/{allianceId}/notifications
 * And profit distribution notifications from users/{userId}/allianceNotifications
 */
exports.getAllianceNotifications = functions.https.onCall(async (data, context) => {
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
        const managedAllianceIdsFromRoles = memberDocs.docs.map(doc => doc.ref.parent.parent.id);
        const ownerSnapshot = await db.collection('alliances').where('ownerUid', '==', callerUid).get();
        const ownerAllianceIds = ownerSnapshot.docs.map(doc => doc.id);
        const managedAllianceIds = Array.from(new Set([
            ...managedAllianceIdsFromRoles,
            ...ownerAllianceIds,
        ]));
        // 2. Get donation notifications from managed alliances
        const donationNotifications = [];
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
        allNotifications.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
        return allNotifications;
    }
    catch (error) {
        functions.logger.error("Error getting alliance notifications:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching notifications.");
    }
});
/**
 * Gets rejected join requests for the current user
 */
exports.getRejectedRequests = functions.https.onCall(async (data, context) => {
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
            const allianceId = doc.ref.parent.parent.id;
            const allianceDoc = await db.collection('alliances').doc(allianceId).get();
            return {
                ...req,
                id: doc.id,
                allianceId,
                type: 'rejected_request',
                alliance: allianceDoc.exists
                    ? { name: allianceDoc.data().name, logoUrl: allianceDoc.data().logoUrl }
                    : {},
            };
        }));
        // Sort by rejection date, newest first
        rejectedRequests.sort((a, b) => {
            const timeA = a.rejectedAt?.toMillis() || 0;
            const timeB = b.rejectedAt?.toMillis() || 0;
            return timeB - timeA;
        });
        return rejectedRequests;
    }
    catch (error) {
        functions.logger.error("Error getting rejected requests:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while fetching rejected requests.");
    }
});
/**
 * Marks alliance notifications as read (NEW for Task 6)
 */
exports.markAllianceNotificationsAsRead = functions.https.onCall(async (data, context) => {
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
                batch.update(notifRef, { read: true, readAt: firestore_1.FieldValue.serverTimestamp() });
            }
            else {
                const notifRef = db.collection('users').doc(callerUid).collection('allianceNotifications').doc(notifId);
                batch.update(notifRef, { read: true, readAt: firestore_1.FieldValue.serverTimestamp() });
            }
        }
        await batch.commit();
        return { status: "success", message: "Notifications marked as read." };
    }
    catch (error) {
        functions.logger.error("Error marking notifications as read:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});
/**
 * Updates member online status in their alliance
 * Called when user enters/exits alliance dashboard
 */
exports.updateMemberOnlineStatus = functions.https.onCall(async (data, context) => {
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
                lastSeen: firestore_1.FieldValue.serverTimestamp()
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
    }
    catch (error) {
        functions.logger.error("[updateMemberOnlineStatus] ❌ Error:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while updating online status.");
    }
});
