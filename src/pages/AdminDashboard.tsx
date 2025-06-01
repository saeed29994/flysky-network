import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface User {
  id: string;
  fullName: string;
  email: string;
  kycStatus: string;
}

const AdminDashboard = () => {
  const [tabs] = useState([
    { name: 'Dashboard' },
    { name: 'Users Management' },
    { name: 'KYC Verification' },
    { name: 'Send Notification' },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleKycVerification = async (userId: string, email: string) => {
    try {
      // ✅ تحديث حالة KYC للمستخدم
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { kycStatus: 'Verified' });

      // ✅ تحديث referralList في وثائق المحيلين
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);

      usersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        const referralList = userData.referralList || [];

        const updatedList = referralList.map((ref: any) =>
          ref.email === email && ref.status === 'Pending'
            ? { ...ref, status: 'Verified' }
            : ref
        );

        if (JSON.stringify(updatedList) !== JSON.stringify(referralList)) {
          batch.update(doc(db, 'users', userDoc.id), {
            referralList: updatedList,
          });
        }
      });

      await batch.commit();
      console.log('✅ KYC verified and referral updated!');

      // ✅ تحديث الواجهة مباشرةً
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, kycStatus: 'Verified' } : u
        )
      );
    } catch (error) {
      console.error('❌ Error verifying KYC and updating referral:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8">Admin Dashboard</h1>

      <Tab.Group>
        <Tab.List className="flex space-x-2 rounded-xl bg-gray-800 p-2">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">Dashboard</h2>
              <p className="text-gray-400">Welcome to the admin dashboard!</p>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">Users Management</h2>
              <p className="text-gray-400">Coming soon...</p>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">KYC Verification</h2>

              {loading ? (
                <p className="text-gray-400">Loading users...</p>
              ) : (
                <table className="min-w-full bg-gray-800 rounded overflow-hidden text-sm">
                  <thead>
                    <tr className="bg-gray-700 text-gray-300">
                      <th className="py-2 px-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left">Email</th>
                      <th className="py-2 px-3 text-left">KYC Status</th>
                      <th className="py-2 px-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-gray-700">
                        <td className="py-2 px-3">{user.fullName}</td>
                        <td className="py-2 px-3">{user.email}</td>
                        <td className="py-2 px-3">{user.kycStatus}</td>
                        <td className="py-2 px-3">
                          {user.kycStatus !== 'Verified' && (
                            <button
                              onClick={() =>
                                handleKycVerification(user.id, user.email)
                              }
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                            >
                              Verify KYC
                            </button>
                          )}
                          {user.kycStatus === 'Verified' && (
                            <span className="text-green-400 font-semibold">
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">Send Notification</h2>
              <p className="text-gray-400">Coming soon...</p>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminDashboard;
