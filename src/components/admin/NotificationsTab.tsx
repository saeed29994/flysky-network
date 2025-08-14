// 📁 src/components/admin/NotificationsTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaPaperPlane, FaCalendarAlt, FaExclamationCircle, FaEye, FaHandPointer, FaTrash, FaEdit, FaChartBar, FaBookmark } from 'react-icons/fa';
import { useNotifications, Notification, NotificationPayload } from '../../hooks/useNotifications';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import NotificationAnalyticsModal from './NotificationAnalyticsModal';
import NotificationTemplatesModal, { NotificationTemplate } from './NotificationTemplatesModal';

const NotificationsTab = () => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'premium' | 'new' | 'inactive'>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['mobile', 'web']);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const { 
    notifications, 
    loading, 
    sendAdvancedNotification,
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

  // Fetch user count based on filter
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const usersRef = collection(db, 'users');
        let usersQueryRef;
        
        if (targetAudience === 'premium') {
          usersQueryRef = query(usersRef, where('membership.planName', 'in', ['business', 'first-6', 'first-lifetime']));
        } else if (targetAudience === 'new') {
          // Users created in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          usersQueryRef = query(usersRef, where('createdAt', '>=', sevenDaysAgo));
        } else if (targetAudience === 'inactive') {
          // Users who haven't logged in for 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          usersQueryRef = query(usersRef, where('lastLogin', '<=', thirtyDaysAgo));
        } else {
          usersQueryRef = usersRef;
        }
        
        const snapshot = await getDocs(usersQueryRef);
        setUserCount(snapshot.size);
      } catch (err) {
        console.error('Error fetching user count:', err);
        setUserCount(0);
      }
    };

    fetchUserCount();
  }, [targetAudience]);

  const handleSendNotification = async () => {
    if (!title || !body) {
      alert('Please enter both title and body.');
      return;
    }

    const payload: NotificationPayload = {
      title,
      body,
      targetAudience,
      platforms: selectedPlatforms,
      scheduledFor: scheduleDate
    };

    const success = await sendAdvancedNotification(payload);
    
    if (success) {
      setTitle('');
      setBody('');
      setTargetAudience('all');
      setSelectedPlatforms(['mobile', 'web']);
      setScheduleDate(null);
      setShowSendModal(false);
      refreshNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification(id);
      refreshNotifications();
    }
  };

  const openNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };
  
  const openNotificationAnalytics = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setShowAnalyticsModal(true);
  };

  const handleSelectTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    if (template.targetAudience) {
      setTargetAudience(template.targetAudience);
    }
    if (template.platforms) {
      setSelectedPlatforms(template.platforms);
    }
  };

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
              <h2 className="text-lg sm:text-xl font-bold text-white">Notifications</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Manage and send notifications to your users</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSendModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <FaPaperPlane className="w-4 h-4" />
              <span className="hidden sm:inline">Send Notification</span>
              <span className="sm:hidden">Send</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Total Sent</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.totalSent}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Scheduled</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.scheduled}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaEdit className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Draft</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.draft}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Failed</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">Send your first notification to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Title</th>
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Status</th>
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Audience</th>
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Sent</th>
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Recipients</th>
                  <th className="py-3 px-4 text-left text-xs sm:text-sm text-gray-400 font-medium">Actions</th>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAudienceBadgeColor(notification.targetAudience)}`}>
                        {notification.targetAudience}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {notification.sentAt ? format(notification.sentAt, 'MMM dd, HH:mm') : 
                       notification.scheduledFor ? format(notification.scheduledFor, 'MMM dd, HH:mm') : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {notification.recipients}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openNotificationDetails(notification)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button 
                          onClick={() => openNotificationAnalytics(notification.id)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="View Analytics"
                        >
                          <FaChartBar className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="Delete"
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

      {/* Send Notification Modal */}
      {showSendModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSendModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Send Notification
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Use Template"
                >
                  <FaBookmark className="w-4 h-4 text-purple-400" />
                </button>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none text-sm sm:text-base"
                  placeholder="Enter notification message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Target Audience
                </label>
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                >
                  <option value="all">All Users ({userCount})</option>
                  <option value="premium">Premium Users</option>
                  <option value="new">New Users (Last 7 days)</option>
                  <option value="inactive">Inactive Users (30+ days)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Platforms
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes('mobile')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, 'mobile']);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'mobile'));
                        }
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
                    />
                    <span className="text-white text-sm">Mobile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes('web')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, 'web']);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'web'));
                        }
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
                    />
                    <span className="text-white text-sm">Web</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                  value={scheduleDate ? scheduleDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setScheduleDate(date);
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to send immediately</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <FaPaperPlane className="w-4 h-4" />
                  {scheduleDate ? 'Schedule' : 'Send Now'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
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
                    {selectedNotification.sentAt ? format(selectedNotification.sentAt, 'MMM dd, yyyy HH:mm') : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-xs">Created At</p>
                  <p className="text-white text-sm">
                    {format(selectedNotification.createdAt, 'MMM dd, yyyy HH:mm')}
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
                  <p className="text-red-400 text-sm">{selectedNotification.error}</p>
                </div>
              )}

              <div className="pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openNotificationAnalytics(selectedNotification.id);
                    }}
                    className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    <FaChartBar className="w-4 h-4" />
                    View Analytics
                  </button>
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

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedNotificationId && (
        <NotificationAnalyticsModal 
          notificationId={selectedNotificationId} 
          onClose={() => setShowAnalyticsModal(false)} 
        />
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <NotificationTemplatesModal 
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplatesModal(false)} 
        />
      )}
    </motion.div>
  );
};

export default NotificationsTab;