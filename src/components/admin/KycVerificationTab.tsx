import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Clock, 
  AlertCircle,
  Eye,
  Users,
  BadgeCheck
} from 'lucide-react';

const KycVerificationTab = () => {
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchKycRequests = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'users'));
        const pendingList: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.kycStatus === 'pending' || data.kycStatus === 'Pending') {
            pendingList.push({ id: docSnap.id, ...data });
          }
        });
        setKycRequests(pendingList);
      } catch (error) {
        console.error('Error fetching KYC requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKycRequests();
  }, []);

  const handleKycAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { kycStatus: action === 'approve' ? 'Verified' : 'Not activated' });
      setKycRequests((prev) => prev.filter((user) => user.id !== userId));
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating KYC status:', error);
    }
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/5 to-yellow-500/5"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative px-4 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Shield className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight"
              >
                🛡️ KYC Verification
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
              >
                Review and manage user identity verification requests
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{kycRequests.length}</h3>
                  <p className="text-gray-400">Pending Requests</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">0</h3>
                  <p className="text-gray-400">Approved Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">0</h3>
                  <p className="text-gray-400">Rejected Today</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KYC Requests */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Pending KYC Requests</h2>
                  <p className="text-gray-400">Review user verification documents</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading KYC requests...</p>
                </div>
              ) : kycRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BadgeCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Pending Requests</h3>
                  <p className="text-gray-400">All KYC verification requests have been processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kycRequests.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{user.fullName || 'Unknown User'}</h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Mail className="w-4 h-4" />
                              {user.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openUserDetails(user)}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleKycAction(user.id, 'approve')}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => handleKycAction(user.id, 'reject')}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

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
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">User Details</h2>
                      <p className="text-gray-400">KYC verification information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white">{selectedUser.fullName || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white">{selectedUser.email || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white font-mono text-sm">{selectedUser.id}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Registration Date</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KYC Documents Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    KYC Documents
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedUser.kycDocuments ? (
                      Object.entries(selectedUser.kycDocuments).map(([docType, url]: [string, any]) => (
                        <div key={docType} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                              <p className="text-gray-400 text-sm">Document uploaded</p>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg text-sm hover:from-blue-600 hover:to-cyan-600 transition-colors"
                            >
                              View Document
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                          <span className="text-gray-400">No KYC documents uploaded</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleKycAction(selectedUser.id, 'approve')}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve KYC
                  </button>
                  
                  <button
                    onClick={() => handleKycAction(selectedUser.id, 'reject')}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject KYC
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default KycVerificationTab;
