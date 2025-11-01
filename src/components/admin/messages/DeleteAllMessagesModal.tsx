import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAllMessagesModalProps {
  isOpen: boolean;
  affectedMessagesCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAllMessagesModal = ({
  isOpen,
  affectedMessagesCount,
  onClose,
  onConfirm,
}: DeleteAllMessagesModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-4 border-b border-white/10 rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {t('MessagePage.confirmDeleteAllTitle')}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-medium mb-1">
                  {t('MessagePage.warning')}
                </p>
                <p className="text-gray-300 text-sm">
                  {t('MessagePage.confirmDeleteAll')}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {t('MessagePage.affectedMessages')}: {affectedMessagesCount}
                </p>
              </div>
            </div>
          </div>
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
              {t('MessagePage.deleteAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAllMessagesModal;