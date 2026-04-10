const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =====================
// CONFIG
// =====================
const SYMBOLS = ["BTCUSDT", "ETHUSDT"];
const INTERVAL = "1m";
const LIMIT = 100;

// =====================
// STORAGE (SIMULATION)
// =====================
let balance = 1000;
let trades = [];

// =====================
// 🟢 ROOT
// =====================
app.get("/", (req, res) => {
    res.send("PRO Trading System Running ✅");
});

// =====================
// 📊 GET CANDLES
// =====================
async function getPrices(symbol) {
    const res = await axios.get("https://api.binance.com/api/v3/klines", {
        params: { symbol, interval: INTERVAL, limit: LIMIT }
    });

    return res.data.map(c => parseFloat(c[4]));
}

// =====================
// 📈 EMA
// =====================
function EMA(prices, period) {
    let k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
}

// =====================
// 📉 RSI
// =====================
function RSI(prices, period = 14) {
    let gain = 0, loss = 0;

    for (let i = 1; i <= period; i++) {
        let diff = prices[i] - prices[i - 1];
        if (diff >= 0) gain += diff;
        else loss -= diff;
    }

    let rs = gain / (loss || 1);
    return 100 - (100 / (1 + rs));
}

// =====================
// 🔥 SIGNAL ENGINE
// =====================
async function getSignal(symbol) {
    const prices = await getPrices(symbol);

    const current = prices[prices.length - 1];

    const ema9 = EMA(prices.slice(-20), 9);
    const ema21 = EMA(prices.slice(-50), 21);
    const rsi = RSI(prices);

    let signal = "HOLD";

    if (ema9 > ema21 && rsi < 65) signal = "BUY";
    else if (ema9 < ema21 && rsi > 35) signal = "SELL";

    return {
        symbol,
        signal,
        price: current,
        rsi: rsi.toFixed(2),
        ema9: ema9.toFixed(2),
        ema21: ema21.toFixed(2)
    };
}

// =====================
// 📊 SIGNAL API
// =====================
app.get("/signal", async (req, res) => {
    const results = [];

    for (let sym of SYMBOLS) {
        const data = await getSignal(sym);
        results.push(data);
    }

    res.json(results);
});

// =====================
// 🤖 AUTO TRADE ENGINE
// =====================
app.get("/auto-trade", async (req, res) => {

    for (let sym of SYMBOLS) {
        const data = await getSignal(sym);

        let action = "NONE";

        if (data.signal === "BUY") {
            balance -= 10;
            action = "BUY";

            trades.push({
                symbol: sym,
                type: "BUY",
                price: data.price,
                time: new Date()
            });

        } else if (data.signal === "SELL") {
            balance += 10;
            action = "SELL";

            trades.push({
                symbol: sym,
                type: "SELL",
                price: data.price,
                time: new Date()
            });
        }
    }

    res.json({
        balance: balance.toFixed(2),
        trades: trades.slice(-5) // last 5 trades
    });
});

// =====================
// 📜 TRADE HISTORY
// =====================
app.get("/history", (req, res) => {
    res.json(trades);
});

// =====================
// 📈 CANDLES
// =====================
app.get("/candles", async (req, res) => {
    const symbol = req.query.symbol || "BTCUSDT";

    try {
        const response = await axios.get(
            "https://api.binance.com/api/v3/klines",
            {
                params: {
                    symbol,
                    interval: "1m",
                    limit: 50
                }
            }
        );

        const candles = response.data.map(c => ({
            open: Number(c[1]),
            high: Number(c[2]),
            low: Number(c[3]),
            close: Number(c[4])
        }));

        res.json(candles);

    } catch {
        res.json([]);
    }
});

// =====================
// 📊 ANALYTICS
// =====================
app.get("/analytics", (req, res) => {
    res.json({
        totalTrades: trades.length.toString(),
        balance: balance.toFixed(2)
    });
});

// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
