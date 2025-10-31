import React, { useState, useEffect } from 'react';
import { FaUsers, FaTrash } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Referral {
  email: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  claimed?: boolean;
}

interface ReferralHistoryButtonProps {
  userId: string;
  userName: string;
  onReferralUpdate: () => void;
}

const ReferralHistoryButton: React.FC<ReferralHistoryButtonProps> = ({
  userId,
  userName,
  onReferralUpdate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      loadReferralHistory();
    }
  }, [isModalOpen]);

  const loadReferralHistory = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setReferrals(userData.referralList || []);
      }
    } catch (error) {
      console.error('Error loading referral history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReferral = async (referralEmail: string) => {
    if (!confirm('Are you sure you want to delete this referral?')) {
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedReferrals = (userData.referralList || []).filter(
          (ref: Referral) => ref.email !== referralEmail
        );

        await updateDoc(userRef, {
          referralList: updatedReferrals
        });

        setReferrals(updatedReferrals);
        onReferralUpdate();
      }
    } catch (error) {
      console.error('Error deleting referral:', error);
      alert('Failed to delete referral');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'text-green-400';
      case 'Pending': return 'text-yellow-400';
      case 'Rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return '✅';
      case 'Pending': return '⏳';
      case 'Rejected': return '❌';
      default: return '❓';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
      >
        <FaUsers className="w-3 h-3" />
        Referrals
      </button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-2xl w-[95vw] sm:w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white">
              <FaUsers className="w-5 h-5 text-blue-400" />
              Referral History - {userName}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              View and manage the referral history for this user. You can see the status of each referral and delete them if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading referral history...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <FaUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No referrals found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">{referral.email}</span>
                          <span className={`text-sm font-medium ${getStatusColor(referral.status)}`}>
                            {getStatusIcon(referral.status)} {referral.status}
                          </span>
                          {referral.claimed && (
                            <span className="text-green-400 text-sm font-medium">
                              🎁 Claimed
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReferral(referral.email)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <FaTrash className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralHistoryButton;