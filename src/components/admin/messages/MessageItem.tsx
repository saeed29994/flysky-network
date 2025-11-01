import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Eye,
  Reply,
  Clock,
  AlertTriangle,
  Archive,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react';
import CustomCheckbox from '../../ui/CustomCheckbox';
import { ContactMessage } from './types';

interface MessageItemProps {
  message: ContactMessage;
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEditStatus: () => void;
  onReply: () => void;
  onDelete: () => void;
}

const MessageItem = ({
  message,
  index,
  isSelected,
  onSelect,
  onEditStatus,
  onReply,
  onDelete,
}: MessageItemProps) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <Mail className="w-4 h-4 text-blue-400" />;
      case 'read': return <Eye className="w-4 h-4 text-green-400" />;
      case 'replied': return <Reply className="w-4 h-4 text-purple-400" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'read': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'replied': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'spam': return <Archive className="w-4 h-4 text-orange-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'spam': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 sm:p-6 hover:bg-white/5 transition-colors"
    >
      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <CustomCheckbox
              label=""
              checked={isSelected}
              onChange={onSelect}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-semibold text-sm truncate">{message.name}</h3>
                {getStatusIcon(message.status)}
                {getPriorityIcon(message.priority)}
              </div>
              <p className="text-gray-400 text-xs mb-1">{message.email}</p>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {message.timestamp.toDate().toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onEditStatus}
              className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30"
              title={t('MessagePage.editStatus')}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onReply}
              className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-full bg-green-500/20 hover:bg-green-500/30"
              title={t('MessagePage.reply')}
            >
              <Reply className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-red-500/20 hover:bg-red-500/30"
              title={t('MessagePage.deleteMessage')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-gray-300 text-sm line-clamp-3">{message.message}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
              {t(`admin.messages.status${message.status.charAt(0).toUpperCase() + message.status.slice(1)}`, message.status)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
              {t(`admin.messages.priority${message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}`, message.priority)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onEditStatus}
              className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30"
              title={t('MessagePage.editStatus')}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onReply}
              className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-full bg-green-500/20 hover:bg-green-500/30"
              title={t('MessagePage.reply')}
            >
              <Reply className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-red-500/20 hover:bg-red-500/30"
              title={t('MessagePage.deleteMessage')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-3 mb-2">
          <CustomCheckbox
            label=""
            checked={isSelected}
            onChange={onSelect}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-semibold">{message.name}</h3>
              {getStatusIcon(message.status)}
              {getPriorityIcon(message.priority)}
              <span className="text-gray-400 text-sm">{message.email}</span>
            </div>
            <p className="text-gray-300 text-sm mb-2 line-clamp-2">{message.message}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {message.timestamp.toDate().toLocaleString()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                {t(`admin.messages.status${message.status.charAt(0).toUpperCase() + message.status.slice(1)}`, message.status)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                {t(`admin.messages.priority${message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}`, message.priority)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={onEditStatus}
            className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30"
            title={t('MessagePage.editStatus')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onReply}
            className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-full bg-green-500/20 hover:bg-green-500/30"
            title={t('MessagePage.reply')}
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-red-500/20 hover:bg-red-500/30"
            title={t('MessagePage.deleteMessage')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;