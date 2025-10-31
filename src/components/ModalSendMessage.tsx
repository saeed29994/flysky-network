import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaPaperPlane, FaTimes, FaBookmark } from 'react-icons/fa';
import { useNotifications, NotificationPayload } from '../hooks/useNotifications';
import { db } from '../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import CustomSelect from './ui/CustomSelect';
import CustomCheckbox from './ui/CustomCheckbox';
import CustomDateTimePicker from './ui/CustomDateTimePicker';
import { CustomTextInput } from './ui/CustomTextInput';
import { CustomTextArea } from './ui/CustomTextArea';
import NotificationTemplatesModal, { NotificationTemplate } from './admin/NotificationTemplatesModal';

interface ModalSendMessageProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalSendMessage = ({ isVisible, onClose, onSuccess }: ModalSendMessageProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'premium' | 'new' | 'inactive' | 'custom' | 'plans'>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['mobile', 'web', 'inbox']);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const { sendAdvancedNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [internationalizationInfo, setInternationalizationInfo] = useState<{
    languages: number;
    distribution: Record<string, number>;
  } | null>(null);

  const { t } = useTranslation();

  // Fetch available plans from Firebase
  useEffect(() => {
    const fetchAvailablePlans = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        // Extract unique plan names from user memberships
        const plans = new Set<string>();
        snapshot.docs.forEach(doc => {
          const userData = doc.data();
          if (userData.membership && userData.membership.planName) {
            plans.add(userData.membership.planName);
          }
        });

        // Convert to array and sort
        const sortedPlans = Array.from(plans).sort();
        setAvailablePlans(sortedPlans);
      } catch (err) {
        console.error('Error fetching available plans:', err);
        setAvailablePlans([]);
      }
    };

