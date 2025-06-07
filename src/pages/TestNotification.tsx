// 📁 src/pages/test-notification.tsx

import { useEffect, useState } from "react";
import { requestPermissionAndToken, listenToForegroundMessages } from "../utils/pushNotification";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const TestNotification = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState("Checking user status...");

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

  return (
    <div className="p-8 text-center text-white">
      <h1 className="text-2xl font-bold mb-4">🔔 FCM Test Page</h1>
      <p className="mb-2">👤 {userStatus}</p>
      <p className="mb-2">
        {token ? (
          <span>✅ Token acquired successfully.</span>
        ) : (
          <span>⏳ Waiting for permission/token...</span>
        )}
      </p>
    </div>
  );
};

export default TestNotification;
