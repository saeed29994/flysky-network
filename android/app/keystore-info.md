# Android Keystore Information

## Debug Keystore
- **File**: `android/app/debug.keystore`
- **Password**: `android`
- **Alias**: `androiddebugkey`
- **Key Password**: `android`
- **SHA-1**: `B5:55:40:97:A8:EF:41:90:FD:4F:FF:3E:FD:70:59:60:C7:86:BC:D6`
- **SHA-256**: `BD:B3:6D:10:5F:52:E3:B5:A2:7F:86:AC:F9:B0:CD:79:56:E2:5D:0D:C8:7A:3C:7C:1B:AC:6D:0C:DC:16:4D:23`
- **Valid Until**: January 28, 2053

## Release Keystore
- **File**: `android/app/flysky-release-key.keystore`
- **Password**: `flysky123456`
- **Alias**: `flysky-key-alias`
- **Key Password**: `flysky123456`
- **SHA-1**: `42:3E:F6:AE:A9:21:DB:D9:9F:45:13:25:58:DA:55:0E:60:F3:A2:02`
- **SHA-256**: `B4:8B:C7:14:B3:E0:EE:90:EB:13:68:B1:0D:BD:DB:95:70:B8:51:08:99:03:F2:86:98:A3:8F:6B:94:5F:19:2E`

## Usage
- **Debug builds** use the debug keystore automatically
- **Release builds** use the release keystore
- Both keystores are configured in `android/app/build.gradle`

## Google Cloud Console Configuration
For Google Sign-In to work, you need to add both SHA-1 fingerprints to your Google Cloud Console OAuth client:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `flysky-site`
3. Navigate to: APIs & Services → Credentials
4. Edit your Android OAuth client
5. Add both SHA-1 fingerprints:
   - Debug: `B5:55:40:97:A8:EF:41:90:FD:4F:FF:3E:FD:70:59:60:C7:86:BC:D6`
   - Release: `42:3E:F6:AE:A9:21:DB:D9:9F:45:13:25:58:DA:55:0E:60:F3:A2:02`

