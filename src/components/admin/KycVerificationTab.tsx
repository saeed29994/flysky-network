import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const KycVerificationTab = () => {
  const [kycRequests, setKycRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchKycRequests = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const pendingList: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.kycStatus === 'pending') {
          pendingList.push({ id: docSnap.id, ...data });
        }
      });
      setKycRequests(pendingList);
    };

    fetchKycRequests();
  }, []);

  const handleKycAction = async (userId: string, action: 'approve' | 'reject') => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { kycStatus: action === 'approve' ? 'approved' : 'rejected' });
    setKycRequests((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">✅ KYC Verification Requests</h2>
      {kycRequests.length === 0 ? (
        <p className="text-gray-400">No pending KYC requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800 text-yellow-400">
              <tr>
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kycRequests.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="px-4 py-2">{user.fullName}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleKycAction(user.id, 'approve')}
                      className="bg-green-500 hover:bg-green-400 text-black px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleKycAction(user.id, 'reject')}
                      className="bg-red-500 hover:bg-red-400 text-black px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KycVerificationTab;
