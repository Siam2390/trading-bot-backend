require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const app = express();
app.use(express.json());

// ✅ Binance client
const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY,
    httpBase: process.env.USE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com"
});

// 🔒 SAFETY SETTINGS
const MAX_TRADE_USDT = 10; // max $10 per trade
const ALLOWED_SYMBOL = "BTCUSDT";

// 📊 GET PRICE
async function getPrice(symbol) {
    const res = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return parseFloat(res.data.price);
}

// 🤖 ANALYZE (same as before)
app.post("/analyze", async (req, res) => {

    const price = await getPrice("BTCUSDT");

    const rsi = Math.floor(Math.random() * 100);
    const trend = Math.random() > 0.5 ? "BUY" : "SELL";

    let signal = "HOLD";

    if (rsi < 30 && trend === "BUY") signal = "BUY";
    if (rsi > 70 && trend === "SELL") signal = "SELL";

    res.json({
        signal,
        lastPrice: price,
        rsi
    });
});

// 💰 REAL TRADE (SAFE)
app.post("/trade", async (req, res) => {

    try {
        const { symbol, side } = req.body;

        // 🔒 SECURITY CHECKS
        if (symbol !== ALLOWED_SYMBOL) {
            return res.status(400).json({ error: "Invalid symbol" });
        }

        const price = await getPrice(symbol);

        // calculate small quantity
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
            free: parseFloat(usdt.free)
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 Trading Bot LIVE");
});
