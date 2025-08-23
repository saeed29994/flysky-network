// 📁 src/components/admin/DataDeletionManagementTab.tsx

import React, { useState, useEffect } from 'react';

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
      toast.error('Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: DataDeletionRequest['status']) => {
    try {
      await updateDeletionStatus(requestId, newStatus, adminNotes);
      await loadDeletionRequests();
      setAdminNotes('');
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleProcessDeletion = async (userId: string) => {
    try {
      setProcessingDeletion(true);
      await processUserDataDeletion(userId);
      await loadDeletionRequests();
      setShowDetails(false);
      setSelectedRequest(null);
      toast.success('User data deleted successfully');
    } catch (error) {
      console.error('Error processing deletion:', error);
      toast.error('Failed to process deletion');
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
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate(request.id, 'approved')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              <Check className="w-4 h-4 mr-1 inline" />
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate(request.id, 'cancelled')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              <Ban className="w-4 h-4 mr-1 inline" />
              Reject
            </button>
          </div>
        );
      case 'approved':
        return (
          <button
            onClick={() => handleStatusUpdate(request.id, 'in_progress')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            <Play className="w-4 h-4 mr-1 inline" />
            Start Processing
          </button>
        );
      case 'in_progress':
        return (
                      <button
              onClick={() => request.userId && handleProcessDeletion(request.userId)}
              disabled={processingDeletion || !request.userId}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-1 inline" />
              {processingDeletion ? 'Processing...' : 'Complete Deletion'}
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
        <span className="ml-3 text-gray-300">Loading deletion requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Data Deletion Management</h3>
        </div>
        <p className="text-gray-300">
          Review and manage user data deletion requests. This is a critical operation that permanently removes user data.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['pending', 'approved', 'in_progress', 'completed', 'cancelled'].map((status) => {
          const count = deletionRequests.filter(r => r.status === status).length;
          return (
            <div key={status} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(status)}
                <span className="text-sm font-medium text-gray-300 capitalize">{status.replace('_', ' ')}</span>
              </div>
              <div className="text-2xl font-bold text-white">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h4 className="text-lg font-semibold text-white">Deletion Requests</h4>
          <p className="text-gray-300 text-sm">Total: {deletionRequests.length} requests</p>
        </div>
        
        {deletionRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No deletion requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {deletionRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                  <h5 className="font-medium text-white">
                    {request.fullName || request.userName}
                    {request.isPublicRequest && (
                      <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        Web Request
                      </span>
                    )}
                    {request.existingUser && (
                      <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        Existing User
                      </span>
                    )}
                  </h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                  </span>
                </div>
                                      <div className="text-sm text-gray-400 space-y-1">
                    <div>Email: {request.userEmail}</div>
                    <div>Requested: {formatDate(request.requestDate)}</div>
                    {request.source && <div>Source: {request.source.replace('_', ' ')}</div>}
                    {request.reviewDate && <div>Reviewed: {formatDate(request.reviewDate)}</div>}
                    {request.startDate && <div>Started: {formatDate(request.startDate)}</div>}
                    {request.completionDate && <div>Completed: {formatDate(request.completionDate)}</div>}
                  </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetails(true);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {getActionButtons(request)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notes Input */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">Admin Notes</h4>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about the deletion request..."
          className="w-full h-24 px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-400 mt-2">
          Notes will be saved when you update the status of a deletion request.
        </p>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Deletion Request Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">User Name</label>
                  <div className="text-white">{selectedRequest.userName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <div className="text-white">{selectedRequest.userEmail}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Request Date</label>
                  <div className="text-white">{formatDate(selectedRequest.requestDate)}</div>
                </div>
              </div>

              {selectedRequest.reviewDate && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Review Date</label>
                  <div className="text-white">{formatDate(selectedRequest.reviewDate)}</div>
                </div>
              )}

              {selectedRequest.startDate && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Processing Start Date</label>
                  <div className="text-white">{formatDate(selectedRequest.startDate)}</div>
                </div>
              )}

              {selectedRequest.completionDate && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Completion Date</label>
                  <div className="text-white">{formatDate(selectedRequest.completionDate)}</div>
                </div>
              )}

              {selectedRequest.estimatedCompletion && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Estimated Completion</label>
                  <div className="text-white">{formatDate(selectedRequest.estimatedCompletion)}</div>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Admin Notes</label>
                  <div className="text-white bg-white/10 p-3 rounded-lg">{selectedRequest.adminNotes}</div>
                </div>
              )}

              {selectedRequest.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-400">User Reason</label>
                  <div className="text-white bg-white/10 p-3 rounded-lg">{selectedRequest.reason}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {selectedRequest.status === 'in_progress' && (
                <button
                  onClick={() => selectedRequest.userId && handleProcessDeletion(selectedRequest.userId)}
                  disabled={processingDeletion || !selectedRequest.userId}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  {processingDeletion ? 'Processing...' : 'Complete Deletion'}
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
