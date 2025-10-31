const axios = require("axios");

axios.post("http://localhost:8080/sendPushNotification", {
  userId: "WSGoELnMraMIExkoy1mIhHDXjkq2",
  title: "مكافأة جاهزة",
  body: "قم بتحصيل مكافأتك الآن"
})
.then(res => {
  console.log("✅ Success:", res.data);
})
.catch(err => {
  console.error("❌ Error Message:", err.message);
  if (err.response) {
    console.error("❌ Error Response Data:", err.response.data);
    console.error("❌ Error Status:", err.response.status);
    console.error("❌ Error Headers:", err.response.headers);
  } else if (err.request) {
    console.error("❌ No response received:", err.request);
  } else {
    console.error("❌ Error Config:", err.config);
  }
});
