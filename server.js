require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const app = express();
app.use(express.json());

// ✅ Binance
const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY,
    httpBase: process.env.USE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com"
});

const SYMBOL = "BTCUSDT";
const MAX_TRADE_USDT = 10;

// ==========================
// 📊 PRICE
// ==========================
async function getPrice(symbol) {
    try {
        const res = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
        );
        return parseFloat(res.data.price);
    } catch {
        return 0;
    }
}

// ==========================
// 📰 NEWS
// ==========================
async function getNewsScore() {
    try {
        const res = await axios.get(
            `https://newsapi.org/v2/everything?q=crypto&apiKey=${process.env.NEWS_KEY}`
        );

        let score = 0;

        (res.data.articles || []).slice(0, 5).forEach(a => {
            const t = (a.title || "").toLowerCase();

            if (t.includes("bull") || t.includes("rise")) score++;
            if (t.includes("crash") || t.includes("fall")) score--;
        });

        return score;

    } catch {
        return 0;
    }
}

// ==========================
// 🏠 HOME
// ==========================
app.get("/", (req, res) => {
    res.send("🚀 Trading Bot Running");
});

// ==========================
// ✅ ANALYZE (GET)
// ==========================
app.get("/analyze", async (req, res) => {
    try {
        const price = await getPrice(SYMBOL);

        res.json({
            signal: "TEST",
            lastPrice: price
        });
    } catch {
        res.json({ signal: "ERROR" });
    }
});

// ==========================
// 🤖 ANALYZE (POST)
// ==========================
app.post("/analyze", async (req, res) => {
    try {
        const price = await getPrice(SYMBOL);
        const rsi = Math.floor(Math.random() * 100);
        const trend = Math.random() > 0.5 ? "BUY" : "SELL";
        const news = await getNewsScore();

        let score = 0;

        if (rsi < 30) score += 2;
        if (rsi > 70) score -= 2;

        if (trend === "BUY") score += 1;
        else score -= 1;

        score += news;

        let signal = "HOLD";
        if (score >= 2) signal = "BUY";
        else if (score <= -2) signal = "SELL";

        res.json({
            signal,
            price,
            rsi,
            news,
            score
        });

    } catch {
        res.json({ signal: "ERROR" });
    }
});

// ==========================
// 💰 TRADE
// ==========================
app.post("/trade", async (req, res) => {
    try {
        const price = await getPrice(SYMBOL);
        const quantity = (MAX_TRADE_USDT / price).toFixed(6);

        const order = await client.order({
            symbol: SYMBOL,
            side: req.body.side,
            type: "MARKET",
            quantity
        });

        res.json({ status: "SUCCESS", order });

    } catch (err) {
        res.json({ status: "FAILED", error: err.message });
    }
});

// ==========================
// 💰 BALANCE
// ==========================
app.get("/balance", async (req, res) => {
    try {
        const acc = await client.accountInfo();
        const usdt = acc.balances.find(b => b.asset === "USDT");

        res.json({ free: usdt ? usdt.free : 0 });

    } catch {
        res.json({ free: 0 });
    }
});

// ==========================
// ❌ HANDLE WRONG ROUTES
// ==========================
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found. Use /analyze"
    });
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
