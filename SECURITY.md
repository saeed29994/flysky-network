# Security Guidelines

## Environment Variables Security

### ✅ What's Safe to Expose
Firebase client-side configuration keys are **PUBLIC** and safe to expose in client-side code:
- `VITE_FIREBASE_API_KEY` - Public API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Public domain
- `VITE_FIREBASE_PROJECT_ID` - Public project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Public storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Public sender ID
- `VITE_FIREBASE_WEB_APP_ID` - Public app ID

### 🔒 What's Protected
Firebase security is enforced by:
1. **Firestore Security Rules** - Control data access
2. **Firebase Authentication** - Control user access
3. **Cloud Functions** - Server-side logic protection

### 📱 Platform-Specific Configuration

#### Web Application
- Uses web app configuration
- All keys are public and safe to expose

#### Mobile Applications (Capacitor)
- Uses web app configuration for consistency
- Native Firebase plugins handle platform-specific features
- No sensitive data exposed in client code

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Fill in Your Values
Edit `.env` with your actual Firebase project values:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... etc
```

### 3. Never Commit .env
The `.env` file is already in `.gitignore` and should never be committed to version control.

## Security Best Practices

### ✅ Do
- Use environment variables for all configuration
- Keep `.env` files out of version control
- Use Firebase Security Rules for data protection
- Validate user permissions server-side
- Use HTTPS in production

### ❌ Don't
- Hardcode API keys in source code
- Log sensitive configuration data
- Expose server-side secrets in client code
- Commit `.env` files to version control
- Use HTTP in production

## Firebase Security Rules

Ensure your Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Plans are publicly readable
    match /plans/{planId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Production Deployment

### Environment Variables
Set environment variables in your deployment platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Firebase Hosting**: Use Firebase Functions for server-side secrets

### Build Process
The build process will:
1. Read environment variables from `.env`
2. Replace `import.meta.env.VITE_*` with actual values
3. Bundle them into the client-side code
4. Never expose server-side secrets

## Monitoring

Monitor your Firebase project for:
- Unusual authentication patterns
- Excessive API usage
- Failed security rule violations
- Unauthorized data access attempts

Use Firebase Console → Authentication → Users and Firestore → Usage for monitoring.
