import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnector from './WalletConnector';
import contractAbi from '../contracts/FlySkySafeSubscription.json';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const CONTRACT_ADDRESS = '0xbb23b4ed3d8521795ecfa4b75142448f4069bbe3';
const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

interface Props {
  planIndex: number; // 0 = business, 1 = first-6, 2 = first-lifetime
  price: string;     // السعر كـ نص مثل "10", "49", "99"
  onClose: () => void;
}

const planLabels: Record<number, string> = {
  0: 'Business Class',
  1: 'First Class (6 Months)',
  2: 'First Class (Lifetime)',
};

const SubscribeModal: React.FC<Props> = ({ planIndex, price, onClose }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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
      const tx = await contract.subscribe(planIndex);
      setStatus('Subscribing...');
      await tx.wait();
      setStatus('Subscription successful!');

      // ✅ تحديث Firestore بعد الاشتراك
      const user = auth.currentUser;
      if (user && walletAddress) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'membership.walletAddress': walletAddress,
          'membership.planName':
            planIndex === 2
              ? 'first-lifetime'
              : planIndex === 1
              ? 'first-6'
              : 'business',
          'membership.subscriptionEnd':
            Math.floor(Date.now() / 1000) +
            (planIndex === 2
              ? 100 * 365 * 24 * 60 * 60 // 100 سنة = lifetime
              : planIndex === 1
              ? 6 * 30 * 24 * 60 * 60     // 6 أشهر
              : 30 * 24 * 60 * 60),       // شهر واحد
        });
      }

      setTimeout(() => {
        onClose(); // إغلاق النافذة بعد الاشتراك
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">✕</button>

        <h2 className="text-xl font-bold mb-4">Subscribe to Plan</h2>

        <WalletConnector onAccountChange={(addr) => setWalletAddress(addr)} />

        {walletAddress && (
          <>
            <p className="text-sm text-gray-600 mt-4 mb-2">
              Selected Plan: <strong>{planLabels[planIndex] || 'Unknown'}</strong><br />
              Price: <strong>{price} BUSD</strong>
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
    </div>
  );
};

export default SubscribeModal;
