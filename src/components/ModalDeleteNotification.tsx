import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { Notification } from '../hooks/useNotifications';

interface ModalDeleteNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  onConfirmDelete: (id: string) => Promise<boolean>;
  onSuccess: () => void;
}

const ModalDeleteNotification = ({
  isOpen,
  onClose,
  notification,
  onConfirmDelete,
  onSuccess
}: ModalDeleteNotificationProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleConfirm = async () => {
    if (!notification) return;

    try {
      setIsDeleting(true);
      setError(null);

      const success = await onConfirmDelete(notification.id);

      if (success) {
        onSuccess();
        onClose();
      } else {
        setError(t('admin.notifications.messages.failedToDelete'));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(t('admin.notifications.messages.errorDeleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <FaTrash className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t('admin.notifications.deleteConfirm.title')}
              </h3>
              <p className="text-gray-400 text-sm">
                {t('admin.notifications.deleteConfirm.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {notification && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">{notification.title}</h4>
              <p className="text-gray-300 text-sm line-clamp-2">{notification.message}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">
                  {t('admin.notifications.table.sent')}:
                </span>
                <span className="text-xs text-white">
                  {notification.sentAt && new Date(notification.sentAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <FaExclamationCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <FaExclamationCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">
                  {t('admin.notifications.deleteConfirm.warning')}
                </p>
                <p className="text-yellow-300 text-xs mt-1">
                  {t('admin.notifications.deleteConfirm.cannotUndone')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors text-sm font-medium"
          >
            {t('admin.notifications.actions.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || !notification}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('admin.notifications.loading.deleting')}
              </>
            ) : (
              <>
                <FaTrash className="w-4 h-4" />
                {t('admin.notifications.actions.delete')}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalDeleteNotification;