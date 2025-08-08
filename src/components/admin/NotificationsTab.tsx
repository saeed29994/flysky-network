// 📁 src/components/admin/NotificationsTab.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import {
  FaBell, FaSearch, FaEdit, FaTrash, FaTimes, FaEye,
  FaClock, FaUser, FaGlobe, FaMobile,
  FaDesktop, FaEnvelope, FaPaperPlane, FaChartLine,
  FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaCrown, FaUsers,
  FaSync
} from 'react-icons/fa';

interface FilterState {
  type: string;
  status: string;
  audience: string;
  search: string;
}

interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

const NotificationsTab = () => {
  const { t } = useTranslation();
  const {
    notifications,
    loading,
    error,
    sendNotification,
    refreshNotifications,
    deleteNotification,
  } = useNotifications();

  // State management
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
    audience: 'all',
    search: '',
  });

  const [sort, setSort] = useState<SortState>({
    field: 'createdAt',
    order: 'desc',
  });

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showError, setShowError] = useState(false);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter and sort notifications
  const filteredAndSortedNotifications = notifications
    .filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           notification.message.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = filters.type === 'all' || notification.type === filters.type;
      const matchesStatus = filters.status === 'all' || notification.status === filters.status;
      const matchesAudience = filters.audience === 'all' || notification.targetAudience === filters.audience;
      
      return matchesSearch && matchesType && matchesStatus && matchesAudience;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'recipients':
          aValue = a.recipients;
          bValue = b.recipients;
          break;
        case 'opened':
          aValue = a.opened;
          bValue = b.opened;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sort.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Utility functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <FaTimesCircle className="w-4 h-4 text-red-400" />;
      case 'info': return <FaInfoCircle className="w-4 h-4 text-blue-400" />;
      default: return <FaBell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 border-red-500/30';
      case 'info': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return <FaGlobe className="w-4 h-4" />;
      case 'premium': return <FaCrown className="w-4 h-4" />;
      case 'new': return <FaUser className="w-4 h-4" />;
      case 'inactive': return <FaClock className="w-4 h-4" />;
      default: return <FaUsers className="w-4 h-4" />;
    }
  };

  const getOpenRate = (opened: number, recipients: number) => {
    if (recipients === 0) return 0;
    return ((opened / recipients) * 100).toFixed(1);
  };

  const getClickRate = (clicked: number, opened: number) => {
    if (opened === 0) return 0;
    return ((clicked / opened) * 100).toFixed(1);
  };

  // Event handlers
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredAndSortedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredAndSortedNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(n => n !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedNotifications.length === 0) return;
    
    switch (action) {
      case 'delete':
        if (confirm(t('admin.notifications.bulkActions.confirmDelete', { count: selectedNotifications.length }))) {
          for (const id of selectedNotifications) {
            await deleteNotification(id);
          }
          setSelectedNotifications([]);
        }
        break;
      case 'resend':
        alert(`Resending ${selectedNotifications.length} notification(s)...`);
        break;
      case 'duplicate':
        alert(`Duplicating ${selectedNotifications.length} notification(s)...`);
        break;
    }
  };

  const handleSendNotification = async () => {
    if (!sendTitle.trim() || !sendBody.trim()) {
      alert(t('admin.notifications.sendModal.pleaseEnterBoth'));
      return;
    }

    setSending(true);
    try {
      const success = await sendNotification(sendTitle.trim(), sendBody.trim());
      if (success) {
        setSendTitle('');
        setSendBody('');
        setShowSendModal(false);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-400">Loading notifications...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Error Banner */}
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.notifications.title')}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              aria-label={t('admin.notifications.actions.refresh')}
            >
              <FaSync className="w-4 h-4 text-white" />
            </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <FaPaperPlane className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.notifications.actions.sendNotification')}</span>
              <span className="sm:hidden">{t('admin.notifications.actions.send')}</span>
          </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.totalSent')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{notifications.filter(n => n.status === 'sent').length}</p>
            <p className="text-blue-400 text-xs sm:text-sm">+12% {t('admin.notifications.stats.fromLastWeek')}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaEye className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.avgOpenRate')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">72.3%</p>
            <p className="text-green-400 text-xs sm:text-sm">+5.2% {t('admin.notifications.stats.fromLastWeek')}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.avgClickRate')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">18.7%</p>
            <p className="text-purple-400 text-xs sm:text-sm">+2.1% {t('admin.notifications.stats.fromLastWeek')}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">{t('admin.notifications.stats.scheduled')}</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{notifications.filter(n => n.status === 'scheduled').length}</p>
            <p className="text-yellow-400 text-xs sm:text-sm">{t('admin.notifications.stats.nextScheduled')}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col gap-4 mb-6">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.notifications.filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                aria-label={t('admin.notifications.filters.searchPlaceholder')}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2 sm:gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
              aria-label={t('admin.notifications.filters.allTypes')}
            >
              <option value="all">{t('admin.notifications.filters.allTypes')}</option>
              <option value="info">{t('admin.notifications.filters.info')}</option>
              <option value="success">{t('admin.notifications.filters.success')}</option>
              <option value="warning">{t('admin.notifications.filters.warning')}</option>
              <option value="error">{t('admin.notifications.filters.error')}</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
              aria-label={t('admin.notifications.filters.allStatus')}
            >
              <option value="all">{t('admin.notifications.filters.allStatus')}</option>
              <option value="sent">{t('admin.notifications.filters.sent')}</option>
              <option value="scheduled">{t('admin.notifications.filters.scheduled')}</option>
              <option value="draft">{t('admin.notifications.filters.draft')}</option>
              <option value="failed">{t('admin.notifications.filters.failed')}</option>
            </select>

            <select
              value={filters.audience}
              onChange={(e) => setFilters(prev => ({ ...prev, audience: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
              aria-label={t('admin.notifications.filters.allAudiences')}
            >
              <option value="all">{t('admin.notifications.filters.allAudiences')}</option>
              <option value="all">{t('admin.notifications.filters.allUsers')}</option>
              <option value="premium">{t('admin.notifications.filters.premium')}</option>
              <option value="new">{t('admin.notifications.filters.newUsers')}</option>
              <option value="inactive">{t('admin.notifications.filters.inactive')}</option>
            </select>

            <select
              value={`${sort.field}-${sort.order}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                setSort({ field, order });
              }}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
              aria-label={t('admin.notifications.filters.sortBy.newestFirst')}
            >
              <option value="createdAt-desc">{t('admin.notifications.filters.sortBy.newestFirst')}</option>
              <option value="createdAt-asc">{t('admin.notifications.filters.sortBy.oldestFirst')}</option>
              <option value="title-asc">{t('admin.notifications.filters.sortBy.titleAZ')}</option>
              <option value="title-desc">{t('admin.notifications.filters.sortBy.titleZA')}</option>
              <option value="recipients-desc">{t('admin.notifications.filters.sortBy.mostRecipients')}</option>
              <option value="opened-desc">{t('admin.notifications.filters.sortBy.mostOpened')}</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <span className="text-white font-medium text-sm sm:text-base">
              {t('admin.notifications.bulkActions.selectedNotifications', { count: selectedNotifications.length })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('resend')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                {t('admin.notifications.bulkActions.resend')}
              </button>
              <button
                onClick={() => handleBulkAction('duplicate')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                {t('admin.notifications.bulkActions.duplicate')}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                {t('admin.notifications.bulkActions.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {/* Mobile Card View */}
        <div className="lg:hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium text-sm">{t('admin.notifications.mobile.notifications')} ({filteredAndSortedNotifications.length})</span>
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredAndSortedNotifications.length && filteredAndSortedNotifications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                aria-label={t('admin.notifications.table.actions')}
              />
            </div>
            <div className="space-y-4">
              {filteredAndSortedNotifications.map((notification) => (
                <motion.div 
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                        aria-label={`Select notification: ${notification.title}`}
                      />
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                        <span className="text-white capitalize">{t(`admin.notifications.types.${notification.type}`)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs ${getStatusBadge(notification.status)}`}>
                      {t(`admin.notifications.status.${notification.status}`)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                    <p className="text-gray-400 text-xs line-clamp-2">{notification.message}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {getAudienceIcon(notification.targetAudience)}
                      <span className="capitalize">{t(`admin.notifications.audience.${notification.targetAudience}`)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {notification.platforms.includes('mobile') && <FaMobile className="w-3 h-3 text-blue-400" />}
                        {notification.platforms.includes('web') && <FaDesktop className="w-3 h-3 text-green-400" />}
                        {notification.platforms.includes('email') && <FaEnvelope className="w-3 h-3 text-purple-400" />}
                      </div>
                    </div>

                    {notification.status === 'sent' && (
                      <div className="text-xs text-gray-400">
                        {notification.recipients.toLocaleString()} {t('admin.notifications.mobile.sent')} • {getOpenRate(notification.opened, notification.recipients)}% {t('admin.notifications.mobile.open')} • {getClickRate(notification.clicked, notification.opened)}% {t('admin.notifications.mobile.click')}
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      {notification.createdAt.toLocaleDateString()} • {notification.createdAt.toLocaleTimeString()}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label={`${t('admin.notifications.actions.view')}: ${notification.title}`}
                      >
                        <FaEye className="w-3 h-3 text-blue-400" />
                      </button>
                      <button 
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label={`${t('admin.notifications.actions.edit')}: ${notification.title}`}
                      >
                        <FaEdit className="w-3 h-3 text-green-400" />
                      </button>
                      <button 
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label={`${t('admin.notifications.actions.delete')}: ${notification.title}`}
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <FaTrash className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === filteredAndSortedNotifications.length && filteredAndSortedNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                      aria-label={t('admin.notifications.table.actions')}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.notification')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.type')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.status')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.audience')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.platforms')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.performance')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.created')}</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">{t('admin.notifications.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAndSortedNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                        aria-label={`${t('admin.notifications.table.actions')}: ${notification.title}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <h4 className="text-white font-medium truncate">{notification.title}</h4>
                        <p className="text-gray-400 text-sm truncate">{notification.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                        <span className="text-white text-sm capitalize">{t(`admin.notifications.types.${notification.type}`)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm ${getStatusBadge(notification.status)}`}>
                        {t(`admin.notifications.status.${notification.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getAudienceIcon(notification.targetAudience)}
                        <span className="text-white text-sm capitalize">{t(`admin.notifications.audience.${notification.targetAudience}`)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {notification.platforms.includes('mobile') && <FaMobile className="w-4 h-4 text-blue-400" />}
                        {notification.platforms.includes('web') && <FaDesktop className="w-4 h-4 text-green-400" />}
                        {notification.platforms.includes('email') && <FaEnvelope className="w-4 h-4 text-purple-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {notification.status === 'sent' ? (
                        <div className="text-sm">
                          <div className="text-white">{notification.recipients.toLocaleString()} {t('admin.notifications.table.recipients')}</div>
                          <div className="text-gray-400">
                            {getOpenRate(notification.opened, notification.recipients)}% {t('admin.notifications.table.openRate')} • {getClickRate(notification.clicked, notification.opened)}% {t('admin.notifications.table.clickRate')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-white">{notification.createdAt.toLocaleDateString()}</div>
                        <div className="text-gray-400">{notification.createdAt.toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label={`${t('admin.notifications.actions.view')}: ${notification.title}`}
                        >
                          <FaEye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label={`${t('admin.notifications.actions.edit')}: ${notification.title}`}
                        >
                          <FaEdit className="w-4 h-4 text-green-400" />
                        </button>
                        <button 
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label={`${t('admin.notifications.actions.delete')}: ${notification.title}`}
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <FaTrash className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAndSortedNotifications.length === 0 && (
          <div className="text-center py-12">
            <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">{t('admin.notifications.empty.noNotifications')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl gap-4">
        <div className="text-gray-400 text-sm">
          {t('admin.notifications.pagination.showing', { current: filteredAndSortedNotifications.length, total: notifications.length })}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm">
            {t('admin.notifications.pagination.previous')}
          </button>
          <span className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm">1</span>
          <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm">
            {t('admin.notifications.pagination.next')}
          </button>
        </div>
      </div>

      {/* Send Notification Modal */}
      <AnimatePresence>
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
                {t('admin.notifications.sendModal.title')}
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={t('admin.notifications.actions.close')}
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  {t('admin.notifications.sendModal.notificationTitle')}
                </label>
                <input
                  type="text"
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                  placeholder={t('admin.notifications.sendModal.titlePlaceholder')}
                  aria-label={t('admin.notifications.sendModal.notificationTitle')}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  {t('admin.notifications.sendModal.notificationMessage')}
                </label>
                <textarea
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none text-sm sm:text-base"
                  placeholder={t('admin.notifications.sendModal.messagePlaceholder')}
                  aria-label={t('admin.notifications.sendModal.notificationMessage')}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
                >
                  {t('admin.notifications.sendModal.cancel')}
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={sending || !sendTitle.trim() || !sendBody.trim()}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('admin.notifications.sendModal.sending')}
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      {t('admin.notifications.sendModal.send')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationsTab; 