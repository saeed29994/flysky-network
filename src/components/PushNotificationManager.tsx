import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { requestPermissionAndToken, checkNotificationPermission } from '../utils/pushNotification';

interface PushNotificationManagerProps {
  showInHeader?: boolean; // Whether to show in header or as a standalone component
  className?: string;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ 
  showInHeader = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'default'>(
    checkNotificationPermission()
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Update permission state when component mounts and when permission changes
  useEffect(() => {
    const checkPermission = () => {
      setPermissionState(checkNotificationPermission());
    };

    // Check initial state
    checkPermission();

    // Re-check when window gains focus (in case user changed permissions in settings)
    window.addEventListener('focus', checkPermission);
    return () => window.removeEventListener('focus', checkPermission);
  }, []);

  const handleRequestPermission = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsRequesting(true);
    try {
      await requestPermissionAndToken(user.uid);
      // Update state after request
      setPermissionState(checkNotificationPermission());
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  // If permission is already granted, don't show anything in header mode
  if (showInHeader && permissionState === 'granted') {
    return null;
  }

  // Small button for header
  if (showInHeader) {
    return (
      <div className="relative">
        <button
          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${className}`}
          onClick={handleRequestPermission}
          disabled={isRequesting || permissionState === 'denied'}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={t('enableNotifications')}
        >
          {isRequesting ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : permissionState === 'denied' ? (
            <BellOff className="w-5 h-5 text-gray-400" />
          ) : (
            <BellRing className="w-5 h-5 text-yellow-400" />
          )}
        </button>
        
        {showTooltip && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 z-50">
            {permissionState === 'denied' 
              ? t('notificationsDenied')
              : t('enablePushNotifications')}
          </div>
        )}
      </div>
    );
  }

  // Full component for settings page
  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {permissionState === 'granted' ? (
            <Bell className="w-6 h-6 text-green-400" />
          ) : permissionState === 'denied' ? (
            <BellOff className="w-6 h-6 text-red-400" />
          ) : (
            <BellRing className="w-6 h-6 text-yellow-400" />
          )}
          <h3 className="text-lg font-medium text-white">
            {t('pushNotifications')}
          </h3>
        </div>
        
        {permissionState !== 'denied' && (
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              permissionState === 'granted'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
            }`}
            onClick={handleRequestPermission}
            disabled={isRequesting || permissionState === 'granted'}
          >
            {isRequesting
              ? t('requesting')
              : permissionState === 'granted'
                ? t('enabled')
                : t('enable')}
          </button>
        )}
      </div>
      
      <p className="text-gray-300 text-sm">
        {permissionState === 'granted'
          ? t('notificationsEnabled')
          : permissionState === 'denied'
            ? t('notificationsDeniedHelp')
            : t('notificationsDescription')}
      </p>
    </div>
  );
};

export default PushNotificationManager; 