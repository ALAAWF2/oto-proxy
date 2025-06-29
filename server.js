// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.tryoto.com";
const TOKEN_URL = `${BASE_URL}/oauth/token`;

const REFRESH_TOKEN = "AMf-vBx2INEZP3xe6EBSX5V3iElQnvpChRVMKgr_JRM5fYwhTghCOEeuRNlIq2prPFeGMCUxm4-LjrQVwEOWqEOqnDw1NxnjiB2BKlslDBN5S_7tE5J7Jw2bTI13LdOXEAtHx_UBDAYaNNu_Wd4t-wqJquUM6lfC9mHa-oQgfY76s2zOhBo1UiuxYkczg47OO5KsSdo_I-mR";
const CLIENT_ID = "hasan@orangebedbath.com";
const CLIENT_SECRET = "Hasan@2025";

let accessToken = null;
let accessTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && accessTokenExpiry > now) return accessToken;

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) throw new Error("Failed to refresh access token");

    const data = await response.json();
    accessToken = data.access_token;
    accessTokenExpiry = now + (data.expires_in - 60) * 1000; // refresh 1min before expiry
    console.log("✅ Access token updated");
    return accessToken;
  } catch (error) {
    console.error("❌ Error getting access token:", error.message);
    return null;
  }
}

app.use("/oto", async (req, res) => {
  const token = await getAccessToken();
  if (!token) return res.status(500).json({ error: "Token error" });

  const url = `${BASE_URL}${req.url}`;
  const method = req.method;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy Error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
