
import { useTranslation } from 'react-i18next';
import { Edit } from 'lucide-react';
import CustomRadio from '../../ui/CustomRadio';
import FormDialogTemplate from '@/components/Forms/FormDialogTemplate';

interface EditStatusModalProps {
  isOpen: boolean;
  tempStatus: 'unread' | 'read' | 'replied';
  tempPriority: 'normal' | 'urgent' | 'spam';
  onClose: () => void;
  onConfirm: () => void;
  onStatusChange: (status: 'unread' | 'read' | 'replied') => void;
  onPriorityChange: (priority: 'normal' | 'urgent' | 'spam') => void;
}

const EditStatusModal = ({
  isOpen,
  tempStatus,
  tempPriority,
  onClose,
  onConfirm,
  onStatusChange,
  onPriorityChange,
}: EditStatusModalProps) => {
  const { t } = useTranslation();

  return (
    <FormDialogTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={t('MessagePage.editStatus')}
      icon={<Edit className="w-6 h-6 text-white" />}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
          >
            {t('MessagePage.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {t('MessagePage.confirm')}
          </button>
        </>
      }
    >
      {/* Body يبقى كما هو تمامًا */}
      <div className="space-y-6">
        <div>
          <h3 className="text-white font-medium mb-3">{t('MessagePage.status')}</h3>
          <div className="space-y-2">
            <CustomRadio
              label={t('MessagePage.statusUnread')}
              value="unread"
              checked={tempStatus === 'unread'}
              onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
            />
            <CustomRadio
              label={t('MessagePage.statusRead')}
              value="read"
              checked={tempStatus === 'read'}
              onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
            />
            <CustomRadio
              label={t('MessagePage.statusReplied')}
              value="replied"
              checked={tempStatus === 'replied'}
              onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
            />
          </div>
        </div>

        <div>
          <h3 className="text-white font-medium mb-3">{t('MessagePage.priority')}</h3>
          <div className="space-y-2">
            <CustomRadio
              label={t('MessagePage.priorityUrgent')}
              value="urgent"
              checked={tempPriority === 'urgent'}
              onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
            />
            <CustomRadio
              label={t('MessagePage.priorityNormal')}
              value="normal"
              checked={tempPriority === 'normal'}
              onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
            />
            <CustomRadio
              label={t('MessagePage.prioritySpam')}
              value="spam"
              checked={tempPriority === 'spam'}
              onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
            />
          </div>
        </div>
      </div>
    </FormDialogTemplate>
  );
};

export default EditStatusModal;



// import { useTranslation } from 'react-i18next';
// import { Edit } from 'lucide-react';
// import CustomRadio from '../../ui/CustomRadio';

// interface EditStatusModalProps {
//   isOpen: boolean;
//   tempStatus: 'unread' | 'read' | 'replied';
//   tempPriority: 'normal' | 'urgent' | 'spam';
//   onClose: () => void;
//   onConfirm: () => void;
//   onStatusChange: (status: 'unread' | 'read' | 'replied') => void;
//   onPriorityChange: (priority: 'normal' | 'urgent' | 'spam') => void;
// }

// const EditStatusModal = ({
//   isOpen,
//   tempStatus,
//   tempPriority,
//   onClose,
//   onConfirm,
//   onStatusChange,
//   onPriorityChange,
// }: EditStatusModalProps) => {
//   const { t } = useTranslation();

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
//         <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 border-b border-white/10 rounded-t-xl sm:rounded-t-2xl">
//           <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
//             <Edit className="w-5 h-5" />
//             {t('MessagePage.editStatus')}
//           </h2>
//         </div>
//         <div className="p-4 sm:p-6">
//           <div className="space-y-6">
//             <div>
//               <h3 className="text-white font-medium mb-3">{t('MessagePage.status')}</h3>
//               <div className="space-y-2">
//                 <CustomRadio
//                   label={t('MessagePage.statusUnread')}
//                   value="unread"
//                   checked={tempStatus === 'unread'}
//                   onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
//                 />
//                 <CustomRadio
//                   label={t('MessagePage.statusRead')}
//                   value="read"
//                   checked={tempStatus === 'read'}
//                   onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
//                 />
//                 <CustomRadio
//                   label={t('MessagePage.statusReplied')}
//                   value="replied"
//                   checked={tempStatus === 'replied'}
//                   onChange={(value) => onStatusChange(value as 'unread' | 'read' | 'replied')}
//                 />
//               </div>
//             </div>

//             <div>
//               <h3 className="text-white font-medium mb-3">{t('MessagePage.priority')}</h3>
//               <div className="space-y-2">
//                 <CustomRadio
//                   label={t('MessagePage.priorityUrgent')}
//                   value="urgent"
//                   checked={tempPriority === 'urgent'}
//                   onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
//                 />
//                 <CustomRadio
//                   label={t('MessagePage.priorityNormal')}
//                   value="normal"
//                   checked={tempPriority === 'normal'}
//                   onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
//                 />
//                 <CustomRadio
//                   label={t('MessagePage.prioritySpam')}
//                   value="spam"
//                   checked={tempPriority === 'spam'}
//                   onChange={(value) => onPriorityChange(value as 'normal' | 'urgent' | 'spam')}
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-3 justify-end mt-6">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
//             >
//               {t('MessagePage.cancel')}
//             </button>
//             <button
//               onClick={onConfirm}
//               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
//             >
//               {t('MessagePage.confirm')}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditStatusModal;