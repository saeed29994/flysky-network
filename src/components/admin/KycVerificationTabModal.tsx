import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  CheckCircle,
  XCircle,
  User,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface KycVerificationTabModalProps {
  showModal: boolean;
  selectedUser: any;
  showRejectionModal: boolean;
  userToReject: any;
  rejectionReason: string;
  approvingUsers: Set<string>;
  setShowModal: (show: boolean) => void;
  setShowRejectionModal: (show: boolean) => void;
  setRejectionReason: (reason: string) => void;
  handleKycAction: (user: any, action: 'approve' | 'reject') => void;
  handleKycRejection: () => void;
}

const KycVerificationTabModal: React.FC<KycVerificationTabModalProps> = ({
  showModal,
  selectedUser,
  showRejectionModal,
  userToReject,
  rejectionReason,
  approvingUsers,
  setShowModal,
  setShowRejectionModal,
  setRejectionReason,
  handleKycAction,
  handleKycRejection,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* User Details Modal */}
      {showModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.kyc.userDetails', 'User Details')}</h2>
                    <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.verificationInfo', 'Verification Information')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.fullName', 'Full Name')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">{selectedUser.fullName || t('admin.kyc.notProvided', 'Not provided')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.email', 'Email')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">{selectedUser.email || t('admin.kyc.notProvided', 'Not provided')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.userId', 'User ID')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white font-mono text-xs sm:text-sm break-all">{selectedUser.id}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.kyc.registrationDate', 'Registration Date')}</label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-white text-sm sm:text-base">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt.toDate()).toLocaleDateString() : t('admin.kyc.unknown', 'Unknown')}
                    </span>
                  </div>
                </div>
              </div>

              {/* KYC Documents Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('admin.kyc.documents', 'KYC Documents')}
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {selectedUser.kycDocuments ? (
                    Object.entries(selectedUser.kycDocuments).map(([docType, url]: [string, any]) => (
                      <div key={docType} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-white font-medium capitalize text-sm sm:text-base">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            <p className="text-gray-400 text-xs sm:text-sm">{t('admin.kyc.documentUploaded', 'Document uploaded')}</p>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg text-sm hover:from-blue-600 hover:to-cyan-600 transition-colors text-center"
                          >
                            {t('admin.kyc.viewDocument', 'View Document')}
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        <span className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.noDocuments', 'No documents uploaded')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason Display */}
              {selectedUser.kycRejectionReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t('admin.kyc.rejectionReason', 'Rejection Reason')}
                  </h4>
                  <p className="text-gray-300 text-sm">{selectedUser.kycRejectionReason}</p>
                  {selectedUser.kycRejectionDate && (
                    <p className="text-gray-400 text-xs mt-2">
                      {t('admin.kyc.rejectedOn', 'Rejected on')}: {new Date(selectedUser.kycRejectionDate.toDate()).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4 border-t border-white/10">
                {selectedUser.kycStatus === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleKycAction(selectedUser, 'approve')}
                      disabled={approvingUsers.has(selectedUser.id)}
                      className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approvingUsers.has(selectedUser.id) ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      {approvingUsers.has(selectedUser.id) ? t('admin.kyc.approving', 'Approving...') : t('admin.kyc.approve', 'Approve')}
                    </button>

                    <button
                      onClick={() => setShowRejectionModal(true)}
                      className="w-full sm:flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t('admin.kyc.reject', 'Reject')}
                    </button>
                  </>
                )}

                {selectedUser.kycStatus !== 'Pending' && (
                  <div className="w-full text-center text-gray-400 text-sm">
                    {selectedUser.kycStatus === 'Verified' || selectedUser.kycStatus === 'Approved'
                      ? t('admin.kyc.alreadyApproved', 'This KYC has already been approved')
                      : t('admin.kyc.alreadyRejected', 'This KYC has already been rejected')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && userToReject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRejectionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.kyc.rejectReason', 'Rejection Reason')}</h2>
                    <p className="text-gray-400 text-sm sm:text-base">{t('admin.kyc.provideReason', 'Please provide a reason for rejecting this KYC application.')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <textarea
                className="w-full bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder={t('admin.kyc.rejectionReasonPlaceholder', 'Enter rejection reason...')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('admin.kyc.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleKycRejection}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('admin.kyc.reject', 'Reject')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default KycVerificationTabModal;