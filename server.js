const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(require("cors")());

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET = process.env.BINANCE_SECRET_KEY;
const BASE = process.env.BASE_URL;

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
    } catch {
        res.json([]);
    }
});

// ================= CANDLES =================
app.get("/candles", async (req, res) => {
    try {
        const r = await axios.get(`${BASE}/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50`);

        const data = r.data.map(c => ({
            open: Number(c[1]),
            high: Number(c[2]),
            low: Number(c[3]),
            close: Number(c[4])
        }));

        res.json(data);
    } catch {
        res.json([]);
    }
});

// ================= BALANCE =================
app.get("/balance", async (req, res) => {
    try {
        const timestamp = Date.now();
        const query = `timestamp=${timestamp}`;

        const signature = crypto.createHmac("sha256", SECRET)
            .update(query)
            .digest("hex");

        const r = await axios.get(
            `${BASE}/api/v3/account?${query}&signature=${signature}`,
            { headers: { "X-MBX-APIKEY": API_KEY } }
        );

        const usdt = r.data.balances.find(b => b.asset === "USDT");

        res.json({
            free: usdt.free
        });

    } catch {
        res.json({ free: "0" });
    }
});

// ================= TRADE =================
app.post("/trade", async (req, res) => {
    try {
        const side = req.body.side; // BUY / SELL
        const symbol = "BTCUSDT";
        const quantity = 0.001;

        const timestamp = Date.now();

        const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;

        const signature = crypto.createHmac("sha256", SECRET)
            .update(query)
            .digest("hex");

        const url = `${BASE}/api/v3/order?${query}&signature=${signature}`;

        const r = await axios.post(url, {}, {
            headers: { "X-MBX-APIKEY": API_KEY }
        });

        res.json(r.data);

    } catch (err) {
        res.json({ error: "Trade failed" });
    }
});

app.listen(3000, () => console.log("Server running"));
