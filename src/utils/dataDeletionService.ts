// 📁 src/utils/dataDeletionService.ts

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  writeBatch,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface DataDeletionRequest {
  id: string;
  userId?: string; // Optional for public requests
  userEmail: string;
  userName: string;
  fullName?: string; // For public requests
  requestDate: any; // Firebase Timestamp
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  reviewDate?: any; // Firebase Timestamp
  startDate?: any; // Firebase Timestamp
  completionDate?: any; // Firebase Timestamp
  reason?: string;
  adminNotes?: string;
  estimatedCompletion?: any; // Firebase Timestamp
  source?: 'in_app' | 'public_web' | 'email' | 'support';
  isPublicRequest?: boolean;
  existingUser?: boolean;
  existingUserId?: string;
  userAgent?: string;
  language?: string;
  timestamp?: string;
}

export interface DeletionStatus {
  hasRequest: boolean;
  currentStatus?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  requestDate?: any;
  estimatedCompletion?: any;
}

/**
 * Request data deletion for the current user
 */
export const requestDataDeletion = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();
    
    // Create deletion request
    const deletionRequest: Omit<DataDeletionRequest, 'id'> = {
      userId: user.uid,
      userEmail: user.email || '',
      userName: userData.fullName || 'Unknown',
      requestDate: serverTimestamp(),
      status: 'pending',
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    };

    // Save deletion request
    await setDoc(doc(db, 'dataDeletionRequests', user.uid), deletionRequest);

    // Update user document to mark deletion requested
    await updateDoc(doc(db, 'users', user.uid), {
      dataDeletionRequested: true,
      dataDeletionRequestDate: serverTimestamp(),
      dataDeletionStatus: 'pending'
    });

    console.log('✅ Data deletion request submitted successfully');
    return true;

  } catch (error) {
    console.error('❌ Error requesting data deletion:', error);
    throw error;
  }
};

/**
 * Cancel a data deletion request
 */
export const cancelDataDeletion = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update deletion request status
    await updateDoc(doc(db, 'dataDeletionRequests', user.uid), {
      status: 'cancelled',
      cancelledDate: serverTimestamp()
    });

    // Update user document
    await updateDoc(doc(db, 'users', user.uid), {
      dataDeletionRequested: false,
      dataDeletionRequestDate: null,
      dataDeletionStatus: 'cancelled'
    });

    console.log('✅ Data deletion request cancelled successfully');
    return true;

  } catch (error) {
    console.error('❌ Error cancelling data deletion:', error);
    throw error;
  }
};

/**
 * Check current deletion status for the user
 */
export const checkDeletionStatus = async (): Promise<DeletionStatus> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { hasRequest: false };
    }

    const deletionDoc = await getDoc(doc(db, 'dataDeletionRequests', user.uid));
    
    if (!deletionDoc.exists()) {
      return { hasRequest: false };
    }

    const deletionData = deletionDoc.data() as DataDeletionRequest;
    
    return {
      hasRequest: true,
      currentStatus: deletionData.status,
      requestDate: deletionData.requestDate,
      estimatedCompletion: deletionData.estimatedCompletion
    };

  } catch (error) {
    console.error('❌ Error checking deletion status:', error);
    return { hasRequest: false };
  }
};

/**
 * Get all deletion requests (admin only)
 */
export const getAllDeletionRequests = async (): Promise<DataDeletionRequest[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'dataDeletionRequests'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DataDeletionRequest[];
  } catch (error) {
    console.error('❌ Error fetching deletion requests:', error);
    throw error;
  }
};

/**
 * Get public deletion requests (admin only)
 */
export const getPublicDeletionRequests = async (): Promise<DataDeletionRequest[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'publicDeletionRequests'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DataDeletionRequest[];
  } catch (error) {
    console.error('❌ Error fetching public deletion requests:', error);
    throw error;
  }
};

/**
 * Get all deletion requests including public ones (admin only)
 */
export const getAllDeletionRequestsWithPublic = async (): Promise<DataDeletionRequest[]> => {
  try {
    const [appRequests, publicRequests] = await Promise.all([
      getAllDeletionRequests(),
      getPublicDeletionRequests()
    ]);

    // Merge and deduplicate requests
    const allRequests = [...appRequests];
    
    publicRequests.forEach(publicReq => {
      // Check if this public request corresponds to an existing app request
      const existingIndex = allRequests.findIndex(req => 
        req.id === publicReq.existingUserId || 
        (req.userEmail === publicReq.userEmail && req.isPublicRequest)
      );
      
      if (existingIndex === -1) {
        // Add as new request if no duplicate found
        allRequests.push(publicReq);
      }
    });

    // Sort by request date (newest first)
    return allRequests.sort((a, b) => {
      const dateA = a.requestDate?.toDate?.() || new Date(a.timestamp || 0);
      const dateB = b.requestDate?.toDate?.() || new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('❌ Error fetching all deletion requests:', error);
    throw error;
  }
};

/**
 * Update deletion request status (admin only)
 */
export const updateDeletionStatus = async (
  requestId: string, 
  status: DataDeletionRequest['status'], 
  adminNotes?: string
): Promise<boolean> => {
  try {
    const updateData: any = { status };
    
    if (status === 'approved') {
      updateData.reviewDate = serverTimestamp();
    } else if (status === 'in_progress') {
      updateData.startDate = serverTimestamp();
    } else if (status === 'completed') {
      updateData.completionDate = serverTimestamp();
    }
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(doc(db, 'dataDeletionRequests', requestId), updateData);

    // Update user document
    const requestDoc = await getDoc(doc(db, 'dataDeletionRequests', requestId));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      await updateDoc(doc(db, 'users', requestData.userId), {
        dataDeletionStatus: status
      });
    }

    console.log(`✅ Deletion request status updated to ${status}`);
    return true;

  } catch (error) {
    console.error('❌ Error updating deletion status:', error);
    throw error;
  }
};

/**
 * Process data deletion for a user (admin only)
 * This is a comprehensive deletion that removes all user data
 */
export const processUserDataDeletion = async (userId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Starting data deletion for user: ${userId}`);
    
    const batch = writeBatch(db);
    
    // 1. Delete user's inbox messages
    try {
      const inboxSnapshot = await getDocs(collection(db, `users/${userId}/inbox`));
      inboxSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${inboxSnapshot.docs.length} inbox messages`);
    } catch (error) {
      console.warn('⚠️ Could not delete inbox messages:', error);
    }

    // 2. Delete user's notifications
    try {
      const notificationsSnapshot = await getDocs(collection(db, `users/${userId}/notifications`));
      notificationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${notificationsSnapshot.docs.length} notifications`);
    } catch (error) {
      console.warn('⚠️ Could not delete notifications:', error);
    }

    // 3. Delete user's staking records
    try {
      const stakingSnapshot = await getDocs(collection(db, `users/${userId}/staking`));
      stakingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${stakingSnapshot.docs.length} staking records`);
    } catch (error) {
      console.warn('⚠️ Could not delete staking records:', error);
    }

    // 4. Delete user's transaction history
    try {
      const transactionsSnapshot = await getDocs(collection(db, `users/${userId}/transactions`));
      transactionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${transactionsSnapshot.docs.length} transactions`);
    } catch (error) {
      console.warn('⚠️ Could not delete transactions:', error);
    }

    // 5. Delete user's mining history
    try {
      const miningSnapshot = await getDocs(collection(db, `users/${userId}/mining`));
      miningSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${miningSnapshot.docs.length} mining records`);
    } catch (error) {
      console.warn('⚠️ Could not delete mining records:', error);
    }

    // 6. Delete user's referral data
    try {
      const referralsSnapshot = await getDocs(collection(db, `users/${userId}/referrals`));
      referralsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${referralsSnapshot.docs.length} referral records`);
    } catch (error) {
      console.warn('⚠️ Could not delete referral records:', error);
    }

    // 7. Delete user's KYC data
    try {
      const kycSnapshot = await getDocs(collection(db, `users/${userId}/kyc`));
      kycSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log(`🗑️ Deleted ${kycSnapshot.docs.length} KYC records`);
    } catch (error) {
      console.warn('⚠️ Could not delete KYC records:', error);
    }

    // 8. Delete user's FCM tokens
    try {
      await deleteDoc(doc(db, 'userTokens', userId));
      console.log('🗑️ Deleted FCM tokens');
    } catch (error) {
      console.warn('⚠️ Could not delete FCM tokens:', error);
    }

    // 9. Delete user's profile picture from storage (if exists)
    // Note: This would require storage admin SDK, implemented separately if needed

    // 10. Finally, delete the main user document
    batch.delete(doc(db, 'users', userId));
    
    // 11. Delete the deletion request
    batch.delete(doc(db, 'dataDeletionRequests', userId));

    // Commit all deletions
    await batch.commit();
    
    console.log(`✅ Successfully deleted all data for user: ${userId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error processing data deletion for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Send email notification about deletion request (placeholder)
 * This would integrate with your email service
 */
export const notifyDeletionRequest = async (userEmail: string, userName: string): Promise<void> => {
  // TODO: Implement email notification
  console.log(`📧 Would send deletion request notification to ${userEmail} for user ${userName}`);
};

/**
 * Send email notification about deletion completion (placeholder)
 * This would integrate with your email service
 */
export const notifyDeletionCompletion = async (userEmail: string, userName: string): Promise<void> => {
  // TODO: Implement email notification
  console.log(`📧 Would send deletion completion notification to ${userEmail} for user ${userName}`);
};
