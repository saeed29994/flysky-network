import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { ContactMessage } from './types';

interface MessageHeaderProps {
  messages: ContactMessage[];
}

const MessageHeader = ({ messages }: MessageHeaderProps) => {
  const { t } = useTranslation();

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{t('MessagePage.pageTitle')}</h2>
          <p className="text-gray-400 text-xs sm:text-sm">{t('MessagePage.pageSubtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
          <p className="text-gray-400 text-xs sm:text-sm">{t('MessagePage.totalMessages')}</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{messages.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
          <p className="text-gray-400 text-xs sm:text-sm">{t('MessagePage.unreadMessages')}</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-400">{unreadCount}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
          <p className="text-gray-400 text-xs sm:text-sm">{t('MessagePage.urgentMessages')}</p>
          <p className="text-xl sm:text-2xl font-bold text-red-400">
            {messages.filter(m => m.priority === 'urgent').length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
          <p className="text-gray-400 text-xs sm:text-sm">{t('MessagePage.spamMessages')}</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-400">
            {messages.filter(m => m.priority === 'spam').length}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageHeader;