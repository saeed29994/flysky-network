// Notification polyfill for Android compatibility
export const initializeNotificationPolyfill = () => {
  if (typeof window !== 'undefined' && !window.Notification) {
    // Create a basic Notification polyfill for Android
    window.Notification = class Notification {
      constructor(_title: string, _options?: NotificationOptions) {
        // console.log('Notification polyfill:', title, options);
        // For now, just log the notification
        // In a real implementation, you might want to show a custom notification
      }
      
      static get permission(): NotificationPermission {
        return 'default';
      }
      
      static async requestPermission(): Promise<NotificationPermission> {
        return 'default';
      }
    } as any;
  }
};

// Initialize the polyfill
initializeNotificationPolyfill(); 