# Firebase Functions Deployment Guide

This guide explains how to deploy the updated Firebase Cloud Functions with CORS configuration for the notification system.

## Prerequisites

1. Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Ensure you're logged in to Firebase:
   ```bash
   firebase login
   ```

3. Make sure you're in the `fsn-functions` directory:
   ```bash
   cd fsn-functions
   ```

## Deploy Functions

### Option 1: Deploy All Functions

To deploy all functions at once:

```bash
firebase deploy --only functions
```

### Option 2: Deploy Specific Functions

To deploy only the notification-related functions:

```bash
firebase deploy --only functions:sendManualNotification,functions:sendPushNotification,functions:processScheduledNotifications,functions:trackNotificationOpen,functions:trackNotificationClick,functions:getNotificationAnalytics
```

## Verify CORS Configuration

After deployment, verify that the CORS configuration is working correctly:

1. Check that the `allowedOrigins` array in `functions/src/index.ts` includes all necessary origins:
   - Development: `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`
   - Production: `https://fsncrew.io`, `https://www.fsncrew.io`

2. Test sending a notification from the Admin Panel in both development and production environments.

## Troubleshooting CORS Issues

If you're still experiencing CORS issues:

1. **Check Browser Console**: Look for specific CORS error messages.

2. **Verify Function Region**: Make sure the region in `src/firebase.ts` matches the deployed function region:
   ```javascript
   const functions = getFunctions(app, 'us-central1');
   ```

3. **Use Local Emulator for Development**:
   ```bash
   firebase emulators:start --only functions
   ```
   
   Then uncomment these lines in `src/firebase.ts`:
   ```javascript
   import { connectFunctionsEmulator } from 'firebase/functions';
   connectFunctionsEmulator(functions, 'localhost', 5001);
   ```

4. **Check Function Logs**: View the Cloud Function logs in the Firebase Console to see if there are any errors on the server side.

## Development Fallback

For development environments, the application now includes a fallback mechanism that will store notifications directly in Firestore if the Cloud Function call fails due to CORS issues. This ensures that you can still test notification functionality in development.

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase CORS Configuration](https://firebase.google.com/docs/functions/http-events#cors_configuration)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
