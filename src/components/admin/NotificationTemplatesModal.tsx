import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBookmark, FaSearch, FaPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../ui/CustomSelect';

// Define notification template types
export interface NotificationTemplate {
  id: string;
  name: string;
  titleKey: string;
  bodyKey: string;
  title?: string; // Optional actual title text
  body?: string; // Optional actual body text
  category: 'welcome' | 'reminders' | 'promotional' | 'system' | 'rewards' | 'custom' | 'marketing' | 'announcement';
  targetAudience?: 'all' | 'premium' | 'new' | 'inactive';
  platforms?: string[];
}

interface NotificationTemplatesModalProps {
  onSelectTemplate: (template: NotificationTemplate) => void;
  onClose: () => void;
}

// Predefined templates with translation keys
const predefinedTemplates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.welcome.title',
    bodyKey: 'admin.notifications.templates.templates.welcome.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'welcome',
    targetAudience: 'new',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'dailyMiningReminder',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.dailyMiningReminder.title',
    bodyKey: 'admin.notifications.templates.templates.dailyMiningReminder.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'reminders',
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'stakingOpportunity',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.stakingOpportunity.title',
    bodyKey: 'admin.notifications.templates.templates.stakingOpportunity.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'rewards',
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'referralProgram',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.referralProgram.title',
    bodyKey: 'admin.notifications.templates.templates.referralProgram.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'promotional',
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'newFeature',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.newFeature.title',
    bodyKey: 'admin.notifications.templates.templates.newFeature.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'system',
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'premiumExclusive',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.premiumExclusive.title',
    bodyKey: 'admin.notifications.templates.templates.premiumExclusive.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'promotional',
    targetAudience: 'premium',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'inactiveReminder',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.inactiveReminder.title',
    bodyKey: 'admin.notifications.templates.templates.inactiveReminder.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'reminders',
    targetAudience: 'inactive',
    platforms: ['mobile', 'web', 'inbox']
  },
  {
    id: 'maintenance',
    name: '', // Will be translated via t() function
    titleKey: 'admin.notifications.templates.templates.maintenance.title',
    bodyKey: 'admin.notifications.templates.templates.maintenance.description',
    title: '', // Will be translated via t() function
    body: '', // Will be translated via t() function
    category: 'system',
    targetAudience: 'all',
    platforms: ['mobile', 'web', 'inbox']
  }
];

