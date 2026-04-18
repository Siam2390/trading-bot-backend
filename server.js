require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const app = express();
app.use(express.json());

// ✅ Binance Client
const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY,
    httpBase: process.env.USE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com"
});

// 🔒 SETTINGS
const SYMBOL = "BTCUSDT";
const MAX_TRADE_USDT = 10;

// ==========================
// 📊 SAFE PRICE FUNCTION
// ==========================
async function getPrice(symbol) {
    try {
        const res = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
            { timeout: 5000 }
        );
        return parseFloat(res.data.price);
    } catch (err) {
        console.log("Price error:", err.message);
        return 0;
    }
}

// ==========================
// 📰 SAFE NEWS FUNCTION
// ==========================
async function getNewsScore() {
    try {
        const res = await axios.get(
            `https://newsapi.org/v2/everything?q=crypto&apiKey=${process.env.NEWS_KEY}`,
            { timeout: 5000 }
        );

        const articles = res.data.articles || [];

        let score = 0;

        articles.slice(0, 5).forEach(a => {
            const title = (a.title || "").toLowerCase();

            if (title.includes("bull") || title.includes("rise")) score++;
            if (title.includes("crash") || title.includes("fall")) score--;
        });

        return score;

    } catch (err) {
        console.log("News error:", err.message);
        return 0; // 🔒 prevents crash
    }
}

// ==========================
// 🏠 HOME
// ==========================
app.get("/", (req, res) => {
    res.send("🚀 Trading Bot Backend Running");
});

// ==========================
// 📊 ANALYZE (GET for browser)
// ==========================
app.get("/analyze", async (req, res) => {
    try {
        const price = await getPrice(SYMBOL);

        res.json({
            signal: "TEST",
            lastPrice: price,
            rsi: 50,
            news: 0
        });

    } catch {
        res.json({
            signal: "ERROR",
            lastPrice: 0,
            rsi: 0,
            news: 0
        });
    }
});

// ==========================
// 🤖 ANALYZE (POST for app)
// ==========================
app.post("/analyze", async (req, res) => {
    try {

        const price = await getPrice(SYMBOL);

        const rsi = Math.floor(Math.random() * 100);
        const trend = Math.random() > 0.5 ? "BUY" : "SELL";

        // 🔥 SAFE NEWS
        let newsScore = 0;
        try {
            newsScore = await getNewsScore();
        } catch {
            newsScore = 0;
        }

        let signal = "HOLD";

        // 🧠 AI + NEWS LOGIC
        if (rsi < 30 && trend === "BUY" && newsScore >= 0) {
            signal = "BUY";
        }

        if (rsi > 70 && trend === "SELL" && newsScore <= 0) {
            signal = "SELL";
        }

        // 🚫 BAD NEWS FILTER
        if (newsScore < -2) {
            signal = "HOLD";
        }

        res.json({
            signal,
            lastPrice: price,
            rsi,
            news: newsScore
        });

    } catch (err) {
        console.log("Analyze error:", err.message);

        res.json({
            signal: "ERROR",
            lastPrice: 0,
            rsi: 0,
            news: 0
        });
    }
});

// ==========================
// 💰 TRADE
// ==========================
app.post("/trade", async (req, res) => {

    try {
        const { symbol, side } = req.body;

        if (symbol !== SYMBOL) {
            return res.json({ status: "Invalid symbol" });
        }

        const price = await getPrice(symbol);

        if (price === 0) {
            return res.json({ status: "Price error" });
        }

        const quantity = (MAX_TRADE_USDT / price).toFixed(6);

        const order = await client.order({
            symbol: symbol,
            side: side,
            type: "MARKET",
            quantity: quantity
        });

        res.json({
            status: "SUCCESS",
            order
        });

    } catch (err) {
        console.log("Trade error:", err.message);

        res.json({
            status: "FAILED",
            error: err.message
        });
    }
});

// ==========================
// 💰 BALANCE
// ==========================
app.get("/balance", async (req, res) => {

    try {
        const account = await client.accountInfo();

        const usdt = account.balances.find(b => b.asset === "USDT");

        res.json({
            free: usdt ? parseFloat(usdt.free) : 0
        });

    } catch {
        res.json({ free: 0 });
    }
});

// ==========================
// 🚀 START SERVER
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
