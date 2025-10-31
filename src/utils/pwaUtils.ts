// PWA Utility Functions

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const isMobile = (): boolean => {
  return isIOS() || isAndroid();
};

// Platform detection using Capacitor (more reliable for native apps)
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }
  
  // Fallback to user agent detection for web
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'web';
};

// Unified platform detection - use this everywhere instead of isIOS()/isAndroid()
export const isPlatformIOS = (): boolean => {
  return getPlatform() === 'ios';
};

export const isPlatformAndroid = (): boolean => {
  return getPlatform() === 'android';
};

export const isPlatformWeb = (): boolean => {
  return getPlatform() === 'web';
};

// Platform-specific rendering helpers
export const shouldShowAppStore = (): boolean => {
  const platform = getPlatform();
  return platform === 'ios' || platform === 'web';
};

export const shouldShowGooglePlay = (): boolean => {
  const platform = getPlatform();
  return platform === 'android' || platform === 'web';
};

export const shouldShowBothStores = (): boolean => {
  return getPlatform() === 'web';
};

export const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getPWAInstallPrompt = (): Promise<Event | null> => {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(null);
    }, 5000);
  });
};

export const registerPWAUpdateHandler = (callback: () => void): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', callback);
  }
};

export const checkForPWAUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
    } catch (error) {
      // console.error('Error checking for PWA updates:', error);
    }
  }
  return false;
};

export const getPWAInstallInstructions = (): string => {
  if (isIOS()) {
    return 'Tap the Share button, then "Add to Home Screen"';
  } else if (isAndroid()) {
    return 'Tap the menu button, then "Add to Home Screen"';
  } else {
    return 'Click the install button in your browser';
  }
}; 