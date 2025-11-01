import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import CustomSelect from '../../ui/CustomSelect';
import CustomSearch from '../../ui/CustomSearch';
import { StatusFilter, PriorityFilter, DateFilter } from './types';

interface MessageFiltersProps {
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  dateFilter: DateFilter;
  onSearch: (value: string) => void;
  onCancelSearch: () => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
}

const MessageFilters = ({
  statusFilter,
  priorityFilter,
  dateFilter,
  onSearch,
  onCancelSearch,
  onStatusFilterChange,
  onPriorityFilterChange,
  onDateFilterChange,
}: MessageFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {t('MessagePage.filters')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <CustomSearch
          placeholder={t('MessagePage.searchPlaceholder')}
          onSearch={onSearch}
          onCancel={onCancelSearch}
        />

        {/* Status Filter */}
        <CustomSelect
          value={statusFilter}
          onChange={(value) => onStatusFilterChange(value as StatusFilter)}
          options={[
            { value: 'all', label: t('MessagePage.statusAll') },
            { value: 'unread', label: t('MessagePage.statusUnread') },
            { value: 'read', label: t('MessagePage.statusRead') },
            { value: 'replied', label: t('MessagePage.statusReplied') }
          ]}
          placeholder={t('MessagePage.statusAll')}
        />

        {/* Priority Filter */}
        <CustomSelect
          value={priorityFilter}
          onChange={(value) => onPriorityFilterChange(value as PriorityFilter)}
          options={[
            { value: 'all', label: t('MessagePage.priorityAll') },
            { value: 'normal', label: t('MessagePage.priorityNormal') },
            { value: 'urgent', label: t('MessagePage.priorityUrgent') },
            { value: 'spam', label: t('MessagePage.prioritySpam') }
          ]}
          placeholder={t('MessagePage.priorityAll')}
        />

        {/* Date Filter */}
        <CustomSelect
          value={dateFilter}
          onChange={(value) => onDateFilterChange(value as DateFilter)}
          options={[
            { value: 'all', label: t('MessagePage.dateAll') },
            { value: 'today', label: t('MessagePage.dateToday') },
            { value: 'week', label: t('MessagePage.dateWeek') },
            { value: 'month', label: t('MessagePage.dateMonth') }
          ]}
          placeholder={t('MessagePage.dateAll')}
        />
      </div>
    </div>
  );
};

export default MessageFilters;