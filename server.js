id="binance1"
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;
const BASE_URL = "https://api.binance.com";

// 🔐 SIGN FUNCTION
function sign(query) {
    return crypto
        .createHmac("sha256", API_SECRET)
        .update(query)
        .digest("hex");
}

// 💰 BALANCE
app.get("/balance", async (req, res) => {
    try {
        const timestamp = Date.now();
        const query = `timestamp=${timestamp}`;
        const signature = sign(query);

        const response = await axios.get(
            `${BASE_URL}/api/v3/account?${query}&signature=${signature}`,
            {
                headers: { "X-MBX-APIKEY": API_KEY },
            }
        );

        const usdt = response.data.balances.find(b => b.asset === "USDT");

        res.json({ free: parseFloat(usdt.free) });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚀 TRADE (BUY / SELL)
app.post("/trade", async (req, res) => {
    try {
        const { symbol, side, quantity } = req.body;

        const timestamp = Date.now();

        const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
        const signature = sign(query);

        const response = await axios.post(
            `${BASE_URL}/api/v3/order?${query}&signature=${signature}`,
            {},
            {
                headers: { "X-MBX-APIKEY": API_KEY },
            }
        );

        res.json({ status: "SUCCESS", data: response.data });

    } catch (err) {
        res.status(500).json({ status: "FAILED", error: err.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 Binance Trading Backend Running");
});
