// 📁 src/components/admin/Gifts/GiftsTab.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabsTemplate } from '../../ui/TabsTemplate';
import GiftForm from './GiftForm';
import GiftHistory from './GiftHistory';
import { GiftDistribution } from './types';

const GiftsTab: React.FC = () => {
  const { t } = useTranslation();

  const handleGiftSuccess = (result: GiftDistribution) => {
    console.log('Gift sent successfully:', result);
    // Could trigger a refresh of the history here
  };


  const tabs = [
    { key: 'all_users', label: t('gifttabtexts.tabs.allUsers') },
    { key: 'single_user', label: t('gifttabtexts.tabs.singleUser') },
    { key: 'multiple_users', label: t('gifttabtexts.tabs.multipleUsers') },
    { key: 'by_plan', label: t('gifttabtexts.tabs.byPlan') },
    { key: 'gift_history', label: t('gifttabtexts.tabs.giftHistory') }
  ];

  return (
    <TabsTemplate tabs={tabs}>
      {(activeTab: string) => (
        <>
          {activeTab === 'all_users' && (
            <GiftForm
              onSuccess={handleGiftSuccess}
              onCancel={() => {}}
              targetType="all"
            />
          )}
          {activeTab === 'single_user' && (
            <GiftForm
              onSuccess={handleGiftSuccess}
              onCancel={() => {}}
              targetType="single"
            />
          )}
          {activeTab === 'multiple_users' && (
            <GiftForm
              onSuccess={handleGiftSuccess}
              onCancel={() => {}}
              targetType="multiple"
            />
          )}
          {activeTab === 'by_plan' && (
            <GiftForm
              onSuccess={handleGiftSuccess}
              onCancel={() => {}}
              targetType="plan"
            />
          )}
          {activeTab === 'gift_history' && (
            <GiftHistory />
          )}
        </>
      )}
    </TabsTemplate>
  );
};

export default GiftsTab;