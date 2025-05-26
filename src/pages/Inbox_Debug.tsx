
// 📁 src/pages/Inbox_Debug.tsx

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';

const Inbox_Debug = () => {
  const auth = getAuth();
  const db = getFirestore();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("❌ User not authenticated.");
        setCheckingUser(false);
        return;
      }

console.log("🔐 Current user UID:", user.uid);

      try {
        const inboxRef = collection(db, `users/${user.uid}/inbox`);
        const snapshot = await getDocs(inboxRef);
        const inboxMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📥 Messages fetched from Firestore:", inboxMessages);
        setMessages(inboxMessages);
      } catch (error) {
        console.error("❌ Error fetching inbox:", error);
      }

      setLoading(false);
      setCheckingUser(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingUser) {
    return <div className="text-white p-6">🔄 Checking authentication...</div>;
  }

  if (loading) return <div className="text-white p-6">📬 Loading inbox...</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-yellow-400">📬 Inbox Debug View</h1>
      {messages.length === 0 ? (
        <p className="text-gray-400">⚠️ No messages found.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={msg.id} className="bg-gray-800 p-4 rounded border border-gray-700">
              <h2 className="text-lg font-semibold text-yellow-300">{msg.title}</h2>
              <p className="text-gray-300">{msg.body}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(
                  typeof msg.timestamp === 'number'
                    ? msg.timestamp
                    : msg.timestamp?.toDate?.() || Date.now()
                ).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Inbox_Debug;
