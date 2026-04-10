const express = require("express");
const axios = require("axios");

const app = express();

// =====================
// ROOT
// =====================
app.get("/", (req, res) => {
    res.send("Backend working ✅");
});

// =====================
// 📊 SIGNAL (FIXED)
// =====================
app.get("/signal", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.binance.com/api/v3/ticker/price",
            {
                params: { symbol: "BTCUSDT" }
            }
        );

        const price = parseFloat(response.data.price);

        res.json({
            signal: price > 50000 ? "BUY" : "SELL",
            price: price.toString(),
            rsi: "50"
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
// 📈 CANDLES (FIXED)
// =====================
app.get("/candles", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.binance.com/api/v3/klines",
            {
                params: {
                    symbol: "BTCUSDT",
                    interval: "1m",
                    limit: 50
                }
            }
        );

        const candles = response.data.map(c => ({
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4])
        }));

        res.json(candles);

    } catch (error) {
        res.json([]);
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
