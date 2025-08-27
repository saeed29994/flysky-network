// 📁 src/components/admin/DataDeletionManagementTab.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';
import { 
  Trash2, 
  Clock, 
  CheckCircle, 
  X, 
  Eye,
  Play,
  Check,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getAllDeletionRequestsWithPublic, 
  updateDeletionStatus, 
  processUserDataDeletion,
  DataDeletionRequest 
} from '../../utils/dataDeletionService';

const DataDeletionManagementTab: React.FC = () => {
  const { t } = useTranslation();

  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataDeletionRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingDeletion, setProcessingDeletion] = useState(false);

  useEffect(() => {
    loadDeletionRequests();
  }, []);

  const loadDeletionRequests = async () => {
    try {
      setLoading(true);
      const requests = await getAllDeletionRequestsWithPublic();
      setDeletionRequests(requests);
    } catch (error) {
      console.error('Error loading deletion requests:', error);
      toast.error(t('admin.dataDeletion.messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: DataDeletionRequest['status']) => {
    try {
      await updateDeletionStatus(requestId, newStatus, adminNotes);
      await loadDeletionRequests();
      setAdminNotes('');
      toast.success(t('admin.dataDeletion.messages.statusUpdated', { status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('admin.dataDeletion.messages.failedToUpdate'));
    }
  };

  const handleProcessDeletion = async (userId: string) => {
    try {
      setProcessingDeletion(true);
      await processUserDataDeletion(userId);
      await loadDeletionRequests();
      setShowDetails(false);
      setSelectedRequest(null);
      toast.success(t('admin.dataDeletion.messages.userDataDeleted'));
    } catch (error) {
      console.error('Error processing deletion:', error);
      toast.error(t('admin.dataDeletion.messages.failedToProcess'));
    } finally {
      setProcessingDeletion(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getActionButtons = (request: DataDeletionRequest) => {
    switch (request.status) {
      case 'pending':
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleStatusUpdate(request.id, 'approved')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 min-w-[80px]"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">{t('admin.dataDeletion.actions.approve')}</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(request.id, 'cancelled')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 min-w-[80px]"
            >
              <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">{t('admin.dataDeletion.actions.reject')}</span>
            </button>
          </div>
        );
      case 'approved':
        return (
          <button
            onClick={() => handleStatusUpdate(request.id, 'in_progress')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 min-w-[80px]"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">{t('admin.dataDeletion.actions.startProcessing')}</span>
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => request.userId && handleProcessDeletion(request.userId)}
            disabled={processingDeletion || !request.userId}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[80px]"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">
                {processingDeletion ? t('admin.dataDeletion.actions.processing') : t('admin.dataDeletion.actions.completeDeletion')}
              </span>
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-300">{t('admin.dataDeletion.requests.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
          <h3 className="text-base sm:text-lg font-semibold text-white">{t('admin.dataDeletion.title')}</h3>
        </div>
        <p className="text-sm sm:text-base text-gray-300">
          {t('admin.dataDeletion.description')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {['pending', 'approved', 'in_progress', 'completed', 'cancelled'].map((status) => {
          const count = deletionRequests.filter(r => r.status === status).length;
          return (
            <div key={status} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(status)}
                <span className="text-xs sm:text-sm font-medium text-gray-300 capitalize">
                  {t(`admin.dataDeletion.stats.${status === 'in_progress' ? 'inProgress' : status}`)}
                </span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h4 className="text-base sm:text-lg font-semibold text-white">{t('admin.dataDeletion.requests.title')}</h4>
          <p className="text-xs sm:text-sm text-gray-300">{t('admin.dataDeletion.requests.total', { count: deletionRequests.length })}</p>
        </div>
        
        {deletionRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.dataDeletion.requests.noRequests')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {deletionRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 sm:p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header with title and status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-white text-base sm:text-lg break-words">
                          {request.fullName || request.userName}
                        </h5>
                        {/* Badges row - responsive layout */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {request.isPublicRequest && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 whitespace-nowrap">
                              {t('admin.dataDeletion.badges.webRequest')}
                            </span>
                          )}
                          {request.existingUser && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 whitespace-nowrap">
                              {t('admin.dataDeletion.badges.existingUser')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status badge - positioned to the right */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1.5 capitalize whitespace-nowrap">
                            {t(`admin.dataDeletion.stats.${request.status === 'in_progress' ? 'inProgress' : request.status}`)}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {/* User details */}
                    <div className="text-sm text-gray-400 space-y-1.5">
                      <div className="break-words">{t('admin.dataDeletion.fields.email')}: {request.userEmail}</div>
                      <div>{t('admin.dataDeletion.fields.requested')}: {formatDate(request.requestDate)}</div>
                      {request.source && <div>{t('admin.dataDeletion.fields.source')}: {request.source.replace('_', ' ')}</div>}
                      {request.reviewDate && <div>{t('admin.dataDeletion.fields.reviewed')}: {formatDate(request.reviewDate)}</div>}
                      {request.startDate && <div>{t('admin.dataDeletion.fields.started')}: {formatDate(request.startDate)}</div>}
                      {request.completionDate && <div>{t('admin.dataDeletion.fields.completed')}: {formatDate(request.completionDate)}</div>}
                    </div>
                  </div>
                  
                  {/* Action buttons - responsive layout */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetails(true);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                      title={t('admin.dataDeletion.actions.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      {getActionButtons(request)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notes Input */}
      <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t('admin.dataDeletion.adminNotes.title')}</h4>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder={t('admin.dataDeletion.adminNotes.placeholder')}
          className="w-full h-20 sm:h-24 px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          {t('admin.dataDeletion.adminNotes.description')}
        </p>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-4 sm:p-6 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">{t('admin.dataDeletion.details.title')}</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.userName')}</label>
                  <div className="text-sm sm:text-base text-white break-words">{selectedRequest.userName}</div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.email')}</label>
                  <div className="text-sm sm:text-base text-white break-words">{selectedRequest.userEmail}</div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.status')}</label>
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="capitalize">
                      {t(`admin.dataDeletion.stats.${selectedRequest.status === 'in_progress' ? 'inProgress' : selectedRequest.status}`)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.requestDate')}</label>
                  <div className="text-sm sm:text-base text-white">{formatDate(selectedRequest.requestDate)}</div>
                </div>
              </div>

              {selectedRequest.reviewDate && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.reviewDate')}</label>
                  <div className="text-sm sm:text-base text-white">{formatDate(selectedRequest.reviewDate)}</div>
                </div>
              )}

              {selectedRequest.startDate && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.processingStartDate')}</label>
                  <div className="text-sm sm:text-base text-white">{formatDate(selectedRequest.startDate)}</div>
                </div>
              )}

              {selectedRequest.completionDate && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.completionDate')}</label>
                  <div className="text-sm sm:text-base text-white">{formatDate(selectedRequest.completionDate)}</div>
                </div>
              )}

              {selectedRequest.estimatedCompletion && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.estimatedCompletion')}</label>
                  <div className="text-sm sm:text-base text-white">{formatDate(selectedRequest.estimatedCompletion)}</div>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-400">{t('admin.dataDeletion.details.adminNotes')}</label>
                  <div className="text-sm sm:text-base text-white bg-white/10 p-2 sm:p-3 rounded-lg break-words">{selectedRequest.adminNotes}</div>
                </div>
              )}

              {selectedRequest.reason && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-white">{t('admin.dataDeletion.details.userReason')}</label>
                  <div className="text-sm sm:text-base text-white bg-white/10 p-2 sm:p-3 rounded-lg break-words">{selectedRequest.reason}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                {t('admin.common.close')}
              </button>
              
              {selectedRequest.status === 'in_progress' && (
                <button
                  onClick={() => selectedRequest.userId && handleProcessDeletion(selectedRequest.userId)}
                  disabled={processingDeletion || !selectedRequest.userId}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  {processingDeletion ? t('admin.dataDeletion.actions.processing') : t('admin.dataDeletion.actions.completeDeletion')}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DataDeletionManagementTab;
