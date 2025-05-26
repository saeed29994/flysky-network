import { useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const SendNotificationTab = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const sendNotification = async () => {
    if (!title || !body) {
      alert('Please enter both title and body.');
      return;
    }
    setSending(true);
    try {
      // ✅ Fetch all tokens from Firestore
      const tokensSnapshot = await getDocs(collection(db, 'userTokens'));
      const tokens: string[] = [];
      tokensSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

console.log('Tokens ready to send:', tokens);

      if (tokens.length === 0) {
        alert('No tokens found. No users registered for notifications.');
        setSending(false);
        return;
      }

      // ✅ Send request to server
      const response = await fetch('https://flysky-server.onrender.com/sendNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          tokens,
        }),
      });

      if (response.ok) {
        alert('Notification sent successfully!');
      } else {
        const errorText = await response.text();
        alert('Failed to send notifications. Server says: ' + errorText);
      }

      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Send notification error:', error);
      alert('Error sending notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🔔 Send Notifications</h2>
      <div className="space-y-4 max-w-md">
        <input
          type="text"
          className="w-full p-2 rounded bg-gray-800 text-white"
          placeholder="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 rounded bg-gray-800 text-white"
          placeholder="Notification Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          onClick={sendNotification}
          disabled={sending}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded-lg shadow"
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  );
};

export default SendNotificationTab;