    if (isVisible) {
      fetchAvailablePlans();
    }
  }, [isVisible]);

  // Fetch user count based on filter
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const usersRef = collection(db, 'users');
        let usersQueryRef;

        if (targetAudience === 'new') {
          // Users created in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          usersQueryRef = query(usersRef, where('createdAt', '>=', sevenDaysAgo));
        } else if (targetAudience === 'inactive') {
          // Users who haven't logged in for 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          usersQueryRef = query(usersRef, where('lastLogin', '<=', thirtyDaysAgo));
        } else {
          usersQueryRef = usersRef;
        }

        const snapshot = await getDocs(usersQueryRef);
        setUserCount(snapshot.size);
      } catch (err) {
        console.error('Error fetching user count:', err);
        setUserCount(0);
      }
    };

    if (isVisible) {
      fetchUserCount();
    }
  }, [targetAudience, isVisible]);

  // Fetch user count for plans selection
  useEffect(() => {
    if (targetAudience === 'plans' && selectedPlans.length > 0) {
      const fetchPlanUserCount = async () => {
        try {
          const usersRef = collection(db, 'users');
          const usersQuery = query(usersRef, where('membership.planName', 'in', selectedPlans));
          const snapshot = await getDocs(usersQuery);
          setUserCount(snapshot.size);
        } catch (err) {
          console.error('Error fetching users by plans:', err);
          setUserCount(0);
        }
      };
      fetchPlanUserCount();
    }
  }, [selectedPlans, targetAudience]);

  const searchUsersForSend = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(usersQuery);

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setFilteredUsers(users);
    } catch (err) {
      console.error('Error searching users:', err);
      setFilteredUsers([]);
    }
  }, []);

  // Debounced search effect for send modal
  useEffect(() => {
    if (isVisible) {
      const timeoutId = setTimeout(() => {
        searchUsersForSend(userSearch);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [userSearch, searchUsersForSend, isVisible]);

  const handleSendNotification = async () => {
    console.log('🎯 handleSendNotification called');
    if (!title || !body) {
      setError(t('admin.notifications.messages.pleaseEnterBoth'));
      return;
    }

    try {
      // Clear any previous errors
      setError(null);
      setSuccessMessage(null);

      // Show loading state
      setLoading(true);
      console.log('🚀 Starting notification send process...');

      const payload: NotificationPayload = {
         title,
         body,
         targetAudience,
         platforms: [...new Set([...selectedPlatforms, 'inbox'])], // Ensure inbox is always included
         scheduledFor: scheduleDate && scheduleDate > new Date() ? scheduleDate : null, // Only schedule if future date
         customUserIds: targetAudience === 'custom' ? customUserIds : undefined,
         selectedPlans: targetAudience === 'plans' ? selectedPlans : undefined
       };

       console.log('📋 Payload to send:', payload);
       const success = await sendAdvancedNotification(payload);
       console.log('📨 sendAdvancedNotification result:', success);

      if (success) {
        // Show success message
        setSuccessMessage(t('admin.notifications.messages.sentSuccessfully'));

        // Extract internationalization info if available
        if (success && typeof success === 'object' && success !== null) {
          const successObj = success as any;
          if (successObj.languageDistribution) {
            setInternationalizationInfo({
              languages: successObj.totalLanguages || 0,
              distribution: successObj.languageDistribution || {}
            });
          }
        }

        setTimeout(() => {
          setSuccessMessage(null);
          setInternationalizationInfo(null);
          // Clear form
          setTitle('');
          setBody('');
          setTargetAudience('all');
          setSelectedPlatforms(['mobile', 'web', 'inbox']);
          setScheduleDate(null);
          setSelectedPlans([]);
          setCustomUserIds([]);
          setUserSearch('');
          setFilteredUsers([]);
          onSuccess();
          onClose();
        }, 3000); // Hide after 3 seconds to show language info

      } else {
        // Keep form open if send failed
        console.error('Failed to send notification');
      }
    } catch (err) {
      console.error('Error in handleSendNotification:', err);
      setError(t('admin.notifications.messages.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: NotificationTemplate) => {
    // Use translation keys to get the actual text
    setTitle(template.titleKey ? t(template.titleKey) : template.name);
    setBody(template.bodyKey ? t(template.bodyKey) : template.name);
    if (template.targetAudience) {
      setTargetAudience(template.targetAudience);
    }
    if (template.platforms) {
      setSelectedPlatforms(template.platforms);
    }
    setShowTemplatesModal(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FaPaperPlane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('admin.notifications.modals.sendNotification')}</h3>
            <p className="text-gray-400 text-sm">{t('admin.notifications.header.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title={t('admin.notifications.actions.useTemplate')}
          >
            <FaBookmark className="w-4 h-4 text-purple-400" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
          ✅ {successMessage}
          {internationalizationInfo && (
            <div className="mt-2 pt-2 border-t border-green-500/30">
              <p className="text-green-300 text-xs">
                🌍 Sent in {internationalizationInfo.languages} languages
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(internationalizationInfo.distribution).map(([lang, count]) => (
                  <span key={lang} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500/30 text-green-200">
                    {lang}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-4">
          <CustomTextInput
            label={t('admin.notifications.form.title')}
            placeholder={t('admin.notifications.form.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <CustomTextArea
            label={t('admin.notifications.form.message')}
            placeholder={t('admin.notifications.form.messagePlaceholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />

          <div className="md:col-span-2">
            <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
              {t('admin.notifications.form.targetAudience')}
            </label>
            <CustomSelect
              value={targetAudience}
              onChange={(value) => setTargetAudience(value as any)}
              options={[
                { value: 'all', label: `${t('admin.notifications.targetAudience.all')} (${userCount})` },
                { value: 'new', label: t('admin.notifications.targetAudience.new') },
                { value: 'inactive', label: t('admin.notifications.targetAudience.inactive') },
                { value: 'plans', label: t('admin.notifications.targetAudience.plans') },
                { value: 'custom', label: t('admin.notifications.targetAudience.custom') },
              ]}
              placeholder={t('admin.notifications.form.targetAudience')}
              className="w-full"
            />
          </div>

          {/* Subscription Plans Selection */}
          {targetAudience === 'plans' && (
            <div className="space-y-3">
              <label className="block text-gray-300 text-xs sm:text-sm font-medium">
                Select Subscription Plans
              </label>
              <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                <div className="flex flex-wrap gap-6">
                  {availablePlans.length > 0 ? (
                    availablePlans.map((plan) => {
                      let displayLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
                      if (plan === 'business') displayLabel = 'Business Plan';
                      else if (plan === 'economy') displayLabel = 'Economy Plan';
                      else if (plan === 'first-lifetime') displayLabel = 'First Class Plan';

                      return (
                        <CustomCheckbox
                          key={plan}
                          label={displayLabel}
                          checked={selectedPlans.includes(plan)}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedPlans([...selectedPlans, plan]);
                            } else {
                              setSelectedPlans(selectedPlans.filter(p => p !== plan));
                            }
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-sm py-2">
                      Loading available plans...
                    </div>
                  )}
                </div>
                {selectedPlans.length > 0 && (
                  <div className="text-green-400 text-sm mt-3">
                    Users with selected plans: {userCount} users found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom User Selection */}
          {targetAudience === 'custom' && (
            <div className="md:col-span-2 space-y-3">
              <label className="block text-gray-300 text-xs sm:text-sm font-medium">
                {t('admin.notifications.targetAudience.customUserSelection')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('admin.notifications.targetAudience.customUserSearchPlaceholder')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onPaste={(e) => {
                    // Trigger search after paste
                    const pastedValue = e.clipboardData.getData('text');
                    setUserSearch(pastedValue);
                    // The useEffect will handle the search
                  }}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-white/20 transition cursor-text"
                />
                {userSearch && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/20 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm border-b border-white/10 last:border-b-0"
                        onClick={() => {
                          if (!customUserIds.includes(user.id)) {
                            setCustomUserIds([...customUserIds, user.id]);
                          }
                          setUserSearch('');
                        }}
                      >
                        {user.email} {user.displayName ? `(${user.displayName})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Users Display */}
              {customUserIds.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-gray-300 text-xs sm:text-sm font-medium">
                    {t('admin.notifications.targetAudience.selectedUsers')} ({customUserIds.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {customUserIds.map((userId) => {
                      const user = filteredUsers.find(u => u.id === userId);
                      return (
                        <div key={userId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-white text-sm">
                            {user?.email || userId}
                          </span>
                          <button
                            onClick={() => setCustomUserIds(customUserIds.filter(id => id !== userId))}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2">
              {t('admin.notifications.form.platforms')}
            </label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/20">
              <div className="flex gap-6">
                <CustomCheckbox
                  label="Mobile App Platform"
                  checked={selectedPlatforms.includes('mobile')}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, 'mobile']);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'mobile'));
                    }
                  }}
                />
                <CustomCheckbox
                  label="Web App Platform"
                  checked={selectedPlatforms.includes('web')}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedPlatforms([...selectedPlatforms, 'web']);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'web'));
                    }
                  }}
                />
                <CustomCheckbox
                  label="Inbox Message (Required)"
                  checked={true}
                  disabled={true}
                  onChange={() => {}} // No-op since it's always required
                />
              </div>
            </div>
          </div>

          <div>
            <CustomDateTimePicker
              label={t('admin.notifications.form.schedule')}
              value={scheduleDate}
              onChange={setScheduleDate}
              placeholder={t('admin.notifications.form.schedulePlaceholder')}
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm sm:text-base"
            >
              {t('admin.notifications.actions.cancel')}
            </button>
            <button
              onClick={handleSendNotification}
              disabled={loading}
              className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaPaperPlane className="w-4 h-4" />
              )}
              {loading ? t('admin.notifications.loading.sending') : (scheduleDate ? t('admin.notifications.actions.schedule') : t('admin.notifications.actions.sendNow'))}
            </button>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <NotificationTemplatesModal
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
    </motion.div>
  );
};

export default ModalSendMessage;