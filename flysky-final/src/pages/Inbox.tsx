// src/pages/Inbox.tsx
import { useEffect, useState } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import DashboardLayout from './DashboardLayout';

// 🟡 تعريف نوع الرسالة
interface InboxMessage {
  id: string;
  title: string;
  body: string;
  timestamp: Timestamp | number;
  amount?: number;
  type?: string;
  read?: boolean;
  claimed?: boolean;
  archived?: boolean;
  deleted?: boolean;
}

const Inbox = () => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived' | 'trash'>('inbox');

  const db = getFirestore();
  const auth = getAuth();

  const fetchMessages = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const balanceRaw = userSnap.data()?.balance || 0;
    setBalance(balanceRaw);

    const inboxRef = collection(db, `users/${user.uid}/inbox`);
    const inboxSnap = await getDocs(inboxRef);
    const allMessages: InboxMessage[] = inboxSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InboxMessage[];

    const filtered = allMessages.filter((msg) => {
      if (activeTab === 'inbox') return !msg.archived && !msg.deleted;
      if (activeTab === 'archived') return msg.archived && !msg.deleted;
      if (activeTab === 'trash') return msg.deleted;
      return false;
    });

    setMessages(filtered);
  };

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const handleOpenMessage = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!msg.read) {
      const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
      await updateDoc(msgRef, { read: true });
    }

    setSelectedMessage({ ...msg, read: true });
  };

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user || !selectedMessage || selectedMessage.claimed) return;

    const userRef = doc(db, 'users', user.uid);
    const msgRef = doc(db, `users/${user.uid}/inbox`, selectedMessage.id);
    const newBalance = balance + (selectedMessage.amount || 0);

    await updateDoc(userRef, { balance: newBalance });
    await updateDoc(msgRef, { claimed: true });

    setBalance(newBalance);
    setSelectedMessage({ ...selectedMessage, claimed: true });
  };

  const handleArchive = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;
    const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
    await updateDoc(msgRef, { archived: true });
    fetchMessages();
  };

  const handleDelete = async (msg: InboxMessage) => {
    const user = auth.currentUser;
    if (!user) return;
    const msgRef = doc(db, `users/${user.uid}/inbox`, msg.id);
    await updateDoc(msgRef, { deleted: true });
    fetchMessages();
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full max-w-3xl mx-auto text-white">
        <h1 className="text-2xl font-bold mb-4 text-yellow-400">📬 Inbox Center</h1>

        <div className="flex space-x-4 mb-6">
          <button onClick={() => setActiveTab('inbox')} className={`px-4 py-2 rounded ${activeTab === 'inbox' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'}`}>📥 Inbox</button>
          <button onClick={() => setActiveTab('archived')} className={`px-4 py-2 rounded ${activeTab === 'archived' ? 'bg-yellow-500 text-black' : 'bg-gray-300 text-black'}`}>📂 Archived</button>
          <button onClick={() => setActiveTab('trash')} className={`px-4 py-2 rounded ${activeTab === 'trash' ? 'bg-yellow-500 text-black' : 'bg-gray-300 text-black'}`}>🗑️ Trash</button>
        </div>

        {messages.length === 0 ? (
          <p className="text-gray-400">No messages found.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-gray-900 p-4 rounded-lg shadow border border-gray-700 cursor-pointer hover:ring-2 ${!msg.read ? 'ring-yellow-400' : ''}`}
                onClick={() => handleOpenMessage(msg)}
              >
                <h2 className="text-lg font-semibold text-yellow-300">{msg.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(
                    (msg.timestamp as Timestamp)?.seconds
                      ? (msg.timestamp as Timestamp).seconds * 1000
                      : (msg.timestamp as number)
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">{selectedMessage.title}</h2>
              <p className="text-white mb-4">{selectedMessage.body}</p>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(
                  (selectedMessage.timestamp as Timestamp)?.seconds
                    ? (selectedMessage.timestamp as Timestamp).seconds * 1000
                    : (selectedMessage.timestamp as number)
                ).toLocaleString()}
              </p>
              {!selectedMessage.claimed && selectedMessage.type === 'welcome_bonus' && (
                <button
                  onClick={handleClaim}
                  className="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded font-semibold mb-4"
                >
                  🎁 Claim Bonus
                </button>
              )}
              <div className="flex justify-between">
                {!selectedMessage.archived && !selectedMessage.deleted && (
                  <>
                    <button onClick={() => handleArchive(selectedMessage)} className="text-blue-400 hover:text-blue-300">📥 Archive</button>
                    <button onClick={() => handleDelete(selectedMessage)} className="text-red-400 hover:text-red-300">🗑️ Delete</button>
                  </>
                )}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black py-1 px-4 rounded font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inbox;
