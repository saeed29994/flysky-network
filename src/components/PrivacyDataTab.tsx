
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Mail,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  requestDataDeletion, 
  cancelDataDeletion, 
  checkDeletionStatus,
  DeletionStatus 
} from '../utils/dataDeletionService';

const PrivacyDataTab: React.FC = () => {
  const { t } = useTranslation();
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({ hasRequest: false });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  useEffect(() => {
    loadDeletionStatus();
  }, []);

  const loadDeletionStatus = async () => {
    try {
      const status = await checkDeletionStatus();
      setDeletionStatus(status);
    } catch (error) {
      console.error('Error loading deletion status:', error);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      setLoading(true);
      await requestDataDeletion();
      await loadDeletionStatus();
      setShowConfirmation(false);
      toast.success(t('settingsSection.privacy.deletionRequested'));
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to submit deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      setLoading(true);
      await cancelDataDeletion();
      await loadDeletionStatus();
      setShowCancelConfirmation(false);
      toast.success('Deletion request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast.error('Failed to cancel deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-gray-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return t('settingsSection.privacy.deletionRequested');
      case 'approved':
        return 'Deletion Approved';
      case 'in_progress':
        return t('settingsSection.privacy.deletionInProgress');
      case 'completed':
        return 'Deletion Completed';
      case 'cancelled':
        return 'Deletion Cancelled';
      default:
        return 'No deletion request';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'approved':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'in_progress':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'completed':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'cancelled':
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatEstimatedCompletion = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Due';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t('settingsSection.privacy.title')}</h3>
        </div>
        <p className="text-gray-300">
          {t('settingsSection.privacy.dataDeletionDescription')}
        </p>
      </div>

      {/* Current Status */}
      {deletionStatus.hasRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Current Deletion Status</h4>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(deletionStatus.currentStatus)}`}>
              {getStatusIcon(deletionStatus.currentStatus)}
              <span className="ml-2">{getStatusText(deletionStatus.currentStatus)}</span>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Request Date:</span>
              <span className="text-white">{formatDate(deletionStatus.requestDate)}</span>
            </div>
            {deletionStatus.estimatedCompletion && (
              <div className="flex justify-between">
                <span>Estimated Completion:</span>
                <span className="text-white">{formatEstimatedCompletion(deletionStatus.estimatedCompletion)}</span>
              </div>
            )}
          </div>

          {deletionStatus.currentStatus === 'pending' && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowCancelConfirmation(true)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('settingsSection.privacy.cancelRequest')}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* What Will Be Deleted */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">
          {t('settingsSection.privacy.whatWillBeDeleted')}
        </h4>
        <ul className="space-y-2">
          {(t('settingsSection.privacy.deletionItems', { returnObjects: true }) as string[] || []).map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-gray-300">
              <Trash2 className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-red-400 mb-2">Warning</h4>
            <p className="text-red-300">{t('settingsSection.privacy.deletionWarning')}</p>
          </div>
        </div>
      </div>

      {/* Deletion Process */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">
          {t('settingsSection.privacy.deletionProcess')}
        </h4>
        <ol className="space-y-3">
          {(t('settingsSection.privacy.deletionSteps', { returnObjects: true }) as string[] || []).map((step: string, index: number) => (
            <li key={index} className="flex items-start gap-3 text-gray-300">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </div>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Buttons */}
      {!deletionStatus.hasRequest && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            {t('settingsSection.privacy.requestDeletion')}
          </button>
          
          <a
            href="mailto:support@fsncrew.io"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/20 flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {t('settingsSection.privacy.contactSupport')}
          </a>
        </div>
      )}

      {/* Alternative Methods */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-yellow-400" />
          Alternative Methods
        </h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📱</span>
            <span>In-App: Settings → Privacy & Data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🌐</span>
            <a 
              href="/data-deletion" 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Portal: Public Data Deletion Form
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-yellow-400" />
            <span>Email: support@fsncrew.io</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">💬</span>
            <span>Support: Contact our team</span>
          </div>
        </div>
      </motion.div>

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Need Help?</h4>
            <p className="text-blue-300 mb-3">
              {t('settingsSection.privacy.contactSupportMessage')}
            </p>
            <a
              href="mailto:support@fsncrew.io"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@fsncrew.io
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Confirm Data Deletion</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you absolutely sure you want to request deletion of your account and all associated data? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Confirm Deletion'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Cancel Deletion Request</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel your data deletion request? 
              Your account and data will remain intact.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelDeletion}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PrivacyDataTab;

