import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import CustomCheckbox from '../../ui/CustomCheckbox';
import CustomSelect from '../../ui/CustomSelect';
import { ContactMessage } from './types';

interface MessageActionsProps {
  selectedMessages: Set<string>;
  filteredMessages: ContactMessage[];
  messages: ContactMessage[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkAllAsStatus: (status: 'unread' | 'read' | 'replied') => void;
  onMarkAllAsPriority: (priority: 'normal' | 'urgent' | 'spam') => void;
  onShowDeleteConfirmModal: () => void;
}

const MessageActions = ({
  selectedMessages,
  filteredMessages,
  messages,
  onSelectAll,
  onDeselectAll,
  onMarkAllAsStatus,
  onMarkAllAsPriority,
  onShowDeleteConfirmModal,
}: MessageActionsProps) => {
  const { t } = useTranslation();

  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [statusSelection, setStatusSelection] = useState<'unread' | 'read' | 'replied' | 'all'>('all');
  const [prioritySelection, setPrioritySelection] = useState<'normal' | 'urgent' | 'spam' | 'all'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleApplySelections = async () => {
    setModalMessage(t('MessagePage.applyingChanges'));
    setIsModalVisible(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (statusSelection && statusSelection !== 'all') onMarkAllAsStatus(statusSelection);
    if (prioritySelection && prioritySelection !== 'all') onMarkAllAsPriority(prioritySelection);

    setIsModalVisible(false);
  };

  const handleDelete = async () => {
    setModalMessage(t('MessagePage.deletingMessages'));
    setIsModalVisible(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    onShowDeleteConfirmModal();
    setIsModalVisible(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-white opacity-80" />
        <h3 className="text-base sm:text-lg font-semibold text-white">
          {t('MessagePage.actions')}
        </h3>
      </div>

      {/* Content layout with percentage-based columns */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* ✅ Checkbox (12%) */}
        <div className="lg:w-[12%] -mt-[10px]">
          <CustomCheckbox
            label={t('MessagePage.selectall')}
            checked={selectAllChecked}
            onChange={(checked) => {
              setSelectAllChecked(checked);
              if (checked) onSelectAll();
              else onDeselectAll();
            }}
            className="text-white text-sm"
          />
        </div>

        {/* ✅ Two CustomSelects (64%) */}
        <div className="flex flex-col sm:flex-row lg:w-[64%] gap-4">
          <CustomSelect
            value={statusSelection}
            onChange={(value) => setStatusSelection(value as 'unread' | 'read' | 'replied' | 'all')}
            options={[
              { value: 'all', label: t('MessagePage.statusAll') },
              { value: 'unread', label: t('MessagePage.markAllUnread') },
              { value: 'read', label: t('MessagePage.markAllread') },
              { value: 'replied', label: t('MessagePage.markAllReplied') },
            ]}
            placeholder={t('MessagePage.statusAll')}
          />

          <CustomSelect
            value={prioritySelection}
            onChange={(value) => setPrioritySelection(value as 'normal' | 'urgent' | 'spam' | 'all')}
            options={[
              { value: 'all', label: t('MessagePage.priorityAll') },
              { value: 'normal', label: t('MessagePage.markAllNormal') },
              { value: 'urgent', label: t('MessagePage.markAllUrgent') },
              { value: 'spam', label: t('MessagePage.markAllSpam') },
            ]}
            placeholder={t('MessagePage.priorityAll')}
          />
        </div>

        {/* ✅ Buttons (24%) */}
        <div className="flex flex-col sm:flex-row lg:w-[24%] justify-end gap-3">
          <button
            onClick={handleApplySelections}
            disabled={
              (statusSelection === 'all' || !statusSelection) &&
              (prioritySelection === 'all' || !prioritySelection)
            }
            className="min-w-[110px] h-10 px-4 rounded-lg 
                       text-white text-sm font-medium
                       bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
                       hover:from-[#7C3AED] hover:to-[#6D28D9]
                       transition-all duration-300 shadow-md hover:shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('MessagePage.apply')}
          </button>

          <button
            onClick={handleDelete}
            disabled={filteredMessages.length === 0 && selectedMessages.size === 0 && messages.length === 0}
            className="min-w-[110px] h-10 px-4 rounded-lg 
                       bg-red-500/30 text-red-100 text-sm font-medium 
                       hover:bg-red-500/50 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
                 {t('MessagePage.delete')}
          </button>
        </div>
      </div>

      {/* ✅ Fullscreen Modal + Spinner */}
      {isModalVisible && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4" />
          <p className="text-white text-sm opacity-80">{modalMessage}</p>
        </div>
      )}
    </div>
  );
};

export default MessageActions;
