import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBookmark, FaSearch, FaPlus } from 'react-icons/fa';

// Define notification template types
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: 'marketing' | 'system' | 'announcement' | 'custom';
  targetAudience?: 'all' | 'premium' | 'new' | 'inactive';
  platforms?: string[];
}

interface NotificationTemplatesModalProps {
  onSelectTemplate: (template: NotificationTemplate) => void;
  onClose: () => void;
}

// Predefined templates
const predefinedTemplates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    title: '👋 Welcome to Flysky Network!',
    body: 'Thank you for joining our community. Start mining today to earn your first FSN tokens!',
    category: 'system',
    targetAudience: 'new',
    platforms: ['mobile', 'web']
  },
  {
    id: 'mining-reminder',
    name: 'Daily Mining Reminder',
    title: '⛏️ Daily Mining Reminder',
    body: 'Don\'t forget to mine today to earn your daily FSN rewards!',
    category: 'system',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  },
  {
    id: 'staking-reminder',
    name: 'Staking Opportunity',
    title: '💰 Boost Your Earnings with Staking',
    body: 'Stake your FSN tokens today and earn up to 12% APY. Premium members get even higher rates!',
    category: 'marketing',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  },
  {
    id: 'referral-program',
    name: 'Referral Program',
    title: '🎁 Invite Friends, Earn Rewards',
    body: 'Share your referral code and earn 10 FSN for each friend who joins!',
    category: 'marketing',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  },
  {
    id: 'new-feature',
    name: 'New Feature Announcement',
    title: '✨ New Feature: Staking Pools',
    body: 'We\'ve just launched staking pools! Join with other members to earn higher rewards together.',
    category: 'announcement',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  },
  {
    id: 'premium-exclusive',
    name: 'Premium Exclusive',
    title: '👑 Exclusive for Premium Members',
    body: 'As a premium member, you now have access to our new advanced mining tools. Check them out now!',
    category: 'marketing',
    targetAudience: 'premium',
    platforms: ['mobile', 'web']
  },
  {
    id: 'inactive-reminder',
    name: 'Inactive User Reminder',
    title: '👋 We Miss You!',
    body: 'It\'s been a while since you last visited. Come back and see what\'s new in Flysky Network!',
    category: 'marketing',
    targetAudience: 'inactive',
    platforms: ['mobile', 'web']
  },
  {
    id: 'maintenance',
    name: 'Scheduled Maintenance',
    title: '🔧 Scheduled Maintenance',
    body: 'We\'ll be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. Some services may be unavailable during this period.',
    category: 'system',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  }
];

const NotificationTemplatesModal = ({ onSelectTemplate, onClose }: NotificationTemplatesModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
    name: '',
    title: '',
    body: '',
    category: 'custom',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  });

  // Filter templates based on search query and category
  const filteredTemplates = predefinedTemplates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: NotificationTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.body) {
      alert('Please fill in all required fields');
      return;
    }

    const template: NotificationTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name || '',
      title: newTemplate.title || '',
      body: newTemplate.body || '',
      category: newTemplate.category as 'custom',
      targetAudience: newTemplate.targetAudience as 'all',
      platforms: newTemplate.platforms || ['mobile', 'web']
    };

    onSelectTemplate(template);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing': return 'bg-green-500';
      case 'system': return 'bg-blue-500';
      case 'announcement': return 'bg-yellow-500';
      case 'custom': return 'bg-purple-500';
      default: return 'bg-gray-500';
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
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FaBookmark className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            Notification Templates
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${!selectedCategory ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('marketing')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'marketing' ? 'bg-green-500' : 'bg-white/10'}`}
            >
              Marketing
            </button>
            <button
              onClick={() => setSelectedCategory('system')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'system' ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              System
            </button>
            <button
              onClick={() => setSelectedCategory('announcement')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'announcement' ? 'bg-yellow-500' : 'bg-white/10'}`}
            >
              Announcement
            </button>
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'custom' ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-3 mb-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div 
                key={template.id}
                className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{template.name}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                <p className="text-white text-sm font-medium mb-1">{template.title}</p>
                <p className="text-gray-300 text-sm">{template.body}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Target: <span className="text-white capitalize">{template.targetAudience}</span>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    Platforms: <span className="text-white">{template.platforms?.join(', ')}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No templates found</p>
              <button
                onClick={() => setShowNewTemplateForm(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <FaPlus className="w-3 h-3" />
                Create New Template
              </button>
            </div>
          )}
        </div>

        {/* Create New Template Button */}
        {filteredTemplates.length > 0 && !showNewTemplateForm && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowNewTemplateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FaPlus className="w-3 h-3" />
              Create New Template
            </button>
          </div>
        )}

        {/* New Template Form */}
        {showNewTemplateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <h4 className="text-white font-medium mb-4">Create New Template</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter template name"
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter notification title"
                  value={newTemplate.title || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Notification Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Enter notification message"
                  value={newTemplate.body || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newTemplate.category || 'custom'}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value as any})}
                  >
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                    <option value="announcement">Announcement</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Target Audience
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newTemplate.targetAudience || 'all'}
                    onChange={(e) => setNewTemplate({...newTemplate, targetAudience: e.target.value as any})}
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Users</option>
                    <option value="new">New Users</option>
                    <option value="inactive">Inactive Users</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Platforms
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTemplate.platforms?.includes('mobile')}
                      onChange={(e) => {
                        const platforms = [...(newTemplate.platforms || [])];
                        if (e.target.checked) {
                          if (!platforms.includes('mobile')) platforms.push('mobile');
                        } else {
                          const index = platforms.indexOf('mobile');
                          if (index >= 0) platforms.splice(index, 1);
                        }
                        setNewTemplate({...newTemplate, platforms});
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
                    />
                    <span className="text-white">Mobile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTemplate.platforms?.includes('web')}
                      onChange={(e) => {
                        const platforms = [...(newTemplate.platforms || [])];
                        if (e.target.checked) {
                          if (!platforms.includes('web')) platforms.push('web');
                        } else {
                          const index = platforms.indexOf('web');
                          if (index >= 0) platforms.splice(index, 1);
                        }
                        setNewTemplate({...newTemplate, platforms});
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
                    />
                    <span className="text-white">Web</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewTemplateForm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm"
                >
                  Create Template
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NotificationTemplatesModal;
