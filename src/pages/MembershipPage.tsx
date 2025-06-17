import { useEffect, useState } from 'react';
import { useUserPlan } from '../contexts/UserPlanContext';
import SubscribeModal from '../components/SubscribeModal';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const MembershipPage = () => {
  const { currentPlan, subscriptionEnd } = useUserPlan();
  const [modalPlan, setModalPlan] = useState<null | { index: number; price: string }>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('usdt-bep20');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [txLink, setTxLink] = useState('');
  const [fromAddress, setFromAddress] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      const snapshot = await getDocs(collection(db, 'plans'));
      const fetchedPlans: Plan[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Plan[];
      setPlans(fetchedPlans);
    };
    fetchPlans();
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = subscriptionEnd ? subscriptionEnd < now : true;

  const handleProofUpload = async () => {
    if (!proofFile || !txLink || !fromAddress) {
      toast.error('❌ Please complete all required fields.');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error('❌ You must be logged in.');
      return;
    }

    try {
      setUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `manualPayments/${user.uid}/${Date.now()}-${proofFile.name}`);
      await uploadBytes(storageRef, proofFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'manualPayments'), {
        uid: user.uid,
        currency: selectedCurrency,
        proofUrl: downloadURL,
        fileName: proofFile.name,
        txLink,
        fromAddress,
        timestamp: serverTimestamp(),
        status: 'pending',
      });

      toast.success('✅ Your payment proof has been uploaded and is pending review.');
      setProofFile(null);
      setTxLink('');
      setFromAddress('');
    } catch (err) {
      console.error('❌ Upload failed:', err);
      toast.error('❌ Upload failed. Please check your internet or file and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto text-white px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Membership</h1>

      <p className="text-center mb-2">
        Current Plan: <span className="font-semibold capitalize">{currentPlan || 'Not subscribed'}</span>
      </p>

      {subscriptionEnd && (
        <p className="text-center mb-8 text-sm text-gray-300">
          {isExpired ? 'Expired on' : 'Expires on'}: {new Date(subscriptionEnd * 1000).toLocaleDateString()}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.filter(plan => plan.id !== 'economy').map((plan, index) => {
          const isActive = plan.id === currentPlan && !isExpired;

          let bonus = 0;
          let bgColor = 'bg-[#1B263B]';

          if (plan.id === 'business') {
            bonus = 100000;
            bgColor = 'bg-green-900';
          } else if (plan.id === 'first') {
            bonus = 500000;
            bgColor = 'bg-blue-900';
          } else if (plan.id === 'first-lifetime') {
            bonus = 1000000;
            bgColor = 'bg-purple-900';
          }

          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 shadow-md transition-all 
              ${isActive ? 'border-yellow-400 bg-yellow-100 text-black' : `${bgColor} text-white`}`}
            >
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <p className="mb-1 text-lg">{plan.price} BUSD</p>
              <p className="mb-1 text-sm font-semibold">
                🎁 Bonus: <span className="text-yellow-400 font-bold">{bonus.toLocaleString()} FSN</span>
              </p>
              <ul className="mb-6 text-sm space-y-1 text-left">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i}>✔️ {feature}</li>
                ))}
              </ul>
              {isActive ? (
                <button className="w-full bg-green-500 text-white font-bold py-2 rounded" disabled>Activated</button>
              ) : (
                <button
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded"
                  onClick={() => setModalPlan({ index, price: String(plan.price) })}
                >
                  {plan.id === currentPlan && isExpired ? 'Renew' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modalPlan && (
        <SubscribeModal planIndex={modalPlan.index} price={modalPlan.price} onClose={() => setModalPlan(null)} />
      )}

      {/* الدفع اليدوي */}
      <div className="mt-20 border-t border-gray-700 pt-10 px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">Manual Payment Option</h2>

        <div className="bg-yellow-100 text-black text-sm p-4 rounded mb-6 max-w-2xl w-full mx-auto">
          <p className="mb-2 font-semibold">📌 Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Send the exact amount to the wallet address shown below based on your selected currency.</li>
            <li>You <strong>must</strong> provide a valid <span className="text-blue-700">Transaction Link</span> and <span className="text-blue-700">Sender Wallet Address</span>.</li>
            <li>Upload a clear screenshot of the payment confirmation showing: amount, currency, receiver address, and time.</li>
            <li className="text-red-600">❌ Do not reuse an old transaction hash or send from an unknown wallet.</li>
            <li className="text-green-600">✅ Submissions will be verified within 24 hours.</li>
          </ul>
        </div>

        <div className="w-full max-w-md mx-auto mb-6 px-2">
          <label className="block text-sm font-medium text-white mb-2">Select Currency</label>
          <select
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            onChange={(e) => setSelectedCurrency(e.target.value)}
            value={selectedCurrency}
          >
            <option value="usdt-bep20">USDT (BEP-20)</option>
            <option value="busd">BUSD (BEP-20)</option>
            <option value="usdc">USDC (BEP-20)</option>
            <option value="bnb">BNB (BEP-20)</option>
            <option value="usdt-trc20">USDT (TRC-20)</option>
          </select>
        </div>

        <div className="text-center mb-6 px-2">
          <p className="text-sm text-gray-400 mb-1">Send to this wallet address:</p>
          <div className="bg-gray-800 text-yellow-300 px-4 py-2 rounded inline-block font-mono break-all">
            {selectedCurrency === 'usdt-trc20'
              ? 'TDwudwKdrHTQKsLoLABavJ9VQrX5nYVYM7'
              : '0x9E8550d26e6e2Ce3e5c4f8244B3E4504E24F2915'}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-4 px-2">
          <div>
            <label className="block text-sm text-white font-medium mb-1">Transaction Link</label>
            <input
              type="text"
              value={txLink}
              onChange={(e) => setTxLink(e.target.value)}
              placeholder="https://bscscan.com/tx/..."
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white font-medium mb-1">From Wallet Address</label>
            <input
              type="text"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white font-medium">Upload Proof of Payment</label>
            <input
              type="file"
              accept="image/*"
              className="bg-gray-800 text-white rounded p-2 w-full"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="text-center">
            <button
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded mt-4 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleProofUpload}
              disabled={uploading || !txLink || !fromAddress || !proofFile}
            >
              {uploading ? 'Uploading...' : 'Submit Proof'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