const NotificationTemplatesModal = ({ onSelectTemplate, onClose }: NotificationTemplatesModalProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
    name: '',
    title: '',
    body: '',
    titleKey: '',
    bodyKey: '',
    category: 'custom',
    targetAudience: 'all',
    platforms: ['mobile', 'web']
  });

  // Filter templates based on search query and category
  const filteredTemplates = predefinedTemplates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.title && template.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.body && template.body.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: NotificationTemplate) => {
    // Convert translation keys to actual text for the admin panel
    const translatedTemplate = {
      ...template,
      title: t(template.titleKey), // Use translated title
      body: t(template.bodyKey), // Use translated body
      name: t(`admin.notifications.templates.templates.${template.id}.name`) // Use translated name
    };
    onSelectTemplate(translatedTemplate);
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
      titleKey: newTemplate.titleKey || `custom.${Date.now()}.title`,
      bodyKey: newTemplate.bodyKey || `custom.${Date.now()}.body`,
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
      case 'welcome': return 'bg-green-500';
      case 'reminders': return 'bg-blue-500';
      case 'promotional': return 'bg-yellow-500';
      case 'system': return 'bg-purple-500';
      case 'rewards': return 'bg-pink-500';
      case 'custom': return 'bg-gray-500';
      case 'marketing': return 'bg-green-500';
      case 'announcement': return 'bg-yellow-500';
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
            {t('admin.notifications.templates.modalTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={t('admin.notifications.templates.actions.close')}
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
              placeholder={t('admin.notifications.templates.actions.search')}
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
              {t('admin.notifications.templates.actions.allCategories')}
            </button>
            <button
              onClick={() => setSelectedCategory('welcome')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'welcome' ? 'bg-green-500' : 'bg-white/10'}`}
            >
              {t('admin.notifications.templates.templateCategories.welcome')}
            </button>
            <button
              onClick={() => setSelectedCategory('reminders')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'reminders' ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              {t('admin.notifications.templates.templateCategories.reminders')}
            </button>
            <button
              onClick={() => setSelectedCategory('promotional')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'promotional' ? 'bg-yellow-500' : 'bg-white/10'}`}
            >
              {t('admin.notifications.templates.templateCategories.promotional')}
            </button>
            <button
              onClick={() => setSelectedCategory('system')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'system' ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              {t('admin.notifications.templates.templateCategories.system')}
            </button>
            <button
              onClick={() => setSelectedCategory('rewards')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCategory === 'rewards' ? 'bg-pink-500' : 'bg-white/10'}`}
            >
              {t('admin.notifications.templates.templateCategories.rewards')}
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
                  <h4 className="text-white font-medium">{t(`admin.notifications.templates.templates.${template.id}.name`)}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {t(`admin.notifications.templates.templateCategories.${template.category}`)}
                  </span>
                </div>
                <p className="text-white text-sm font-medium mb-1">{t(template.titleKey)}</p>
                <p className="text-gray-300 text-sm">{t(template.bodyKey)}</p>
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
              <p className="text-gray-400">{t('admin.notifications.templates.noTemplates')}</p>
              <button
                onClick={() => setShowNewTemplateForm(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <FaPlus className="w-3 h-3" />
                {t('admin.notifications.templates.createNew.title')}
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
              {t('admin.notifications.templates.createNew.title')}
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
            <h4 className="text-white font-medium mb-4">{t('admin.notifications.templates.createNew.title')}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('admin.notifications.templates.createNew.templateName')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t('admin.notifications.templates.createNew.templateNamePlaceholder')}
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('admin.notifications.templates.createNew.notificationTitle')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t('admin.notifications.templates.createNew.notificationTitlePlaceholder')}
                  value={newTemplate.title || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('admin.notifications.templates.createNew.notificationMessage')}
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder={t('admin.notifications.templates.createNew.notificationMessagePlaceholder')}
                  value={newTemplate.body || ''}
                  onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('admin.notifications.templates.createNew.category')}
                  </label>
                  <CustomSelect
                    value={newTemplate.category || 'custom'}
                    onChange={(value) => setNewTemplate({...newTemplate, category: value as any})}
                    options={[
                      { value: 'marketing', label: t('admin.notifications.templates.createNew.marketing') },
                      { value: 'system', label: t('admin.notifications.templates.createNew.system') },
                      { value: 'announcement', label: t('admin.notifications.templates.createNew.announcement') },
                      { value: 'custom', label: t('admin.notifications.templates.createNew.custom') }
                    ]}
                    placeholder={t('admin.notifications.templates.createNew.category')}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('admin.notifications.templates.createNew.targetAudience')}
                  </label>
                  <CustomSelect
                    value={newTemplate.targetAudience || 'all'}
                    onChange={(value) => setNewTemplate({...newTemplate, targetAudience: value as any})}
                    options={[
                      { value: 'all', label: t('admin.notifications.templates.createNew.allUsers') },
                      { value: 'premium', label: t('admin.notifications.templates.createNew.premiumUsers') },
                      { value: 'new', label: t('admin.notifications.templates.createNew.newUsers') },
                      { value: 'inactive', label: t('admin.notifications.templates.createNew.inactiveUsers') }
                    ]}
                    placeholder={t('admin.notifications.templates.createNew.targetAudience')}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('admin.notifications.templates.createNew.platforms')}
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
                    <span className="text-white">{t('admin.notifications.templates.createNew.mobile')}</span>
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
                    <span className="text-white">{t('admin.notifications.templates.createNew.web')}</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewTemplateForm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
                >
                  {t('admin.notifications.templates.createNew.cancel')}
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-sm"
                >
                  {t('admin.notifications.templates.createNew.createTemplate')}
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
