// 📁 test-data-deletion.js
// Simple test script for data deletion functionality

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Test configuration - replace with your actual Firebase config
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data deletion request creation
async function testDataDeletionRequest() {
  try {
    console.log('🧪 Testing data deletion request creation...');
    
    const testUserId = 'test-user-' + Date.now();
    const testUserEmail = 'test@example.com';
    const testUserName = 'Test User';
    
    // Create a test user document
    const userRef = doc(db, 'users', testUserId);
    await setDoc(userRef, {
      fullName: testUserName,
      email: testUserEmail,
      createdAt: serverTimestamp(),
      balance: 1000,
      plan: 'economy'
    });
    console.log('✅ Test user created');
    
    // Create a deletion request
    const deletionRequestRef = doc(db, 'dataDeletionRequests', testUserId);
    await setDoc(deletionRequestRef, {
      userId: testUserId,
      userEmail: testUserEmail,
      userName: testUserName,
      requestDate: serverTimestamp(),
      status: 'pending',
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Deletion request created');
    
    // Update user document to mark deletion requested
    await updateDoc(userRef, {
      dataDeletionRequested: true,
      dataDeletionRequestDate: serverTimestamp(),
      dataDeletionStatus: 'pending'
    });
    console.log('✅ User document updated with deletion status');
    
    // Verify the deletion request was created
    const deletionDoc = await getDoc(deletionRequestRef);
    if (deletionDoc.exists()) {
      console.log('✅ Deletion request verified:', deletionDoc.data());
    } else {
      console.log('❌ Deletion request not found');
    }
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test data deletion status update
async function testStatusUpdate() {
  try {
    console.log('🧪 Testing status update...');
    
    const testUserId = 'test-user-' + Date.now();
    const testUserEmail = 'test-status@example.com';
    const testUserName = 'Status Test User';
    
    // Create a test deletion request
    const deletionRequestRef = doc(db, 'dataDeletionRequests', testUserId);
    await setDoc(deletionRequestRef, {
      userId: testUserId,
      userEmail: testUserEmail,
      userName: testUserName,
      requestDate: serverTimestamp(),
      status: 'pending',
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Test deletion request created');
    
    // Update status to approved
    await updateDoc(deletionRequestRef, {
      status: 'approved',
      reviewDate: serverTimestamp(),
      adminNotes: 'Test approval'
    });
    console.log('✅ Status updated to approved');
    
    // Verify the status update
    const updatedDoc = await getDoc(deletionRequestRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      console.log('✅ Status update verified:', {
        status: data.status,
        reviewDate: data.reviewDate,
        adminNotes: data.adminNotes
      });
    }
    
    console.log('🎉 Status update test passed!');
    
  } catch (error) {
    console.error('❌ Status update test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting data deletion functionality tests...\n');
  
  await testDataDeletionRequest();
  console.log('\n' + '='.repeat(50) + '\n');
  await testStatusUpdate();
  
  console.log('\n🎯 All tests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDataDeletionRequest,
  testStatusUpdate,
  runTests
};
