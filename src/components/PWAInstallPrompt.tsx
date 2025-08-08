import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isStandaloneMode) return;

    // Show prompt on iOS since beforeinstallprompt isn't fired on iOS
    if (isIOSDevice) {
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success(t('pwa.toast.installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success(t('pwa.toast.installing'));
    } else {
      toast.error(t('pwa.toast.cancelled'));
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleIOSInstall = () => {
    toast.success(
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <p>{t('pwa.ios.title')}</p>
        <ol style={{ margin: '8px 0', paddingLeft: i18n.language === 'ar' ? 0 : 20, paddingRight: i18n.language === 'ar' ? 20 : 0 }}>
          <li>{t('pwa.ios.step1')}</li>
          <li>{t('pwa.ios.step2')}</li>
          <li>{t('pwa.ios.step3')}</li>
        </ol>
      </div>,
      { duration: 10000 }
    );
  };

  // Hide when installed or when user dismissed
  if (isStandalone || !showInstallPrompt) return null;

  const isRTL = i18n.language === 'ar';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3`}>
            <img 
              src="/fsn-logo.png" 
              alt="FlySky Network" 
              className="w-10 h-10 rounded-lg"
            />
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('pwa.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isIOS 
                  ? t('pwa.subtitle.ios') 
                  : t('pwa.subtitle.default')
                }
              </p>
            </div>
          </div>
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
            {isIOS ? (
              <button
                onClick={handleIOSInstall}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('pwa.buttons.howToInstall')}
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('pwa.buttons.install')}
              </button>
            )}
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
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