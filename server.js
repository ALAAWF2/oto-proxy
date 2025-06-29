require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

let accessToken = null;
let lastRefresh = null;

async function refreshAccessToken() {
  try {
    const response = await axios.post("https://api.oto.com/oauth/token", {
      email: process.env.OTO_EMAIL,
      password: process.env.OTO_PASSWORD,
      refresh_token: process.env.OTO_REFRESH_TOKEN,
      grant_type: "refresh_token"
    });

    accessToken = response.data.access_token;
    lastRefresh = new Date();
    console.log("✅ Access token refreshed successfully at", lastRefresh.toISOString());
  } catch (error) {
    console.error("❌ Failed to refresh token:", error.response?.data || error.message);
  }
}

refreshAccessToken();
setInterval(refreshAccessToken, 1000 * 60 * 50);

app.use('/proxy', async (req, res) => {
  try {
    const targetUrl = "https://api.oto.com" + req.url;
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: req.body
    });
    res.json(response.data);
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn("⚠️ Token expired, retrying...");
      await refreshAccessToken();
      return res.status(401).json({ message: "Unauthorized, token refreshed. Please retry." });
    }
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({ message: "Proxy server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
