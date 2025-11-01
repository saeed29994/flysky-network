import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

interface GetAllianceTransactionsRequest {
  allianceId: string;
  type?: 'all' | 'donations' | 'profits' | 'invitations' | 'other';
  limit?: number;
  cursor?: string;
}

interface GetAllianceTransactionsResponse {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
  summary: {
    totalDonations: number;
    totalProfits: number;
    currentBalance: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  from?: {
    uid: string;
    name: string;
    type: string;
  };
  to?: {
    uid: string;
    name: string;
    type: string;
  };
  description: string;
  status: string;
  createdAt: admin.firestore.Timestamp;
  completedAt: admin.firestore.Timestamp;
  metadata?: any;
}

export const getAllianceTransactions = functions.https.onCall(async (data: GetAllianceTransactionsRequest, context): Promise<GetAllianceTransactionsResponse> => {
  try {
    const { allianceId, type = 'all', limit = 50, cursor } = data;
    const callerUid = context.auth?.uid;

    if (!callerUid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const db = admin.firestore();

    // Check permissions - only alliance members can view transactions
    const allianceRef = db.collection('alliances').doc(allianceId);
    const allianceDoc = await allianceRef.get();

    if (!allianceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Alliance not found');
    }

    const allianceData = allianceDoc.data()!;

    // Check if user is member
    const memberRef = allianceRef.collection('members').doc(callerUid);
    const memberDoc = await memberRef.get();

    if (!memberDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Only alliance members can view transactions');
    }

    // Build query for alliance transactions
    let query = allianceRef.collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    // Filter by type if specified
    if (type !== 'all') {
      const typeMap = {
        'donations': 'donation',
        'profits': 'profit_distribution',
        'invitations': 'invitation_bonus',
        'other': ['system', 'other']
      };

      if (Array.isArray(typeMap[type])) {
        query = query.where('type', 'in', typeMap[type]);
      } else {
        query = query.where('type', '==', typeMap[type]);
      }
    }

    if (cursor) {
      const cursorDoc = await allianceRef.collection('transactions').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];

    const hasMore = snapshot.docs.length > limit;
    const nextCursor = hasMore ? snapshot.docs[limit - 1].id : undefined;

    // Calculate summary
    const allTransactionsSnap = await allianceRef.collection('transactions').get();
    const summary = {
      totalDonations: 0,
      totalProfits: 0,
      currentBalance: allianceData.safeboxBalance || 0
    };

    allTransactionsSnap.docs.forEach(doc => {
      const transaction = doc.data();
      if (transaction.type === 'donation') {
        summary.totalDonations += transaction.amount || 0;
      } else if (transaction.type === 'profit_distribution') {
        summary.totalProfits += transaction.amount || 0;
      }
    });

    return {
      transactions,
      hasMore,
      nextCursor,
      summary
    };

  } catch (error) {
    console.error('Error in getAllianceTransactions:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch alliance transactions');
  }
});