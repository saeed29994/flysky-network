// 📁 src/pages/TestNotification.tsx

import { useEffect, useState } from "react";
import { requestPermissionAndToken, listenToForegroundMessages } from "../utils/pushNotification";

const TestNotification = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      const fcmToken = await requestPermissionAndToken();
      if (fcmToken) setToken(fcmToken);
    };

    setupNotifications();
    listenToForegroundMessages();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔔 FCM Test Page</h2>
      {token ? (
        <>
          <p>✅ Token Generated:</p>
          <textarea value={token} readOnly style={{ width: "100%", height: 100 }} />
        </>
      ) : (
        <p>🔄 Waiting for permission/token...</p>
      )}
    </div>
  );
};

export default TestNotification;
