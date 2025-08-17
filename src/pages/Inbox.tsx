// 📁 src/pages/Inbox.tsx

import { useEffect, useState } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import DashboardLayout from './DashboardLayout';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Archive, 
  Trash2, 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface InboxMessage {
  id: string;
  title: string;
  message: string;
  timestamp: Timestamp | number;
  amount?: number;
  type?: string;
  read?: boolean;
  claimed?: boolean;
  archived?: boolean;
  deleted?: boolean;
  i18nParams?: {
    rewards?: number[];
  };
}

const Inbox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived' | 'trash'>('inbox');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 10;

  const db = getFirestore();
  const auth = getAuth();

  const fetchMessages = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    
    try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const balanceRaw = userSnap.data()?.balance || 0;
    setBalance(balanceRaw);

    const inboxRef = collection(db, `users/${user.uid}/inbox`);
    const inboxSnap = await getDocs(inboxRef);
    const allMessages: InboxMessage[] = inboxSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InboxMessage[];

    const filtered = allMessages.filter((msg) => {
      if (activeTab === 'inbox') return !msg.archived && !msg.deleted;
      if (activeTab === 'archived') return msg.archived && !msg.deleted;
      if (activeTab === 'trash') return msg.deleted;
      return false;
    });

      // Sort messages by timestamp (newest first)
      const sorted = filtered.sort((a, b) => {
        const timeA = (a.timestamp as Timestamp)?.seconds 
          ? (a.timestamp as Timestamp).seconds * 1000 
          : (a.timestamp as number);
        const timeB = (b.timestamp as Timestamp)?.seconds 
          ? (b.timestamp as Timestamp).seconds * 1000 
          : (b.timestamp as number);
        return timeB - timeA;
      });

      setMessages(sorted);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    setCurrentPage(1);
  }, [activeTab]);

  const handleOpenMessage = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!msg.read) {
      const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
      await updateDoc(msgRef, { read: true });
    }

    setSelectedMessage({ ...msg, read: true });
  };
  console.log(selectedMessage);
  debugger
  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user || !selectedMessage || selectedMessage.claimed) return;

    const userRef = doc(db, 'users', user.uid);
    const msgRef = doc(db, `users/${user.uid}/inbox`, selectedMessage.id);

    const rewardAmount =
      selectedMessage.amount ||
      (selectedMessage.i18nParams?.rewards?.reduce((a, b) => a + b, 0) || 0);

    const newBalance = balance + rewardAmount;

    await updateDoc(userRef, { balance: newBalance });
    await updateDoc(msgRef, { claimed: true });

    setBalance(newBalance);
    setSelectedMessage({ ...selectedMessage, claimed: true });
    fetchMessages(); // Refresh messages to update UI
  };

  // Update the handleArchive function to close the modal after archiving a message
  const handleArchive = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;
    const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
    await updateDoc(msgRef, { archived: true });
    setSelectedMessage(null); // Close the modal
    fetchMessages();
  };

  // Update the handleDelete function to close the modal after deleting a message
  const handleDelete = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;
    const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
    await updateDoc(msgRef, { deleted: true });
    setSelectedMessage(null); // Close the modal
    fetchMessages();
  };

  const getMessageIcon = (msg: InboxMessage) => {
    if (msg.type === 'referral_bonus' || msg.type === 'welcome_bonus') {
      return <Gift className="w-5 h-5 text-yellow-400" />;
    }
    return msg.read ? <Mail className="w-5 h-5 text-gray-400" /> : <Mail className="w-5 h-5 text-blue-400" />;
  };

  const getMessageStatus = (msg: InboxMessage) => {
    if (msg.claimed) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (msg.type === 'referral_bonus' || msg.type === 'welcome_bonus') {
      return <Gift className="w-4 h-4 text-yellow-400" />;
    }
    return null;
  };

  const formatTimestamp = (timestamp: Timestamp | number) => {
    const date = new Date(
      (timestamp as Timestamp)?.seconds
        ? (timestamp as Timestamp).seconds * 1000
        : (timestamp as number)
    );
    return date.toLocaleString();
  };

  const getTabStats = () => {
    const inboxCount = messages.filter(msg => !msg.archived && !msg.deleted).length;
    const archivedCount = messages.filter(msg => msg.archived && !msg.deleted).length;
    const trashCount = messages.filter(msg => msg.deleted).length;
    const unreadCount = messages.filter(msg => !msg.read && !msg.archived && !msg.deleted).length;

    return { inboxCount, archivedCount, trashCount, unreadCount };
  };

  const stats = getTabStats();
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = messages.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Professional Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="relative px-4 py-8 lg:py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 lg:mb-12">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <Mail className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
                >
                  📬 {t('inbox')}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
                >
                  {t('inboxPage.description')}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Tab Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-2 mb-8"
          >
            <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (!loading) { // Prevent multiple rapid clicks
                setActiveTab('inbox');
                setLoading(true); // Set loading state when tab is changed
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'inbox' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } ${loading && 'opacity-70 cursor-wait'}`}
            disabled={loading && activeTab === 'inbox'}
          >
            {loading && activeTab === 'inbox' ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {t('menu.inbox')}
            {stats.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (!loading) { // Prevent multiple rapid clicks
                setActiveTab('archived');
                setLoading(true); // Set loading state when tab is changed
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'archived' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } ${loading && 'opacity-70 cursor-wait'}`}
            disabled={loading && activeTab === 'archived'}
          >
            {loading && activeTab === 'archived' ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Archive className="w-5 h-5" />
            )}
            {t('archived')}
            {stats.archivedCount > 0 && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.archivedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (!loading) { // Prevent multiple rapid clicks
                setActiveTab('trash');
                setLoading(true); // Set loading state when tab is changed
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'trash' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } ${loading && 'opacity-70 cursor-wait'}`}
            disabled={loading && activeTab === 'trash'}
          >
            {loading && activeTab === 'trash' ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            {t('trash')}
            {stats.trashCount > 0 && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.trashCount}
              </span>
            )}
          </button>
        </div>
          </motion.div>

          {/* Messages List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-16 flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                  <Mail className="w-6 h-6 text-white/70 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white text-lg">{t('loadingMessages')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('inboxPage.fetchingMessages', { tab: activeTab })}</p>
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-lg">{t('noMessages')}</p>
                <p className="text-gray-500 text-sm mt-2">
                  {activeTab === 'inbox' && t('inboxPage.noMessagesInInbox')}
                  {activeTab === 'archived' && t('inboxPage.noArchivedMessages')}
                  {activeTab === 'trash' && t('inboxPage.noDeletedMessages')}
                </p>
              </div>
            ) : (
              <>
                {currentMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden cursor-pointer hover:bg-white/15 transition-all duration-200 ${
                      !msg.read ? 'ring-2 ring-blue-400/50' : ''
                    }`}
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getMessageIcon(msg)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {msg.type === 'referral_bonus' 
                                ? t('referralBonus.verifiedTitle') 
                                : msg.type === 'welcome_bonus' 
                                  ? t('welcomeBonus.title') 
                                  : msg.title}
                            </h3>
                            {getMessageStatus(msg)}
                          </div>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {msg.type === 'referral_bonus'
                              ? t('referralBonus.verifiedBody', {
                                  rewards: Array.isArray(msg.i18nParams?.rewards)
                                    ? msg.i18nParams?.rewards.join(', ')
                                    : msg.amount || 0,
                                })
                              : msg.type === 'welcome_bonus'
                                ? t('welcomeBonus.body', { amount: msg.amount || 0 })
                                : msg.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              {formatTimestamp(msg.timestamp)}
                            </div>
                            <div className="flex items-center gap-2">
                              {!msg.read && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              )}
                              {msg.claimed && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white px-4">
                      {t('inboxPage.pageInfo', { current: currentPage, total: totalPages })}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
          </div>
        )}
              </>
            )}
          </motion.div>
        </div>

        {/* Message Modal */}
        <AnimatePresence>
        {selectedMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedMessage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      {getMessageIcon(selectedMessage)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">
                        {selectedMessage.type === 'referral_bonus'
                          ? t('referralBonus.verifiedTitle')
                          : selectedMessage.type === 'welcome_bonus'
                            ? t('welcomeBonus.title')
                            : selectedMessage.title}
                      </h2>
                      <p className="text-gray-300 text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(selectedMessage.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label={t('close')}
                    >
                      <XCircle className="w-5 h-5 text-gray-200" />
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                  <p className="text-white leading-relaxed mb-6 text-base">
                    {selectedMessage.type === 'referral_bonus'
                      ? t('referralBonus.verifiedBody', {
                          rewards: Array.isArray(selectedMessage.i18nParams?.rewards)
                            ? selectedMessage.i18nParams?.rewards.join(', ')
                            : selectedMessage.amount || 0,
                        })
                      : selectedMessage.type === 'welcome_bonus'
                        ? t('welcomeBonus.body', { amount: selectedMessage.amount || 0 })
                        : selectedMessage.message}
                  </p>

                  {!selectedMessage.claimed &&
                    (selectedMessage.type === 'welcome_bonus' ||
                      selectedMessage.type === 'referral_bonus') && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Gift className="w-6 h-6 text-green-400" />
                            <h3 className="text-green-400 font-semibold">{t('inboxPage.rewardAvailable')}</h3>
                          </div>
                          <p className="text-gray-300 text-sm mb-4">
                            {t('inboxPage.claimRewardToAdd')}
                          </p>
                          <button
                            onClick={handleClaim}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg flex items-center gap-2"
                          >
                            <Gift className="w-5 h-5" />
                            {t('inboxPage.claimReward')}
                          </button>
                        </div>
                      )}

                  {selectedMessage.claimed && (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <span className="text-green-400 font-semibold">{t('inboxPage.rewardClaimed')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-white/10 bg-gray-900/80">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {!selectedMessage.archived && !selectedMessage.deleted && (
                        <>
                          <button
                            onClick={() => handleArchive(selectedMessage)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                            {t('archive')}
                          </button>
                          <button
                            onClick={() => handleDelete(selectedMessage)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('delete')}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                    >
                      {t('close')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Inbox;
