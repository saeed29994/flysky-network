// 📁 src/components/admin/ContentTab.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaImage, FaSearch, FaEye, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes,
  FaBullhorn, FaNewspaper, FaVideo, FaLink, FaCalendarAlt, FaEye as FaVisibility
} from 'react-icons/fa';

interface Content {
  id: string;
  title: string;
  type: 'banner' | 'announcement' | 'promotion' | 'video' | 'news';
  status: 'active' | 'inactive' | 'draft';
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: number;
  views: number;
  clicks: number;
}

const ContentTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Placeholder data
  const contents: Content[] = [
    {
      id: 'CONT001',
      title: 'Welcome to FlySky Network',
      type: 'banner',
      status: 'active',
      imageUrl: '/src/assets/banner1.jpg',
      description: 'Join the future of decentralized mining',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      priority: 1,
      views: 15420,
      clicks: 2340
    },
    {
      id: 'CONT002',
      title: 'New Mining Rewards Available',
      type: 'announcement',
      status: 'active',
      imageUrl: '/src/assets/banner2.jpg',
      description: 'Earn up to 3000 FSN daily with our new mining system',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      priority: 2,
      views: 8920,
      clicks: 1560
    },
    {
      id: 'CONT003',
      title: 'Referral Program Launch',
      type: 'promotion',
      status: 'active',
      imageUrl: '/src/assets/Referral_Program.jpg',
      description: 'Invite friends and earn 1000 FSN per referral',
      startDate: '2024-11-15',
      endDate: '2024-12-31',
      priority: 3,
      views: 6780,
      clicks: 890
    },
    {
      id: 'CONT004',
      title: 'Platform Tutorial Video',
      type: 'video',
      status: 'active',
      imageUrl: '/src/assets/play_mobile.jpg',
      description: 'Learn how to maximize your mining efficiency',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      priority: 4,
      views: 12340,
      clicks: 2100
    },
    {
      id: 'CONT005',
      title: 'Holiday Special Event',
      type: 'promotion',
      status: 'draft',
      imageUrl: '/src/assets/banner5.jpg',
      description: 'Double rewards during holiday season',
      startDate: '2024-12-20',
      endDate: '2024-12-31',
      priority: 1,
      views: 0,
      clicks: 0
    }
  ];

  // Filter content
  const filteredContents = contents.filter(content => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || content.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Statistics
  const totalContent = contents.length;
  const activeContent = contents.filter(c => c.status === 'active').length;
  const totalViews = contents.reduce((sum, c) => sum + c.views, 0);
  const totalClicks = contents.reduce((sum, c) => sum + c.clicks, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner': return <FaImage className="w-4 h-4" />;
      case 'announcement': return <FaBullhorn className="w-4 h-4" />;
      case 'promotion': return <FaNewspaper className="w-4 h-4" />;
      case 'video': return <FaVideo className="w-4 h-4" />;
      case 'news': return <FaNewspaper className="w-4 h-4" />;
      default: return <FaImage className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'banner': return 'text-blue-400 bg-blue-400/10';
      case 'announcement': return 'text-green-400 bg-green-400/10';
      case 'promotion': return 'text-purple-400 bg-purple-400/10';
      case 'video': return 'text-red-400 bg-red-400/10';
      case 'news': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'inactive': return 'text-red-400 bg-red-400/10';
      case 'draft': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaImage className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Content</p>
              <p className="text-white font-bold text-lg">{totalContent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCheck className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Active Content</p>
              <p className="text-white font-bold text-lg">{activeContent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaVisibility className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-white font-bold text-lg">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaLink className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-white font-bold text-lg">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Content Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <FaPlus className="w-4 h-4" />
          Create Content
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="banner">Banner</option>
            <option value="announcement">Announcement</option>
            <option value="promotion">Promotion</option>
            <option value="video">Video</option>
            <option value="news">News</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContents.map((content, index) => (
          <motion.div 
            key={content.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative ${
              content.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  {getTypeIcon(content.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{content.title}</h3>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(content.type)}`}>
                      {content.type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                      {content.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Priority</p>
                <p className="text-white font-bold">{content.priority}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4">{content.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Views</p>
                <p className="text-white font-bold">{content.views.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Clicks</p>
                <p className="text-white font-bold">{content.clicks.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <FaCalendarAlt className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 text-xs">
                {content.startDate} - {content.endDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedContent(content);
                  setShowDetailsModal(true);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEye className="w-3 h-3" />
                View
              </button>
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <FaEdit className="w-3 h-3" />
                Edit
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Details Modal */}
      {showDetailsModal && selectedContent && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEye className="w-4 h-4 text-blue-400" />
              Content Details: {selectedContent.title}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">ID:</span> <span className="text-white">{selectedContent.id}</span></p>
                  <p><span className="text-gray-400">Type:</span> <span className="text-white capitalize">{selectedContent.type}</span></p>
                  <p><span className="text-gray-400">Status:</span> <span className={`${getStatusColor(selectedContent.status)}`}>{selectedContent.status}</span></p>
                  <p><span className="text-gray-400">Priority:</span> <span className="text-white">{selectedContent.priority}</span></p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Description</h4>
                <p className="text-gray-300 text-sm">{selectedContent.description}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Performance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Views</p>
                    <p className="text-white font-bold">{selectedContent.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Clicks</p>
                    <p className="text-white font-bold">{selectedContent.clicks.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Schedule</h4>
                <p className="text-gray-300 text-sm">{selectedContent.startDate} - {selectedContent.endDate}</p>
              </div>
              
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Content Modal */}
      {showCreateModal && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaPlus className="w-4 h-4 text-purple-400" />
              Create New Content
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Content Title"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              
              <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                <option value="banner">Banner</option>
                <option value="announcement">Announcement</option>
                <option value="promotion">Promotion</option>
                <option value="video">Video</option>
                <option value="news">News</option>
              </select>
              
              <input
                type="number"
                placeholder="Priority (1-10)"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-2">
                <button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <FaCheck className="w-4 h-4" />
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContentTab; 
