// AdminDashboard.tsx

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { safeNumber } from '../utils/safeNumber';

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

const AdminDashboard = () => {
  const [tabs] = useState([
    { name: 'Dashboard' },
    { name: 'Users Management' },
    { name: 'KYC Verification' },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState('');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPlan, setNewUserPlan] = useState('economy');

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data: User[] = snapshot.docs.map((doc) => {
      const userData = doc.data();
      const plan = userData.membership?.plan || 'economy';
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
        balance: safeNumber(userData.balance || 0),
        referralCode: userData.referralCode || '',
        watchedAdsToday: safeNumber(userData.watchedAdsToday || 0),
        miningStartTime: userData.miningStartTime || '',
        lockedFromStaking: safeNumber(userData.lockedFromStaking || 0),
        language: userData.language || 'en',
        stakingStatus: stakingDescription,
      };
    });
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => fetchUsers(), 30000);
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

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) {
      alert('Please fill in all fields.');
      return;
    }

    const newUser = {
      fullName: newUserName,
      email: newUserEmail,
      kycStatus: 'Pending',
      membership: {
        plan: newUserPlan,
        planName: newUserPlan,
        miningEarnings: 0,
        miningStartTime: null,
      },
      balance: 0,
      dailyMined: 0,
      createdAt: new Date(),
      referralCode: '',
      watchedAdsToday: 0,
      lockedFromStaking: 0,
      language: 'en',
      theme: 'dark',
      stakingHistory: [],
    };

    await addDoc(collection(db, 'users'), newUser);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPlan('economy');
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const economyUsers = users.filter((u) => u.plan === 'economy').length;
  const businessUsers = users.filter((u) => u.plan === 'business').length;
  const first6Users = users.filter((u) => u.plan === 'first-6').length;
  const firstLifetimeUsers = users.filter((u) => u.plan === 'first-lifetime').length;
  const totalUsers = users.length;
  const kycVerified = users.filter((u) => u.kycStatus === 'Verified').length;
  const totalAdsWatched = users.reduce(
    (sum, u) => sum + (u.watchedAdsToday || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8">
        Admin Dashboard
      </h1>

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
            <div className="bg-gray-900 p-4 rounded shadow">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                Website Statistics
              </h2>
              <ul className="space-y-2">
                <li>Total Users: {totalUsers}</li>
                <li>KYC Verified Users: {kycVerified}</li>
                <li>Economy Plan Users: {economyUsers}</li>
                <li>Business Plan Users: {businessUsers}</li>
                <li>First-6 Plan Users: {first6Users}</li>
                <li>First-Lifetime Plan Users: {firstLifetimeUsers}</li>
                <li>Total Ads Watched Today: {totalAdsWatched}</li>
              </ul>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-900 p-4 rounded shadow text-white">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                Users Management
              </h2>
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-1/2 rounded bg-gray-800 text-white p-2 outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Add User
                </button>
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
                  <h3 className="text-yellow-400 font-semibold mb-2">
                    Update User Plan
                  </h3>
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
                    onClick={() => handleUpdatePlan(editingUserId)}
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
              <h2 className="text-xl font-bold text-yellow-400 mb-4">
                KYC Verification
              </h2>
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
        </Tab.Panels>
      </Tab.Group>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Add New User</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full mb-2 rounded bg-gray-700 text-white p-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full mb-2 rounded bg-gray-700 text-white p-2"
            />
            <select
              value={newUserPlan}
              onChange={(e) => setNewUserPlan(e.target.value)}
              className="w-full mb-4 rounded bg-gray-700 text-white p-2"
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first-6">First-6</option>
              <option value="first-lifetime">First-Lifetime</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
