import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaEye, FaHandPointer, FaMobileAlt, FaDesktop, FaUsers } from 'react-icons/fa';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

interface NotificationAnalyticsModalProps {
  notificationId: string;
  onClose: () => void;
}

interface NotificationEvent {
  id: string;
  notificationId: string;
  userId: string;
  eventType: 'open' | 'click';
  timestamp: { toDate: () => Date };
  platform: string;
  deviceInfo?: any;
  destination?: string;
}

interface NotificationAnalytics {
  totalOpens: number;
  totalClicks: number;
  uniqueOpenUsers: number;
  uniqueClickUsers: number;
  openRate: number;
  clickRate: number;
  platformOpenCounts: Record<string, number>;
  platformClickCounts: Record<string, number>;
}

const NotificationAnalyticsModal = ({ notificationId, onClose }: NotificationAnalyticsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [recentEvents, setRecentEvents] = useState<NotificationEvent[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const getNotificationAnalytics = httpsCallable(functions, 'getNotificationAnalytics');
        const result = await getNotificationAnalytics({ notificationId });
        const data = result.data as any;

        setNotification(data.notification);
        setAnalytics(data.analytics);
        setRecentEvents(data.recentEvents || []);
      } catch (err) {
        console.error('Error fetching notification analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [notificationId]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'mobile':
      case 'android':
      case 'ios':
        return <FaMobileAlt className="text-blue-400" />;
      case 'web':
      case 'desktop':
        return <FaDesktop className="text-green-400" />;
      default:
        return <FaUsers className="text-purple-400" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'open':
        return <FaEye className="text-blue-400" />;
      case 'click':
        return <FaHandPointer className="text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            Notification Analytics
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Notification Details */}
            {notification && (
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">{notification.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{notification.message}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Sent</p>
                    <p className="text-white">{notification.sentAt ? format(notification.sentAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Recipients</p>
                    <p className="text-white">{notification.recipients || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="text-white capitalize">{notification.status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Overview */}
            {analytics && (
              <div>
                <h4 className="text-white font-medium mb-3">Performance Overview</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaEye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <span className="text-gray-400 text-xs sm:text-sm">Opens</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-2xl">{analytics.totalOpens}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {analytics.openRate.toFixed(1)}% open rate
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaHandPointer className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      <span className="text-gray-400 text-xs sm:text-sm">Clicks</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-2xl">{analytics.totalClicks}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {analytics.clickRate.toFixed(1)}% click rate
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      <span className="text-gray-400 text-xs sm:text-sm">Unique Opens</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-2xl">{analytics.uniqueOpenUsers}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      <span className="text-gray-400 text-xs sm:text-sm">Unique Clicks</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-2xl">{analytics.uniqueClickUsers}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Breakdown */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-3">Opens by Platform</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    {Object.entries(analytics.platformOpenCounts).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(analytics.platformOpenCounts).map(([platform, count]) => (
                          <div key={platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="text-white capitalize">{platform}</span>
                            </div>
                            <span className="text-gray-300">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No data available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-3">Clicks by Platform</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    {Object.entries(analytics.platformClickCounts).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(analytics.platformClickCounts).map(([platform, count]) => (
                          <div key={platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="text-white capitalize">{platform}</span>
                            </div>
                            <span className="text-gray-300">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div>
              <h4 className="text-white font-medium mb-3">Recent Events</h4>
              <div className="bg-white/5 rounded-xl overflow-hidden">
                {recentEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/10">
                          <th className="py-2 px-4 text-left text-xs text-gray-400 font-medium">Event</th>
                          <th className="py-2 px-4 text-left text-xs text-gray-400 font-medium">User</th>
                          <th className="py-2 px-4 text-left text-xs text-gray-400 font-medium">Platform</th>
                          <th className="py-2 px-4 text-left text-xs text-gray-400 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEvents.map((event) => (
                          <tr key={event.id} className="border-t border-white/10">
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                {getEventIcon(event.eventType)}
                                <span className="text-white capitalize">{event.eventType}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-gray-300 text-sm">{event.userId.substring(0, 8)}...</td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(event.platform)}
                                <span className="text-white capitalize">{event.platform}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-gray-300 text-sm">
                              {format(event.timestamp.toDate(), 'MMM dd, HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">No events recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NotificationAnalyticsModal;
