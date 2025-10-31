import React, { useState } from 'react';
import { FaCoins, FaPlus, FaMinus } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { db, auth } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface BalanceButtonProps {
  userId: string;
  currentBalance: number;
  onBalanceUpdate: (userId: string, newBalance: number) => void;
}

const BalanceButton: React.FC<BalanceButtonProps> = ({ userId, currentBalance, onBalanceUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const logAction = async (logData: any) => {
    try {
      // console.log('Logging balance adjustment:', logData);
      await addDoc(collection(db, 'balanceReferralLogs'), {
        ...logData,
        timestamp: Date.now(),
        date: new Date().toISOString()
      });
      // console.log('Balance adjustment log added with ID:', docRef.id);
    } catch (error) {
      console.error('Error logging balance adjustment:', error);
    }
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the balance adjustment');
      return;
    }

    setIsLoading(true);

    try {
      const oldBalance = currentBalance;
      let newBalance = currentBalance;
      if (adjustmentType === 'add') {
        newBalance = currentBalance + numAmount;
      } else {
        newBalance = Math.max(0, currentBalance - numAmount);
      }

      // Update balance first
      onBalanceUpdate(userId, newBalance);

      // Log the action
      await logAction({
        type: 'balance_adjustment',
        userId: userId,
        userName: '', // Will be filled by parent component
        userEmail: '', // Will be filled by parent component
        action: adjustmentType === 'add' ? 'add_balance' : 'subtract_balance',
        oldValue: oldBalance,
        newValue: newBalance,
        amount: numAmount,
        reason: reason.trim(),
        adminId: auth.currentUser?.uid || 'unknown',
        adminEmail: auth.currentUser?.email || 'unknown'
      });

      toast.success('Balance adjusted successfully!');
      setIsModalOpen(false);
      setAmount('');
      setReason('');
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Failed to adjust balance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
      >
        <FaCoins className="w-3 h-3" />
        {currentBalance.toLocaleString()} FSN
      </button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-white">
              <FaCoins className="w-5 h-5 text-yellow-400" />
              Adjust User Balance
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Add or subtract FSN tokens from the user's balance. This action will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Current Balance</p>
              <p className="text-yellow-400 font-bold text-lg">{currentBalance.toLocaleString()} FSN</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white block">Adjustment Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustmentType('add')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                    adjustmentType === 'add'
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  <FaPlus className="w-4 h-4" />
                  Add
                </button>
                <button
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                    adjustmentType === 'subtract'
                      ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  <FaMinus className="w-4 h-4" />
                  Subtract
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white block mb-2">Amount (FSN)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white block mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for adjustment"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm">New Balance</p>
              <p className={`font-bold text-lg ${
                adjustmentType === 'add' ? 'text-green-400' : 'text-red-400'
              }`}>
                {(() => {
                  const numAmount = parseFloat(amount) || 0;
                  const newBalance = adjustmentType === 'add'
                    ? currentBalance + numAmount
                    : Math.max(0, currentBalance - numAmount);
                  return newBalance.toLocaleString();
                })()} FSN
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!amount || !reason.trim() || isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaCoins className="w-4 h-4" />
                  Confirm Adjustment
                </>
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BalanceButton;