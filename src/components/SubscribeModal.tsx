import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import WalletConnector from './WalletConnector';
import contractAbi from '../contracts/FlySkySafeSubscription.json';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CONTRACT_ADDRESS = '0xbb23b4ed3d8521795ecfa4b75142448f4069bbe3';
const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

interface Props {
  planId: string;
  price: string;
  onClose: () => void;
}

const SubscribeModal: React.FC<Props> = ({ planId, price, onClose }) => {
  const { t } = useTranslation();
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const planDoc = await getDoc(doc(db, 'plans', planId));
      if (planDoc.exists()) {
        setPlan(planDoc.data());
      }
    };
    fetchPlan();
  }, [planId]);

  const handleApprove = async () => {
    try {
      if (!window.ethereum) return alert(t('walletNotDetected'));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(BUSD_ADDRESS, [
        'function approve(address spender, uint256 amount) public returns (bool)',
      ], signer);

      const amount = ethers.parseUnits(price, 18);
      setLoading(true);
      const tx = await token.approve(CONTRACT_ADDRESS, amount);
      setStatus(t('approving'));
      await tx.wait();
      setStatus(t('approvedSuccessfully'));
    } catch (err) {
      console.error(err);
      setStatus(t('approvalFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (!window.ethereum) return alert(t('walletNotDetected'));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      setLoading(true);
      const tx = await contract.subscribe(plan.index);
      setStatus(t('subscribing'));
      await tx.wait();
      setStatus(t('subscriptionSuccess'));

      setShowConfirmation(true);

      setTimeout(async () => {
        const user = auth.currentUser;
        if (user && walletAddress) {
          const userRef = doc(db, 'users', user.uid);
          const subscriptionDuration = plan.duration;
          const bonusAmount = plan.bonus;

          await updateDoc(userRef, {
            'membership.walletAddress': walletAddress,
            'membership.planName': plan.name,
            'membership.subscriptionEnd': Math.floor(Date.now() / 1000) + subscriptionDuration,
            balance: increment(bonusAmount),
          });

          const inboxRef = collection(db, 'users', user.uid, 'inbox');
          await addDoc(inboxRef, {
            title: t('subscriptionBonusTitle'),
            body: t('subscriptionBonusBody', {
              amount: bonusAmount,
              plan: t(`plan.${planId}`),
            }),
            amount: bonusAmount,
            claimed: false,
            read: false,
            timestamp: Date.now(),
            type: 'subscription_bonus',
          });

          toast.success(t('subscriptionBonusToast', { amount: bonusAmount }));
        }

        setShowConfirmation(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus(t('subscriptionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      {showConfirmation ? (
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">✅ {t('paymentCompleted')}</h2>
          <p className="text-gray-700">{t('subscriptionProcessed')}</p>
        </div>
      ) : (
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-md relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">✕</button>

          <h2 className="text-xl font-bold mb-4">{t('subscribeToPlan')}</h2>

          <WalletConnector onAccountChange={(addr) => setWalletAddress(addr)} />

          {walletAddress && plan && (
            <>
              <p className="text-sm text-gray-600 mt-4 mb-2">
                {t('selectedPlan')}: <strong>{t(`plan.${planId}`)}</strong><br />
                {t('price')}: <strong>{price} BUSD</strong><br />
                🎁 {t('bonus')}: <strong>{plan.bonus} FSN</strong>
              </p>

              <ul className="mb-4 text-sm space-y-1 text-left">
                {plan.features.map((key: string, idx: number) => (
                  <li key={idx}>✔️ {t(`feature.${key}`)}</li>
                ))}
              </ul>

              <button
                onClick={handleApprove}
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded mt-2"
              >
                {loading ? t('processing') : t('approveBUSD')}
              </button>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-3"
              >
                {loading ? t('subscribing') : t('subscribe')}
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
