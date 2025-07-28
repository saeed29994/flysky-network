// 📁 src/components/admin/NotificationsTab.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  FaBell, FaSearch, FaEdit, FaTrash, FaTimes, FaEye,
  FaClock, FaUser, FaGlobe, FaMobile,
  FaDesktop, FaEnvelope, FaPaperPlane, FaChartLine,
  FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaCrown, FaUsers
} from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'sent' | 'scheduled' | 'draft' | 'failed';
  targetAudience: 'all' | 'premium' | 'new' | 'inactive';
  platforms: string[];
  sentAt?: Date;
  scheduledFor?: Date;
  recipients: number;
  opened: number;
  clicked: number;
  createdAt: Date;
  createdBy: string;
}

const NotificationsTab = () => {
  // const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sending, setSending] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif1',
        title: 'Welcome to FlySky Network!',
        message: 'Thank you for joining our platform. Start your journey with exclusive rewards.',
        type: 'success',
        status: 'sent',
        targetAudience: 'new',
        platforms: ['mobile', 'web'],
        sentAt: new Date('2024-12-20 10:30:00'),
        recipients: 1250,
        opened: 890,
        clicked: 234,
        createdAt: new Date('2024-12-20 10:25:00'),
        createdBy: 'Admin'
      },
      {
        id: 'notif2',
        title: 'System Maintenance Notice',
        message: 'We will be performing scheduled maintenance on December 25th from 2-4 AM UTC.',
        type: 'warning',
        status: 'scheduled',
        targetAudience: 'all',
        platforms: ['mobile', 'web', 'email'],
        scheduledFor: new Date('2024-12-25 02:00:00'),
        recipients: 0,
        opened: 0,
        clicked: 0,
        createdAt: new Date('2024-12-19 15:45:00'),
        createdBy: 'System'
      },
      {
        id: 'notif3',
        title: 'New Staking Rewards Available',
        message: 'Earn up to 15% APY on your FSN tokens with our new staking program.',
        type: 'info',
        status: 'sent',
        targetAudience: 'premium',
        platforms: ['mobile', 'web'],
        sentAt: new Date('2024-12-18 14:20:00'),
        recipients: 850,
        opened: 620,
        clicked: 189,
        createdAt: new Date('2024-12-18 14:15:00'),
        createdBy: 'Admin'
      },
      {
        id: 'notif4',
        title: 'Referral Bonus Claimed',
        message: 'Congratulations! You have successfully claimed your referral bonus of 50 FSN.',
        type: 'success',
        status: 'sent',
        targetAudience: 'all',
        platforms: ['mobile'],
        sentAt: new Date('2024-12-17 09:15:00'),
        recipients: 320,
        opened: 280,
        clicked: 95,
        createdAt: new Date('2024-12-17 09:10:00'),
        createdBy: 'System'
      },
      {
        id: 'notif5',
        title: 'KYC Verification Required',
        message: 'Please complete your KYC verification to unlock premium features.',
        type: 'warning',
        status: 'draft',
        targetAudience: 'new',
        platforms: ['mobile', 'web', 'email'],
        recipients: 0,
        opened: 0,
        clicked: 0,
        createdAt: new Date('2024-12-16 11:30:00'),
        createdBy: 'Admin'
      },
      {
        id: 'notif6',
        title: 'Transaction Failed',
        message: 'Your recent transaction could not be processed. Please try again.',
        type: 'error',
        status: 'failed',
        targetAudience: 'all',
        platforms: ['mobile', 'web'],
        recipients: 0,
        opened: 0,
        clicked: 0,
        createdAt: new Date('2024-12-15 16:45:00'),
        createdBy: 'System'
      }
    ];
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesAudience = filterAudience === 'all' || notification.targetAudience === filterAudience;
    
    return matchesSearch && matchesType && matchesStatus && matchesAudience;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
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

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSelectAll = () => {
    if (selectedNotifications.length === sortedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(sortedNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(n => n !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedNotifications.length === 0) return;
    
    switch (action) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
          setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
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

  const getOpenRate = (opened: number, recipients: number) => {
    if (recipients === 0) return 0;
    return ((opened / recipients) * 100).toFixed(1);
  };

  const getClickRate = (clicked: number, opened: number) => {
    if (opened === 0) return 0;
    return ((clicked / opened) * 100).toFixed(1);
  };

  const sendNotification = async () => {
    if (!sendTitle || !sendBody) {
      alert('Please enter both title and body.');
      return;
    }
    setSending(true);
    try {
      // ✅ Fetch all tokens from Firestore
      const tokensSnapshot = await getDocs(collection(db, 'userTokens'));
      const tokens: string[] = [];
      tokensSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

      console.log('Tokens ready to send:', tokens);

      if (tokens.length === 0) {
        alert('No tokens found. No users registered for notifications.');
        setSending(false);
        return;
      }

      // ✅ Send request to server
      const response = await fetch('https://flysky-server.onrender.com/sendNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sendTitle,
          body: sendBody,
          tokens,
        }),
      });

      if (response.ok) {
        alert('Notification sent successfully!');
        // Add to notifications list
        const newNotification: Notification = {
          id: `notif${Date.now()}`,
          title: sendTitle,
          message: sendBody,
          type: 'info',
          status: 'sent',
          targetAudience: 'all',
          platforms: ['mobile', 'web'],
          sentAt: new Date(),
          recipients: tokens.length,
          opened: 0,
          clicked: 0,
          createdAt: new Date(),
          createdBy: 'Admin'
        };
        setNotifications(prev => [newNotification, ...prev]);
        setSendTitle('');
        setSendBody('');
        setShowSendModal(false);
      } else {
        const errorText = await response.text();
        alert('Failed to send notifications. Server says: ' + errorText);
      }
    } catch (error) {
      console.error('Send notification error:', error);
      alert('Error sending notification.');
    } finally {
      setSending(false);
    }
  };

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
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Notifications Management</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Manage and track all platform notifications</p>
            </div>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <FaPaperPlane className="w-4 h-4" />
            <span className="hidden sm:inline">Send Notification</span>
            <span className="sm:hidden">Send</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Total Sent</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{notifications.filter(n => n.status === 'sent').length}</p>
            <p className="text-blue-400 text-xs sm:text-sm">+12% from last week</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaEye className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Avg. Open Rate</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">72.3%</p>
            <p className="text-green-400 text-xs sm:text-sm">+5.2% from last week</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Avg. Click Rate</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">18.7%</p>
            <p className="text-purple-400 text-xs sm:text-sm">+2.1% from last week</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Scheduled</span>
            </div>
            <p className="text-white font-bold text-lg sm:text-2xl">{notifications.filter(n => n.status === 'scheduled').length}</p>
            <p className="text-yellow-400 text-xs sm:text-sm">Next: Dec 25, 2:00 AM</p>
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
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2 sm:gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
            >
              <option value="all">All Audiences</option>
              <option value="all">All Users</option>
              <option value="premium">Premium</option>
              <option value="new">New Users</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-xs sm:text-sm"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="recipients-desc">Most Recipients</option>
              <option value="opened-desc">Most Opened</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <span className="text-white font-medium text-sm sm:text-base">
              {selectedNotifications.length} notification(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('resend')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                Resend
              </button>
              <button
                onClick={() => handleBulkAction('duplicate')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
              >
                Delete
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
              <span className="text-white font-medium text-sm">Notifications ({sortedNotifications.length})</span>
              <input
                type="checkbox"
                checked={selectedNotifications.length === sortedNotifications.length && sortedNotifications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-4">
              {sortedNotifications.map((notification) => (
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
                      />
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                        <span className="text-white capitalize">{notification.type}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs ${getStatusBadge(notification.status)}`}>
                      {notification.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                    <p className="text-gray-400 text-xs line-clamp-2">{notification.message}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {getAudienceIcon(notification.targetAudience)}
                      <span className="capitalize">{notification.targetAudience}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {notification.platforms.includes('mobile') && <FaMobile className="w-3 h-3 text-blue-400" />}
                        {notification.platforms.includes('web') && <FaDesktop className="w-3 h-3 text-green-400" />}
                        {notification.platforms.includes('email') && <FaEnvelope className="w-3 h-3 text-purple-400" />}
                      </div>
                    </div>

                    {notification.status === 'sent' && (
                      <div className="text-xs text-gray-400">
                        {notification.recipients.toLocaleString()} sent • {getOpenRate(notification.opened, notification.recipients)}% open • {getClickRate(notification.clicked, notification.opened)}% click
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      {notification.createdAt.toLocaleDateString()} • {notification.createdAt.toLocaleTimeString()}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FaEye className="w-3 h-3 text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FaEdit className="w-3 h-3 text-green-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
                      checked={selectedNotifications.length === sortedNotifications.length && sortedNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Notification</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Audience</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Platforms</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Performance</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Created</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
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
                        <span className="text-white text-sm capitalize">{notification.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm ${getStatusBadge(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getAudienceIcon(notification.targetAudience)}
                        <span className="text-white text-sm capitalize">{notification.targetAudience}</span>
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
                          <div className="text-white">{notification.recipients.toLocaleString()} sent</div>
                          <div className="text-gray-400">
                            {getOpenRate(notification.opened, notification.recipients)}% open • {getClickRate(notification.clicked, notification.opened)}% click
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
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <FaEye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <FaEdit className="w-4 h-4 text-green-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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

        {sortedNotifications.length === 0 && (
          <div className="text-center py-12">
            <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No notifications found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl gap-4">
        <div className="text-gray-400 text-sm">
          Showing {sortedNotifications.length} of {notifications.length} notifications
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm">
            Previous
          </button>
          <span className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm">1</span>
          <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm">
            Next
          </button>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Send Notification
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter notification title..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
                  Notification Message
                </label>
                <textarea
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none text-sm sm:text-base"
                  placeholder="Enter notification message..."
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
                  onClick={sendNotification}
                  disabled={sending || !sendTitle || !sendBody}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      Send
                    </>
                  )}
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