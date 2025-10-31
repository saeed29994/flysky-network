import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteMessageModal = ({ isOpen, onClose, onConfirm }: DeleteMessageModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-4 border-b border-white/10 rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {t('MessagePage.confirmDeleteTitle')}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-gray-300 text-sm sm:text-base mb-6">
            {t('MessagePage.confirmDelete')}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              {t('MessagePage.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              {t('MessagePage.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;