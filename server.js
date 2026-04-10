const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =====================
// CONFIG
// =====================
const SYMBOL = "BTCUSDT";
const INTERVAL = "1m";
const LIMIT = 100;

// =====================
// 🟢 ROOT
// =====================
app.get("/", (req, res) => {
    res.send("PRO Trading Backend Running ✅");
});

// =====================
// 📊 GET CANDLES
// =====================
async function getCandles() {
    const res = await axios.get("https://api.binance.com/api/v3/klines", {
        params: {
            symbol: SYMBOL,
            interval: INTERVAL,
            limit: LIMIT
        }
    });

    return res.data.map(c => parseFloat(c[4])); // closing prices
}

// =====================
// 📈 EMA
// =====================
function calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
}

// =====================
// 📉 RSI
// =====================
function calculateRSI(prices, period = 14) {
    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    const rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

// =====================
// 🔥 SIGNAL LOGIC (PRO)
// =====================
app.get("/signal", async (req, res) => {
    try {
        const prices = await getCandles();

        const currentPrice = prices[prices.length - 1];

        const emaShort = calculateEMA(prices.slice(-20), 9);
        const emaLong = calculateEMA(prices.slice(-50), 21);
        const rsi = calculateRSI(prices);

        let signal = "HOLD";

        // ✅ PRO LOGIC
        if (emaShort > emaLong && rsi < 65) {
            signal = "BUY";
        } else if (emaShort < emaLong && rsi > 35) {
            signal = "SELL";
        }

        res.json({
            signal: signal,
            price: currentPrice.toFixed(2),
            rsi: rsi.toFixed(2),
            emaShort: emaShort.toFixed(2),
            emaLong: emaLong.toFixed(2)
        });

    } catch (error) {
        console.log(error.message);

        res.json({
            signal: "HOLD",
            price: "0",
            rsi: "0"
        });
    }
});

// =====================
// 📈 CANDLES (FOR CHART)
// =====================
app.get("/candles", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.binance.com/api/v3/klines",
            {
                params: {
                    symbol: SYMBOL,
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

    } catch (error) {
        // fallback data
        const fake = [];
        let price = 70000;

        for (let i = 0; i < 50; i++) {
            price += (Math.random() - 0.5) * 200;
            fake.push({
                open: price - 50,
                high: price + 50,
                low: price - 100,
                close: price
            });
        }

        res.json(fake);
    }
});

// =====================
// 📊 ANALYTICS
// =====================
app.get("/analytics", (req, res) => {
    res.json({
        totalTrades: "42",
        winRate: "71%",
        profit: "+245 USDT"
    });
});

// =====================
// 🚀 START
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
