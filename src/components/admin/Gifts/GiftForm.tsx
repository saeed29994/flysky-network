// 📁 src/components/admin/Gifts/GiftForm.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, AlertCircle } from 'lucide-react';
import CustomSelect from '../../ui/CustomSelect';
import { CustomTextInput } from '../../ui/CustomTextInput';
import { CustomTextArea } from '../../ui/CustomTextArea';
import CustomCheckbox from '../../ui/CustomCheckbox';
import { db } from '../../../firebase';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
import { GiftFormData } from './types';
import GiftService from './GiftService';
// import { useAuth } from '../../../contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface GiftFormProps {
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  targetType?: 'all' | 'single' | 'multiple' | 'plan';
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  balance: number;
}

const GiftForm: React.FC<GiftFormProps> = ({ onSuccess, onCancel, targetType = 'all' }) => {
  const { t } = useTranslation();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GiftFormData>({
    title: '',
    message: '',
    amount: 0,
    reason: '',
    targetType: targetType
  });

  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [singleUserSearch, setSingleUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const usersPerPage = 25;
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users for multiple selection with proper pagination
  const loadUsers = async (page: number = 1, search: string = '') => {
    setLoadingUsers(true);
    try {
      if (search.trim()) {
        // When searching, load all matching users and paginate client-side
        const q = query(
          collection(db, 'users'),
          where('email', '>=', search.toLowerCase()),
          where('email', '<=', search.toLowerCase() + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        const allMatchingUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || '',
          fullName: doc.data().fullName || '',
          balance: doc.data().balance || 0
        }));

        setTotalUsers(allMatchingUsers.length);
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        setFilteredUsers(allMatchingUsers.slice(startIndex, endIndex));
      } else {
        // Load all users for pagination without search
        const allUsersSnap = await getDocs(query(collection(db, 'users'), orderBy('email')));
        const allUsers = allUsersSnap.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || '',
          fullName: doc.data().fullName || '',
          balance: doc.data().balance || 0
        }));

        setTotalUsers(allUsers.length);
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        setFilteredUsers(allUsers.slice(startIndex, endIndex));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Search users for autocomplete
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      setShowUserSuggestions(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'users'),
        where('email', '>=', searchTerm.toLowerCase()),
        where('email', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        fullName: doc.data().fullName || '',
        balance: doc.data().balance || 0
      }));
      setFilteredUsers(users);
      setShowUserSuggestions(true);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  useEffect(() => {
    if (formData.targetType === 'multiple') {
      loadUsers(currentPage, userSearch);
    }
  }, [formData.targetType, currentPage]);

  useEffect(() => {
    if (formData.targetType === 'multiple') {
      setCurrentPage(1); // Reset to first page when search changes
      loadUsers(1, userSearch);
    }
  }, [userSearch]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (singleUserSearch) {
        searchUsers(singleUserSearch);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [singleUserSearch]);

  const handleInputChange = (field: keyof GiftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleUserSelect = (user: UserData) => {
    if (formData.targetType === 'single') {
      setTargetUsers([user.id]);
      setSingleUserSearch(user.email);
      setShowUserSuggestions(false);
    } else if (formData.targetType === 'multiple') {
      const isSelected = selectedUsers.some(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        setTargetUsers(prev => prev.filter(id => id !== user.id));
      } else {
        setSelectedUsers(prev => [...prev, user]);
        setTargetUsers(prev => [...prev, user.id]);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    // Removed: if (!formData.reason.trim()) newErrors.reason = 'Reason is required';

    if (formData.targetType === 'single' || formData.targetType === 'multiple') {
      if (!targetUsers.length) newErrors.targetUsers = 'At least one user must be selected';
    }

    if (formData.targetType === 'plan' && !formData.planName) {
      newErrors.planName = 'Plan name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!validateForm() || !currentUser) return;

    setLoading(true);

    try {
      const finalFormData = {
        ...formData,
        userIds: formData.targetType === 'single' || formData.targetType === 'multiple' ? targetUsers : undefined
      };

      const result = await GiftService.sendGifts(finalFormData, currentUser.uid);

      // Show success toast
      toast.success('🎉 Gifts sent successfully!', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
        },
        icon: '🎁',
        position: 'top-right',
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error sending gifts:', error);

      // Show error toast
      toast.error('❌ Failed to send gifts. Please try again.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
        },
        icon: '⚠️',
        position: 'top-right',
      });

      setErrors({ submit: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CustomTextInput
            label={t('gifttabtexts.form.giftTitle')}
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Welcome Bonus, Special Promotion"
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <CustomTextInput
            label={t('gifttabtexts.form.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="100"
            min="0"
            step="0.01"
          />
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
      </div>

      <div>
        <CustomTextArea
          label={t('gifttabtexts.form.message')}
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Congratulations! You've received a special gift..."
          rows={4}
        />
        {errors.message && (
          <p className="text-red-400 text-sm mt-1">{errors.message}</p>
        )}
      </div>

      <div>
        <CustomTextInput
          label={t('gifttabtexts.form.reason')}
          value={formData.reason}
          onChange={(e) => handleInputChange('reason', e.target.value)}
          placeholder="e.g., New user welcome, Holiday promotion, Bug fix compensation"
        />
        {errors.reason && (
          <p className="text-red-400 text-sm mt-1">{errors.reason}</p>
        )}
      </div>

      {/* Target-specific fields based on current tab */}
      {formData.targetType === 'single' && (
        <div className="relative">
          <CustomTextInput
            label={t('gifttabtexts.form.searchUser')}
            value={singleUserSearch}
            onChange={(e) => setSingleUserSearch(e.target.value)}
            placeholder={t('gifttabtexts.form.searchPlaceholder')}
          />
          {showUserSuggestions && filteredUsers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                >
                  <div className="text-white font-medium">{user.email}</div>
                  {user.fullName && (
                    <div className="text-gray-400 text-sm">{user.fullName}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {targetUsers.length > 0 && (
            <div className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">Selected: {filteredUsers.find(u => u.id === targetUsers[0])?.email || targetUsers[0]}</p>
            </div>
          )}
        </div>
      )}

      {formData.targetType === 'multiple' && (
        <div className="my-4">
          {/* Search Bar */}
          <CustomTextInput
            label={t('gifttabtexts.form.searchUsers')}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by email..."
          />

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                {t('gifttabtexts.form.usersSelected', { count: selectedUsers.length, plural: selectedUsers.length > 1 ? 's' : '' })}
              </p>
            </div>
          )}

          {/* Users Table with Pagination */}
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3">{t('gifttabtexts.form.tableHeaders.select')}</th>
                      <th className="px-4 py-3">{t('gifttabtexts.form.tableHeaders.email')}</th>
                      <th className="px-4 py-3">{t('gifttabtexts.form.tableHeaders.name')}</th>
                      <th className="px-4 py-3">{t('gifttabtexts.form.tableHeaders.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                        <td className="px-4 py-3">
                          <CustomCheckbox
                            label=""
                            checked={selectedUsers.some(u => u.id === user.id)}
                            onChange={() => handleUserSelect(user)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{user.email}</td>
                        <td className="px-4 py-3">{user.fullName || '-'}</td>
                        <td className="px-4 py-3">{user.balance} FSN</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalUsers > usersPerPage && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-gray-800 text-white rounded">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * usersPerPage >= totalUsers}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {formData.targetType === 'plan' && (
        <div>
          <CustomSelect
            value={formData.planName || ''}
            options={[
              { value: 'economy', label: 'Economy' },
              { value: 'business', label: 'Business' },
              { value: 'first_class', label: 'First Class' }
            ]}
            placeholder={t('gifttabtexts.form.selectPlan')}
            onChange={(value: string) => handleInputChange('planName', value)}
          />
          {errors.planName && (
            <p className="text-red-400 text-sm mt-1">{errors.planName}</p>
          )}
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            {t('gifttabtexts.form.buttons.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              {t('gifttabtexts.form.buttons.sending')}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('gifttabtexts.form.buttons.sendGifts')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default GiftForm;