// 📁 src/pages/MessagePage.tsx

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Eye, Trash2, AlertTriangle } from 'lucide-react';
import MessagePageEmail from './messages/MessagePageEmail';
import {
  MessageHeader,
  MessageFilters,
  MessageActions,
  MessageItem,
  EditStatusModal,
  DeleteMessageModal,
  DeleteAllMessagesModal,
  LoadingModal,
  ContactMessage,
  StatusFilter,
  PriorityFilter,
  DateFilter
} from './messages';

const MessagePage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [messagesToDelete, setMessagesToDelete] = useState<ContactMessage[]>([]);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [displayedMessages, setDisplayedMessages] = useState(20);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<'unread' | 'read' | 'replied'>('unread');
  const [tempPriority, setTempPriority] = useState<'normal' | 'urgent' | 'spam'>('normal');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

   const handleCancelSearch = () => {
    setSearchTerm('');
  };


  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesRef = collection(db, 'contactMessages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const messagesData: ContactMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContactMessage));

      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('MessagePage.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const messageDate = message.timestamp.toDate();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateFilter) {
          case 'today':
            matchesDate = messageDate >= today;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = messageDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = messageDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [messages, searchTerm, statusFilter, priorityFilter, dateFilter]);


  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      if (messageToDelete.includes(',')) {
        // Multiple deletion
        const ids = messageToDelete.split(',');
        const batch = writeBatch(db);
        ids.forEach(id => {
          batch.delete(doc(db, 'contactMessages', id));
        });
        await batch.commit();
        setMessages(prev => prev.filter(msg => !ids.includes(msg.id)));
        setSelectedMessages(new Set());
        toast.success(t('MessagePage.messagesDeleted'));
      } else {
        // Single deletion
        await deleteDoc(doc(db, 'contactMessages', messageToDelete));
        setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
        toast.success(t('MessagePage.messageDeleted'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(t('MessagePage.deleteError'));
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  const handleDeleteAllMessages = () => {
    let messagesToDelete: ContactMessage[] = [];
    if (filteredMessages.length > 0) {
      messagesToDelete = filteredMessages;
    } else if (selectedMessages.size > 0) {
      messagesToDelete = messages.filter(msg => selectedMessages.has(msg.id));
    } else {
      messagesToDelete = messages;
    }
    setMessagesToDelete(messagesToDelete);
    setShowDeleteAllModal(true);
  };

  const handleShowDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAllMessages = async () => {
    try {
      const batch = writeBatch(db);
      messagesToDelete.forEach(message => {
        batch.delete(doc(db, 'contactMessages', message.id));
      });
      await batch.commit();
      setMessages(prev => prev.filter(msg => !messagesToDelete.find(f => f.id === msg.id)));
      setSelectedMessages(new Set());
      toast.success(t('MessagePage.allMessagesDeleted'));
    } catch (error) {
      console.error('Error deleting all messages:', error);
      toast.error(t('MessagePage.deleteAllError'));
    } finally {
      setShowDeleteAllModal(false);
      setMessagesToDelete([]);
      setShowLoadingModal(false);
    }
  };

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentDisplayed = filteredMessages.slice(0, displayedMessages);
    setSelectedMessages(new Set(currentDisplayed.map(msg => msg.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMessages(new Set());
  };



  const handleMarkAllAsStatus = async (status: 'unread' | 'read' | 'replied') => {
    setShowLoadingModal(true);
    try {
      const batch = writeBatch(db);
      const currentDisplayed = filteredMessages.slice(0, displayedMessages);
      currentDisplayed.forEach(message => {
        batch.update(doc(db, 'contactMessages', message.id), { status });
      });
      await batch.commit();
      setMessages(prev => prev.map(msg =>
        currentDisplayed.find(d => d.id === msg.id) ? { ...msg, status } : msg
      ));
      toast.success(t('MessagePage.statusUpdated'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('MessagePage.statusUpdateError'));
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleMarkAllAsPriority = async (priority: 'normal' | 'urgent' | 'spam') => {
    setShowLoadingModal(true);
    try {
      const batch = writeBatch(db);
      const currentDisplayed = filteredMessages.slice(0, displayedMessages);
      currentDisplayed.forEach(message => {
        batch.update(doc(db, 'contactMessages', message.id), { priority });
      });
      await batch.commit();
      setMessages(prev => prev.map(msg =>
        currentDisplayed.find(d => d.id === msg.id) ? { ...msg, priority } : msg
      ));
      toast.success(t('MessagePage.priorityUpdated'));
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error(t('MessagePage.priorityUpdateError'));
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleShowMore = () => {
    setDisplayedMessages(prev => prev + 10);
  };

  const handleEditStatus = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setTempStatus(message.status);
      setTempPriority(message.priority);
      setShowEditStatusModal(true);
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingMessageId(messageId);
    setShowReplyModal(true);
  };

  const confirmEditStatus = async () => {
    if (!editingMessageId) return;
    setShowLoadingModal(true);
    try {
      await updateDoc(doc(db, 'contactMessages', editingMessageId), {
        status: tempStatus,
        priority: tempPriority
      });
      setMessages(prev => prev.map(msg =>
        msg.id === editingMessageId ? { ...msg, status: tempStatus, priority: tempPriority } : msg
      ));
      toast.success(t('MessagePage.statusUpdated'));
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error(t('MessagePage.statusUpdateError'));
    } finally {
      setShowLoadingModal(false);
      setShowEditStatusModal(false);
      setEditingMessageId(null);
    }
  };


  // No longer needed - using real-time listener in AdminDashboard

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginTop: '15px' }}
      >
        <MessageHeader messages={messages} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ marginTop: '15px' }}
      >
        <MessageFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          dateFilter={dateFilter}
          onSearch={handleSearch}
          onCancelSearch={handleCancelSearch}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onDateFilterChange={setDateFilter}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ marginTop: '15px' }}
      >
        <MessageActions
          selectedMessages={selectedMessages}
          filteredMessages={filteredMessages}
          messages={messages}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onMarkAllAsStatus={handleMarkAllAsStatus}
          onMarkAllAsPriority={handleMarkAllAsPriority}
          onShowDeleteConfirmModal={handleShowDeleteConfirmModal}
        />
      </motion.div>

      {/* Messages List */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ marginTop: '15px' }}
      >
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm sm:text-base">{t('MessagePage.loading')}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
              {t('MessagePage.noMessages')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              {t('MessagePage.noMessagesDesc')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredMessages.slice(0, displayedMessages).map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                index={index}
                isSelected={selectedMessages.has(message.id)}
                onSelect={(checked) => handleSelectMessage(message.id, checked)}
                onEditStatus={() => handleEditStatus(message.id)}
                onReply={() => handleReply(message.id)}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            ))}
          </div>
        )}

        {/* Show More Button */}
        {filteredMessages.length > displayedMessages && (
          <div className="text-center py-6">
            <button
              onClick={handleShowMore}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Eye className="w-4 h-4" />
              {t('MessagePage.showMore')}
            </button>
          </div>
        )}
      </motion.div>

      <EditStatusModal
        isOpen={showEditStatusModal}
        tempStatus={tempStatus}
        tempPriority={tempPriority}
        onClose={() => setShowEditStatusModal(false)}
        onConfirm={confirmEditStatus}
        onStatusChange={setTempStatus}
        onPriorityChange={setTempPriority}
      />

      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteMessage}
      />

      <DeleteAllMessagesModal
        isOpen={showDeleteAllModal}
        affectedMessagesCount={messagesToDelete.length}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={confirmDeleteAllMessages}
      />

      {/* Delete Confirm Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-300 shadow-lg max-w-md w-full">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-gray-600" />
                Confirm Delete
              </h2>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-700 text-sm font-medium mb-1">
                      Warning
                    </p>
                    <p className="text-gray-600 text-sm">
                      Are you sure you want to delete the selected messages? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setShowLoadingModal(true);
                    handleDeleteAllMessages();
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && replyingMessageId && (
        <MessagePageEmail
          isOpen={showReplyModal}
          onClose={() => {
            setShowReplyModal(false);
            setReplyingMessageId(null);
          }}
          messageId={replyingMessageId!}
          userName={messages.find(m => m.id === replyingMessageId)?.name || ''}
          userEmail={messages.find(m => m.id === replyingMessageId)?.email || ''}
          originalMessage={messages.find(m => m.id === replyingMessageId)?.message || ''}
          onReplySent={() => {
            fetchMessages(); // Refresh messages to update status
          }}
        />
      )}

      <LoadingModal isOpen={showLoadingModal} />
    </>
  );
};

export default MessagePage;