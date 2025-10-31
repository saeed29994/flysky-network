import { useTranslation } from 'react-i18next';

interface LoadingModalProps {
  isOpen: boolean;
}

const LoadingModal = ({ isOpen }: LoadingModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-purple-900/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t('MessagePage.updating')}
        </h3>
        <p className="text-gray-300 text-base">
          {t('MessagePage.pleaseWait')}
        </p>
      </div>
    </div>
  );
};

export default LoadingModal;