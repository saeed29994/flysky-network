// src/utils/firebaseErrors.ts

export const firebaseErrorMessages: { [key: string]: string } = {
  'auth/email-already-in-use': 'This email address is already in use.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'Operation not allowed. Please contact support.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-disabled': 'This user account has been disabled.',
  'auth/user-not-found': 'No user found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid credentials. Please check your login details.',
  'auth/missing-password': 'Please enter your password.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/internal-error': 'An internal error occurred. Please try again later.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

export function getFirebaseErrorMessage(errorCode: string): string {
  return firebaseErrorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}
