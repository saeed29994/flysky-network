import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface User {
  id: string;
  fullName: string;
  email: string;
  kycStatus: string;
  plan: string;
  balance: number;
  referralCode: string;
  watchedAdsToday: number;
  miningStartTime: string | null;
  lockedFromStaking: number;
  language: string;
  stakingStatus: string;
}

interface ManualPayment {
  id: string;
  uid: string;
  currency: string;
  proofUrl: string;
  fileName: string;
  txLink: string;
  fromAddress: string;
  timestamp: any;
  status: string;
}

const AdminDashboard = () => {
  const [tabs] = useState([
    { name: 'Dashboard' },
    { name: 'Users Management' },
    { name: 'KYC Verification' },
    { name: 'Manual Payments' },
  ]);

  const [users, setUsers] = useState<User[]>([]);
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState('');

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data: User[] = snapshot.docs.map((doc) => {
      const userData = doc.data();
      const plan = userData.membership?.planName || 'economy';
      const stakingHistory = userData.stakingHistory || [];

      let totalStaked = 0;
      let totalExpected = 0;
      let activeEntries = 0;

      stakingHistory.forEach((s: any) => {
        totalStaked += s.amount || 0;
        totalExpected += s.expectedReturn || 0;
        if (s.status === 'active') activeEntries++;
      });

      const stakingDescription =
        stakingHistory.length > 0
          ? `${stakingHistory.length} entries (${activeEntries} active) - Staked: ${totalStaked} FSN, Expected: ${totalExpected} FSN`
          : '0 FSN';

      return {
        id: doc.id,
        fullName: userData.fullName || '',
        email: userData.email || '',
        kycStatus: userData.kycStatus || 'Pending',
        plan: plan,
        balance: userData.balance || 0,
        referralCode: userData.referralCode || '',
        watchedAdsToday: userData.watchedAdsToday || 0,
        miningStartTime: userData.miningStartTime || '',
        lockedFromStaking: userData.lockedFromStaking || 0,
        language: userData.language || 'en',
        stakingStatus: stakingDescription,
      };
    });
    setUsers(data);
    setLoading(false);
  };

  const fetchManualPayments = async () => {
    const snapshot = await getDocs(collection(db, 'manualPayments'));
    const payments: ManualPayment[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as ManualPayment),
      id: doc.id,
    }));
    setManualPayments(payments);
  };

  useEffect(() => {
    fetchUsers();
    fetchManualPayments();
    const interval = setInterval(() => {
      fetchUsers();
      fetchManualPayments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteDoc(doc(db, 'users', userId));
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleUpdatePlan = async (userId: string) => {
    if (!newPlan) {
      alert('Please select a new plan!');
      return;
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'membership.plan': newPlan,
      'membership.planName': newPlan,
      plan: newPlan,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
    );
    setEditingUserId(null);
    setNewPlan('');
  };

  const handleKycVerification = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { kycStatus: 'Verified' });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, kycStatus: 'Verified' } : u))
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    : 'text-white hover:bg-gray-700 hover:text-yellow-300'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <div className="text-white">Dashboard content here...</div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow text-white">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">Users Management</h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded bg-gray-800 text-white p-2 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              {loading ? (
                <p className="text-gray-400">Loading users...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800 rounded text-sm">
                    <thead>
                      <tr className="bg-gray-700 text-gray-300">
                        <th className="py-2 px-3 text-left">Name</th>
                        <th className="py-2 px-3 text-left">Email</th>
                        <th className="py-2 px-3 text-left">Plan</th>
                        <th className="py-2 px-3 text-left">Balance</th>
                        <th className="py-2 px-3 text-left">Referral</th>
                        <th className="py-2 px-3 text-left">Ads Today</th>
                        <th className="py-2 px-3 text-left">Staking</th>
                        <th className="py-2 px-3 text-left">Language</th>
                        <th className="py-2 px-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t border-gray-700 text-white">
                          <td className="py-2 px-3">{user.fullName}</td>
                          <td className="py-2 px-3">{user.email}</td>
                          <td className="py-2 px-3">{user.plan}</td>
                          <td className="py-2 px-3">{user.balance}</td>
                          <td className="py-2 px-3">{user.referralCode}</td>
                          <td className="py-2 px-3">{user.watchedAdsToday}</td>
                          <td className="py-2 px-3">{user.stakingStatus}</td>
                          <td className="py-2 px-3">{user.language}</td>
                          <td className="py-2 px-3 space-x-2">
                            <button
                              onClick={() =>
                                editingUserId === user.id
                                  ? setEditingUserId(null)
                                  : setEditingUserId(user.id)
                              }
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            >
                              {editingUserId === user.id ? 'Cancel' : 'Edit Plan'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {editingUserId && (
                <div className="mt-4 bg-gray-800 p-4 rounded">
                  <h3 className="text-yellow-400 font-semibold mb-2">Update User Plan</h3>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full mb-2 rounded bg-gray-700 text-white p-2"
                  >
                    <option value="">Select Plan</option>
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first-6">First-6</option>
                    <option value="first-lifetime">First-Lifetime</option>
                  </select>
                  <button
                    onClick={() => handleUpdatePlan(editingUserId!)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Update Plan
                  </button>
                </div>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">KYC Verification</h2>
              {loading ? (
                <p className="text-gray-400">Loading users...</p>
              ) : (
                <table className="min-w-full bg-gray-800 rounded text-sm">
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
                      <tr key={user.id} className="border-t border-gray-700 text-white">
                        <td className="py-2 px-3">{user.fullName}</td>
                        <td className="py-2 px-3">{user.email}</td>
                        <td className="py-2 px-3">{user.kycStatus}</td>
                        <td className="py-2 px-3">
                          {user.kycStatus !== 'Verified' ? (
                            <button
                              onClick={() => handleKycVerification(user.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                            >
                              Verify KYC
                            </button>
                          ) : (
                            <span className="text-green-400 font-semibold">Verified</span>
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
            <div className="bg-gray-900 p-4 rounded shadow text-white">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">Manual Payments</h2>
              {manualPayments.length === 0 ? (
                <p className="text-gray-400">No manual payments found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800 rounded text-sm">
                    <thead>
                      <tr className="bg-gray-700 text-gray-300">
                        <th className="py-2 px-3 text-left">User ID</th>
                        <th className="py-2 px-3 text-left">Currency</th>
                        <th className="py-2 px-3 text-left">TX Link</th>
                        <th className="py-2 px-3 text-left">From Address</th>
                        <th className="py-2 px-3 text-left">Status</th>
                        <th className="py-2 px-3 text-left">Proof</th>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualPayments.map((p) => (
                        <tr key={p.id} className="border-t border-gray-700 text-white">
                          <td className="py-2 px-3">{p.uid}</td>
                          <td className="py-2 px-3">{p.currency}</td>
                          <td className="py-2 px-3 break-all max-w-[120px]">
                            <a href={p.txLink} target="_blank" className="text-blue-400 underline">View</a>
                          </td>
                          <td className="py-2 px-3 break-all max-w-[120px]">{p.fromAddress}</td>
                          <td className="py-2 px-3">{p.status}</td>
                          <td className="py-2 px-3">
                            <a href={p.proofUrl} target="_blank" className="text-green-400 underline">Image</a>
                          </td>
                          <td className="py-2 px-3">{p.timestamp?.toDate().toLocaleString()}</td>
                          <td className="py-2 px-3 space-x-1">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'manualPayments', p.id), { status: 'approved' });
                                fetchManualPayments();
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'manualPayments', p.id), { status: 'rejected' });
                                fetchManualPayments();
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminDashboard;
