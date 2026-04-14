const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ================= CONFIG =================
const API_KEY = process.env.BINANCE_API_KEY;
const SECRET = process.env.BINANCE_SECRET_KEY;
const BASE = process.env.BASE_URL; // https://testnet.binance.vision

// ================= HOME =================
app.get("/", (req, res) => {
    res.send("Trading Bot Backend Running ✅");
});

// ================= SIGNAL =================
app.get("/signal", async (req, res) => {
    try {
        const r = await axios.get(`${BASE}/api/v3/ticker/price?symbol=BTCUSDT`);
        const price = parseFloat(r.data.price);

        const signal = price % 2 === 0 ? "BUY" : "SELL";

        res.json([{
            symbol: "BTCUSDT",
            price: price.toFixed(2),
            signal: signal,
            rsi: "50"
        }]);

    } catch (err) {
        res.json([]);
    }
});

// ================= CANDLES =================
app.get("/candles", async (req, res) => {
    try {
        const r = await axios.get(
            `${BASE}/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50`
        );

        const data = r.data.map(c => ({
            open: Number(c[1]),
            high: Number(c[2]),
            low: Number(c[3]),
            close: Number(c[4])
        }));

        res.json(data);

    } catch (err) {
        res.json([]);
    }
});

// ================= BALANCE =================
app.get("/balance", async (req, res) => {
    try {
        const timestamp = Date.now();

        const query = `timestamp=${timestamp}`;

        const signature = crypto
            .createHmac("sha256", SECRET)
            .update(query)
            .digest("hex");

        const r = await axios.get(
            `${BASE}/api/v3/account?${query}&signature=${signature}`,
            {
                headers: {
                    "X-MBX-APIKEY": API_KEY
                }
            }
        );

        const usdt = r.data.balances.find(b => b.asset === "USDT");

        res.json({
            free: usdt?.free || "0"
        });

    } catch (err) {
        res.json({ free: "0" });
    }
});

// ================= TRADE =================
app.post("/trade", async (req, res) => {
    try {
        const side = req.body.side; // BUY or SELL
        const symbol = "BTCUSDT";
        const quantity = 0.001;

        const timestamp = Date.now();

        const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;

        const signature = crypto
            .createHmac("sha256", SECRET)
            .update(query)
            .digest("hex");

        const url = `${BASE}/api/v3/order?${query}&signature=${signature}`;

        const r = await axios.post(url, {}, {
            headers: {
                "X-MBX-APIKEY": API_KEY
            }
        });

        res.json({
            status: "success",
            data: r.data
        });

    } catch (err) {
        res.json({
            status: "error",
            message: err.message
        });
    }
});

// ================= HISTORY =================
app.get("/history", (req, res) => {
    res.json([
        { action: "BUY BTC" },
        { action: "SELL BTC" },
        { action: "BUY BTC" }
    ]);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
