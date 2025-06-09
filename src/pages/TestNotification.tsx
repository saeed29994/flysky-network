import { useEffect, useState } from "react";
import { requestPermissionAndToken, listenToForegroundMessages } from "../utils/pushNotification";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { notifyRewardClaimed } from "../utils/notifications";

const TestNotification = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState("Checking user status...");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ User is signed in:", user.email);
        setUserStatus(`✅ Signed in as: ${user.email}`);
        initializeNotifications();
      } else {
        console.warn("⚠️ No user is signed in");
        setUserStatus("⚠️ No user is signed in");
      }
    });

    async function initializeNotifications() {
      const fcmToken = await requestPermissionAndToken();
      if (fcmToken) {
        setToken(fcmToken);
        listenToForegroundMessages();
      } else {
        setToken(null);
      }
    }
  }, []);

  const handleTestNotification = async () => {
    setSending(true);
    await notifyRewardClaimed();
    setSending(false);
    alert("✅ Notification sent (check your device)");
  };

  return (
    <div className="p-8 text-center text-white">
      <h1 className="text-2xl font-bold mb-4">🔔 FCM Test Page</h1>
      <p className="mb-2">👤 {userStatus}</p>
      <p className="mb-4">
        {token ? (
          <span>✅ Token acquired successfully.</span>
        ) : (
          <span>⏳ Waiting for permission/token...</span>
        )}
      </p>

      <button
        onClick={handleTestNotification}
        disabled={!token || sending}
        className={`px-6 py-2 rounded font-semibold ${
          token
            ? "bg-yellow-500 hover:bg-yellow-600"
            : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        {sending ? "Sending..." : "🚀 Test Reward Notification"}
      </button>
    </div>
  );
};

export default TestNotification;
