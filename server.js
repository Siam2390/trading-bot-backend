const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// 🔐 TESTNET URL (SAFE)
const BASE_URL = "https://testnet.binance.vision";

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

// 🔐 SIGN FUNCTION
function sign(query) {
    return crypto
        .createHmac("sha256", API_SECRET)
        .update(query)
        .digest("hex");
}

// 🟢 CHECK SERVER
app.get("/", (req, res) => {
    res.send("Testnet Trading Working ✅");
});

// 💰 BUY (SAFE)
app.get("/buy", async (req, res) => {
    try {
        const timestamp = Date.now();

        const query = `symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001&timestamp=${timestamp}`;
        const signature = sign(query);

        const url = `${BASE_URL}/api/v3/order?${query}&signature=${signature}`;

        const response = await axios.post(url, {}, {
            headers: { "X-MBX-APIKEY": API_KEY }
        });

        res.json(response.data);

    } catch (err) {
        res.status(500).json({ error: "Buy failed" });
    }
});

// 💰 SELL (SAFE)
app.get("/sell", async (req, res) => {
    try {
        const timestamp = Date.now();

        const query = `symbol=BTCUSDT&side=SELL&type=MARKET&quantity=0.001&timestamp=${timestamp}`;
        const signature = sign(query);

        const url = `${BASE_URL}/api/v3/order?${query}&signature=${signature}`;

        const response = await axios.post(url, {}, {
            headers: { "X-MBX-APIKEY": API_KEY }
        });

        res.json(response.data);

    } catch (err) {
        res.status(500).json({ error: "Sell failed" });
    }
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running");
});
