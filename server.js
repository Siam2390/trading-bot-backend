require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const app = express();
app.use(express.json());

// ✅ Binance Client (Testnet or Live)
const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY,
    httpBase: process.env.USE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com"
});

// 🔒 SAFETY SETTINGS
const MAX_TRADE_USDT = 10;   // max $10 per trade
const SYMBOL = "BTCUSDT";

// 🌐 NEWS API
const NEWS_API = `https://newsapi.org/v2/everything?q=crypto&apiKey=${process.env.NEWS_KEY}`;

// 📊 GET PRICE
async function getPrice(symbol) {
    const res = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return parseFloat(res.data.price);
}

// 📉 SIMPLE RSI (SIMULATED)
function getRSI() {
    return Math.floor(Math.random() * 100);
}

// 📈 TREND (SIMULATED)
function getTrend() {
    return Math.random() > 0.5 ? "BUY" : "SELL";
}

// 📰 NEWS SENTIMENT
async function getNewsScore() {
    try {
        const res = await axios.get(NEWS_API);
        const articles = res.data.articles || [];

        let score = 0;

        articles.slice(0, 5).forEach(a => {
            const title = a.title.toLowerCase();

            if (title.includes("bull") || title.includes("rise")) score++;
            if (title.includes("crash") || title.includes("fall")) score--;
        });

        return score;
    } catch (e) {
        return 0;
    }
}

//
// 🔥 ROUTES
//

// ✅ TEST ROUTE (BROWSER)
app.get("/", (req, res) => {
    res.send("🚀 Trading Bot Backend Running");
});

// ✅ ANALYZE (GET for browser)
app.get("/analyze", async (req, res) => {
    const price = await getPrice(SYMBOL);

    res.json({
        signal: "TEST",
        lastPrice: price,
        rsi: 50
    });
});

// ✅ ANALYZE (POST for app)
app.post("/analyze", async (req, res) => {

    try {
        const price = await getPrice(SYMBOL);
        const rsi = getRSI();
        const trend = getTrend();
        const news = await getNewsScore();

        let signal = "HOLD";

        // 🧠 AI LOGIC
        if (rsi < 30 && trend === "BUY" && news >= 0) {
            signal = "BUY";
        }

        if (rsi > 70 && trend === "SELL" && news <= 0) {
            signal = "SELL";
        }

        res.json({
            signal: signal,
            lastPrice: price,
            rsi: rsi
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 💰 REAL TRADE
app.post("/trade", async (req, res) => {

    try {
        const { symbol, side } = req.body;

        if (symbol !== SYMBOL) {
            return res.status(400).json({ error: "Invalid symbol" });
        }

        const price = await getPrice(symbol);
        const quantity = (MAX_TRADE_USDT / price).toFixed(6);

        const order = await client.order({
            symbol: symbol,
            side: side,
            type: "MARKET",
            quantity: quantity
        });

        res.json({
            status: "SUCCESS",
            order: order
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            status: "FAILED",
            error: err.message
        });
    }
});

// 💰 BALANCE
app.get("/balance", async (req, res) => {

    try {
        const account = await client.accountInfo();

        const usdt = account.balances.find(b => b.asset === "USDT");

        res.json({
            free: usdt ? parseFloat(usdt.free) : 0
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//
// 🚀 START SERVER
//
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
