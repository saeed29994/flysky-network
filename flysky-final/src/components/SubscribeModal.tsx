import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnector from './WalletConnector';
import contractAbi from '../contracts/FlySkySafeSubscription.json';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CONTRACT_ADDRESS = '0xbb23b4ed3d8521795ecfa4b75142448f4069bbe3';
const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

interface Props {
  planIndex: number;
  price: string;
  onClose: () => void;
}

const planLabels: Record<number, string> = {
  0: 'Business Class',
  1: 'First Class (6 Months)',
  2: 'First Class (Lifetime)',
};

// ✅ تعريف البونصات حسب الباقة
const planBonuses: Record<number, number> = {
  0: 100000,
  1: 500000,
  2: 1000000,
};

const SubscribeModal: React.FC<Props> = ({ planIndex, price, onClose }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleApprove = async () => {
    try {
      if (!window.ethereum) return alert("Wallet not detected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(BUSD_ADDRESS, [
        'function approve(address spender, uint256 amount) public returns (bool)',
      ], signer);

      const amount = ethers.parseUnits(price, 18);
      setLoading(true);
      const tx = await token.approve(CONTRACT_ADDRESS, amount);
      setStatus('Approving...');
      await tx.wait();
      setStatus('Approved successfully!');
    } catch (err) {
      console.error(err);
      setStatus('Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (!window.ethereum) return alert("Wallet not detected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      setLoading(true);
      const tx = await contract.subscribe(planIndex + 1); // ✅ تفاعل مع العقد
      setStatus('Subscribing...');
      await tx.wait();
      setStatus('Subscription successful!');

      // ✅ عرض نافذة التأكيد
      setShowConfirmation(true);

      // ✅ إضافة البونص لرصيد المستخدم في Firestore
      setTimeout(async () => {
        const user = auth.currentUser;
        if (user && walletAddress) {
          const userRef = doc(db, 'users', user.uid);

          // احسب مدة الاشتراك بالثواني
          const subscriptionDuration =
            planIndex === 2
              ? 100 * 365 * 24 * 60 * 60
              : planIndex === 1
              ? 6 * 30 * 24 * 60 * 60
              : 30 * 24 * 60 * 60;

          // احصل على البونص الصحيح حسب الخطة
          const bonusAmount = planBonuses[planIndex];

          // ✅ حدّث بيانات المستخدم وأضف البونص
          await updateDoc(userRef, {
            'membership.walletAddress': walletAddress,
            'membership.planName':
              planIndex === 2
                ? 'first-lifetime'
                : planIndex === 1
                ? 'first-6'
                : 'business',
            'membership.subscriptionEnd': Math.floor(Date.now() / 1000) + subscriptionDuration,
            balance: increment(bonusAmount),
          });

          // ✅ أضف رسالة البونص إلى صندوق البريد
          const inboxRef = collection(db, 'users', user.uid, 'inbox');
          await addDoc(inboxRef, {
            title: '🎉 Subscription Bonus!',
            body: `You have received a bonus of ${bonusAmount} FSN for subscribing to the ${planLabels[planIndex]}.`,
            amount: bonusAmount,
            claimed: false,
            read: false,
            timestamp: Date.now(),
            type: 'subscription_bonus',
          });

          // ✅ أظهر إشعار النجاح
          toast.success(`🎉 You received a bonus of ${bonusAmount} FSN!`);
        }

        setShowConfirmation(false);
        onClose();
      }, 3000); // عرض نافذة التأكيد لمدة 3 ثوانٍ
    } catch (err) {
      console.error(err);
      setStatus('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      {showConfirmation ? (
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">✅ Payment Completed</h2>
          <p className="text-gray-700">Your subscription has been processed successfully.</p>
        </div>
      ) : (
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-md relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">✕</button>

          <h2 className="text-xl font-bold mb-4">Subscribe to Plan</h2>

          <WalletConnector onAccountChange={(addr) => setWalletAddress(addr)} />

          {walletAddress && (
            <>
              <p className="text-sm text-gray-600 mt-4 mb-2">
                Selected Plan: <strong>{planLabels[planIndex] || 'Unknown'}</strong><br />
                Price: <strong>{price} BUSD</strong><br />
                🎁 Bonus: <strong>{planBonuses[planIndex]} FSN</strong>
              </p>

              <button
                onClick={handleApprove}
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded mt-2"
              >
                {loading ? 'Processing...' : 'Approve BUSD'}
              </button>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-3"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </>
          )}

          {status && <p className="mt-4 text-center text-sm">{status}</p>}
        </div>
      )}
    </div>
  );
};

export default SubscribeModal;
