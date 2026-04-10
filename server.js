const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// =====================
// CONFIG
// =====================
const BASE_URL = "https://api.binance.com";
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

// =====================
// ROOT
// =====================
app.get("/", (req, res) => {
    res.send("Backend working ✅");
});

// =====================
// 📊 SIGNAL
// =====================
app.get("/signal", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/api/v3/ticker/price?symbol=BTCUSDT`
        );

        const price = parseFloat(response.data.price);

        let signal = "HOLD";
        if (price % 2 === 0) signal = "BUY";
        else signal = "SELL";

        res.json({
            signal: signal,
            price: price,
            rsi: "50"
        });

    } catch (e) {
        res.status(500).json({ error: "Signal error" });
    }
});

// =====================
// 📈 CANDLES (CHART FIX)
// =====================
app.get("/candles", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50`
        );

        const candles = response.data.map(c => ({
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4])
        }));

        res.json(candles);

    } catch (e) {
        res.status(500).json({ error: "Candles error" });
    }
});

// =====================
// 📊 ANALYTICS
// =====================
app.get("/analytics", (req, res) => {
    res.json({
        totalTrades: "25",
        winRate: "68%",
        profit: "+120 USDT"
    });
});

// =====================
// 🚀 START
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
