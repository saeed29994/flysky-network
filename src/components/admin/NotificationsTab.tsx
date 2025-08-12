// 📁 src/components/admin/NotificationsTab.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaPaperPlane } from 'react-icons/fa';

const NotificationsTab = () => {
  const [showSendModal, setShowSendModal] = useState(false);

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
            <p className="text-white font-bold text-lg sm:text-2xl">0</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Scheduled</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">0</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Draft</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">0</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Failed</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">0</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        <div className="text-center py-12">
          <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No notifications yet</p>
          <p className="text-gray-500 text-sm mt-2">Send your first notification to get started</p>
        </div>
      </div>

      {/* Simple Send Modal */}
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
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                ×
              </button>
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
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <FaPaperPlane className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationsTab; 