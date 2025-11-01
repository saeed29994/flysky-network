// 📁 src/components/admin/NotificationsTab.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaBell, FaPaperPlane, FaCalendarAlt, FaExclamationCircle, FaEye, FaHandPointer, FaTrash, FaEdit, FaTimes, FaCheckCircle, FaRedo } from 'react-icons/fa';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { format, isValid } from 'date-fns';
import ModalDeleteNotification from '../ModalDeleteNotification';
import ModalSendMessage from '../ModalSendMessage';
import EditSendNotificationTab from './EditSendNotificationTab';

const NotificationsTab = () => {
  const [showSendForm, setShowSendForm] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);



  const {
    notifications,
    loading: notificationsLoading,
    refreshNotifications,
    deleteNotification
  } = useNotifications();

  // Stats for the dashboard
  const stats = {
    totalSent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    draft: notifications.filter(n => n.status === 'draft').length,
    failed: notifications.filter(n => n.status === 'failed').length
  };


  const handleDeleteNotification = async (id: string) => {
    setNotificationToDelete(notifications.find(n => n.id === id) || null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    setSuccessMessage(t('admin.notifications.messages.deletedSuccessfully'));
    setTimeout(() => setSuccessMessage(null), 3000);
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };


  const openNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };
  
  const openEditModal = (notification: Notification) => {
    // Initialize the notification with extended properties for dynamic targeting
    const extendedNotification = {
      ...notification,
      selectedPlans: [],
      selectedUsers: [],
      userSearch: '',
      filteredUsers: [],
      userCount: 0
    };
    setEditingNotification(extendedNotification);
    setShowEditModal(true);
  };


  


  const { t } = useTranslation();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeliveryStatusColor = (deliveryStatus?: string) => {
    switch (deliveryStatus) {
      case 'delivered': return 'bg-green-400';
      case 'partial_success': return 'bg-yellow-400';
      case 'failed': return 'bg-red-400';
      case 'pending': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getAudienceBadgeColor = (audience: string) => {
    switch (audience) {
      case 'premium': return 'bg-yellow-400 text-black';
      case 'new': return 'bg-green-400 text-black';
      case 'inactive': return 'bg-red-400 text-black';
      default: return 'bg-blue-400 text-black';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.notifications.header.title')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.header.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshNotifications}
              disabled={notificationsLoading}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
              title={t('admin.notifications.actions.refresh')}
            >
              {notificationsLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaRedo className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowSendForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <FaPaperPlane className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.notifications.actions.sendNotification')}</span>
              <span className="sm:hidden">{t('admin.notifications.actions.send')}</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
            ✅ {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.totalSent')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.totalSent}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.scheduled')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.scheduled}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaEdit className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.draft')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.draft}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.failed')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
          <div className="flex items-center gap-3">
            <FaExclamationCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium">{t('admin.notifications.types.error')}</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-medium">{t('admin.notifications.types.success')}</p>
              <p className="text-sm text-green-300">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-300 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Send Message Form or Notifications List */}
      {showSendForm ? (
        <ModalSendMessage
          isVisible={showSendForm}
          onClose={() => setShowSendForm(false)}
          onSuccess={() => {
            setShowSendForm(false);
            refreshNotifications();
          }}
        />
      ) : showEditModal && editingNotification ? (
        <EditSendNotificationTab
          notification={editingNotification}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            refreshNotifications();
          }}
        />
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          {notificationsLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">{t('admin.notifications.stats.loading')}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">{t('admin.notifications.stats.noNotifications')}</p>
              <p className="text-gray-500 text-sm mt-2">{t('admin.notifications.stats.noNotificationsSubtitle')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.title')}</th>
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.status')}</th>
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.audience')}</th>
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.sent')}</th>
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.recipients')}</th>
                    <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">{t('admin.notifications.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <FaBell className="text-purple-400 w-4 h-4" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{notification.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(notification.status)}`}>
                          {notification.status}
                        </span>
                          {notification.deliveryStatus && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeliveryStatusColor(notification.deliveryStatus)}`}>
                              {notification.deliveryStatus}
                            </span>
                          )}
                          {notification.error && (
                            <div className="text-xs text-red-400 max-w-[120px] truncate" title={notification.error}>
                              ❌ {notification.error}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAudienceBadgeColor(notification.targetAudience)}`}>
                          {notification.targetAudience}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {notification.sentAt && isValid(new Date(notification.sentAt)) ? format(new Date(notification.sentAt), 'MMM dd, HH:mm') :
                         notification.scheduledFor && isValid(new Date(notification.scheduledFor)) ? format(new Date(notification.scheduledFor), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {notification.recipients}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openNotificationDetails(notification)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title={t('admin.notifications.table.viewDetails')}
                          >
                            <FaEye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          <button
                            onClick={() => openEditModal(notification)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title={t('admin.notifications.table.editResend')}
                          >
                            <FaEdit className="w-3.5 h-3.5 text-green-400" />
                          </button>

                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title={t('admin.notifications.table.delete')}
                          >
                            <FaTrash className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Notification Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">{selectedNotification.title}</h4>
                <p className="text-gray-300 text-sm">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedNotification.status)}`}>
                      {selectedNotification.status}
                    </span>
                    {selectedNotification.deliveryStatus && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeliveryStatusColor(selectedNotification.deliveryStatus)}`}>
                        {selectedNotification.deliveryStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Target Audience</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAudienceBadgeColor(selectedNotification.targetAudience)}`}>
                      {selectedNotification.targetAudience}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Sent At</p>
                  <p className="text-white text-sm">
                    {selectedNotification.sentAt && isValid(new Date(selectedNotification.sentAt)) ? format(new Date(selectedNotification.sentAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Created At</p>
                  <p className="text-white text-sm">
                    {isValid(new Date(selectedNotification.createdAt)) ? format(new Date(selectedNotification.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Recipients</p>
                  <p className="text-white text-sm">{selectedNotification.recipients}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Platforms</p>
                  <div className="flex gap-2 mt-1">
                    {selectedNotification.platforms.map(platform => (
                      <span key={platform} className="bg-white/10 text-white text-xs px-2 py-0.5 rounded">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Opened</p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaEye className="text-blue-400 w-3 h-3" />
                    <p className="text-white text-sm">{selectedNotification.opened}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Clicked</p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaHandPointer className="text-green-400 w-3 h-3" />
                    <p className="text-white text-sm">{selectedNotification.clicked}</p>
                  </div>
                </div>
              </div>

              {selectedNotification.error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mt-4">
                  <p className="text-red-400 text-sm font-medium">Error Details:</p>
                  <p className="text-red-400 text-sm mt-1">{selectedNotification.error}</p>
                </div>
              )}

              {selectedNotification.deliveryDetails && (
                <div className="bg-white/5 border border-white/20 rounded-xl p-3 mt-4">
                  <p className="text-white text-sm font-medium mb-2">Delivery Information:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Total Recipients</p>
                      <p className="text-white">{selectedNotification.deliveryDetails.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Successful</p>
                      <p className="text-green-400">{selectedNotification.deliveryDetails.successfulDeliveries}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Failed</p>
                      <p className="text-red-400">{selectedNotification.deliveryDetails.failedDeliveries}</p>
                    </div>
                    {selectedNotification.deliveryDetails.sentAt && (
                      <div>
                        <p className="text-gray-400 text-xs">Sent At</p>
                        <p className="text-white">{selectedNotification.deliveryDetails.sentAt && isValid(new Date(selectedNotification.deliveryDetails.sentAt)) ? format(new Date(selectedNotification.deliveryDetails.sentAt), 'MMM dd, yyyy HH:mm') : '-'}</p>
                      </div>
                    )}
                  </div>
                  {selectedNotification.deliveryDetails.errorMessage && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-gray-400 text-xs">Error Message</p>
                      <p className="text-red-400 text-sm">{selectedNotification.deliveryDetails.errorMessage}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4">
                <div className="flex gap-3">

                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}




      {/* Delete Confirmation Modal */}
      <ModalDeleteNotification
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setNotificationToDelete(null);
        }}
        notification={notificationToDelete}
        onConfirmDelete={deleteNotification}
        onSuccess={handleDeleteSuccess}
      />
    </motion.div>
  );
};

export default NotificationsTab;