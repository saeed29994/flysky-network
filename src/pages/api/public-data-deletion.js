// 📁 src/pages/api/public-data-deletion.js

import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email, reason, source, timestamp, userAgent, language } = req.body;

    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    // Check if user already exists in the system
    let existingUserId = null;
    let existingUserData = null;

    try {
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        const userDoc = emailSnapshot.docs[0];
        existingUserId = userDoc.id;
        existingUserData = userDoc.data();
      }
    } catch (error) {
      console.warn('Could not check for existing user:', error);
    }

    // Create deletion request data
    const deletionRequestData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      reason: reason ? reason.trim() : '',
      source: source || 'public_web',
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || '',
      language: language || 'en',
      status: 'pending',
      requestDate: serverTimestamp(),
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      isPublicRequest: true,
      existingUser: !!existingUserId,
      existingUserId: existingUserId || null
    };

    // Generate a unique ID for the deletion request
    const requestId = existingUserId || `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save the deletion request
    const deletionRequestRef = doc(db, 'dataDeletionRequests', requestId);
    await setDoc(deletionRequestRef, deletionRequestData);

    // If this is an existing user, update their user document
    if (existingUserId && existingUserData) {
      try {
        const userRef = doc(db, 'users', existingUserId);
        await setDoc(userRef, {
          ...existingUserData,
          dataDeletionRequested: true,
          dataDeletionRequestDate: serverTimestamp(),
          dataDeletionStatus: 'pending',
          publicDeletionRequest: true
        }, { merge: true });
      } catch (error) {
        console.warn('Could not update existing user document:', error);
      }
    }

    // Create a public deletion request record for tracking
    const publicRequestRef = doc(db, 'publicDeletionRequests', requestId);
    await setDoc(publicRequestRef, {
      ...deletionRequestData,
      requestId: requestId,
      createdAt: serverTimestamp()
    });

    // Log the request for admin review
    console.log(`📝 Public deletion request submitted:`, {
      requestId,
      fullName: deletionRequestData.fullName,
      email: deletionRequestData.email,
      existingUser: deletionRequestData.existingUser,
      timestamp: deletionRequestData.timestamp
    });

    // TODO: Send email notification to admin team
    // TODO: Send confirmation email to user

    res.status(200).json({ 
      success: true, 
      message: 'Deletion request submitted successfully',
      requestId: requestId,
      estimatedCompletion: deletionRequestData.estimatedCompletion
    });

  } catch (error) {
    console.error('❌ Error processing public deletion request:', error);
    
    res.status(500).json({ 
      error: 'Failed to process deletion request. Please try again or contact support directly.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
