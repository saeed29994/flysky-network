import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Don't show prompt if already installed
    if (isStandaloneMode) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('Installing app...');
    } else {
      toast.error('Installation cancelled');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleIOSInstall = () => {
    toast.success(
      <div>
        <p>To install this app:</p>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Tap the Share button <span style={{ fontSize: '18px' }}>📤</span></li>
          <li>Scroll down and tap "Add to Home Screen" <span style={{ fontSize: '18px' }}>🏠</span></li>
          <li>Tap "Add" to confirm</li>
        </ol>
      </div>,
      { duration: 10000 }
    );
  };

  // Don't show if already installed or no prompt available
  if (isStandalone || (!showInstallPrompt && !isIOS)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/fsn-logo.png" 
              alt="Flysky Network" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Install Flysky Network
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isIOS 
                  ? "Add to home screen for quick access" 
                  : "Install app for better experience"
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isIOS ? (
              <button
                onClick={handleIOSInstall}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                How to Install
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
            )}
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 