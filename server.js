require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// ==========================
// 🗄️ MONGODB CONNECT
// ==========================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("Mongo Error:", err));

// ==========================
// 📊 SCHEMA
// ==========================
const tradeSchema = new mongoose.Schema({
    side: String,
    price: Number,
    quantity: Number,
    profit: Number,
    time: String
});

const Trade = mongoose.model("Trade", tradeSchema);

// ==========================
// 💰 BINANCE
// ==========================
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

            if (t.includes("bull")) score++;
            if (t.includes("crash")) score--;
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
    res.send("🚀 Trading Bot Running with DB");
});

// ==========================
// 🤖 ANALYZE
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

        if (trend === "BUY") score++;
        else score--;

        score += news;

        let signal = "HOLD";
        if (score >= 2) signal = "BUY";
        else if (score <= -2) signal = "SELL";

        res.json({ signal, price });

    } catch {
        res.json({ signal: "ERROR" });
    }
});

// ==========================
// 💰 TRADE + SAVE DB
// ==========================
app.post("/trade", async (req, res) => {
    try {
        const { side } = req.body;

        const price = await getPrice(SYMBOL);
        const quantity = (MAX_TRADE_USDT / price).toFixed(6);

        const order = await client.order({
            symbol: SYMBOL,
            side,
            type: "MARKET",
            quantity
        });

        // 🔍 GET LAST TRADE
        const lastTrade = await Trade.findOne().sort({ _id: -1 });

        let profit = 0;

        if (lastTrade) {
            if (lastTrade.side === "BUY" && side === "SELL") {
                profit = (price - lastTrade.price) * quantity;
            }

            if (lastTrade.side === "SELL" && side === "BUY") {
                profit = (lastTrade.price - price) * quantity;
            }
        }

        // 💾 SAVE TO DB
        const newTrade = new Trade({
            side,
            price,
            quantity,
            profit,
            time: new Date().toLocaleString()
        });

        await newTrade.save();

        res.json({
            status: "SUCCESS",
            profit
        });

    } catch (err) {
        res.json({ status: "FAILED", error: err.message });
    }
});

// ==========================
// 📜 HISTORY FROM DB
// ==========================
app.get("/history", async (req, res) => {
    const trades = await Trade.find().sort({ _id: -1 });
    res.json(trades);
});

// ==========================
// 💰 TOTAL PROFIT
// ==========================
app.get("/profit", async (req, res) => {
    const trades = await Trade.find();

    let total = 0;
    trades.forEach(t => total += t.profit || 0);

    res.json({ totalProfit: total.toFixed(2) });
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running with MongoDB");
});
