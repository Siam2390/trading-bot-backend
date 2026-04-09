const express = require("express");
const app = express();

app.use(express.json());

let balance = 1000;
let position = null;
let entryPrice = 0;

let tradeHistory = [];

// ✅ GET CANDLES
app.get("/candles", async (req, res) => {
    const symbol = req.query.symbol || "BTCUSDT";

    const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=100`
    );

    const data = await response.json();

    const candles = data.map(c => ({
        close: parseFloat(c[4]),
        volume: parseFloat(c[5])
    }));

    res.json(candles);
});

// ✅ TRADE EXECUTION
app.post("/trade", (req, res) => {
    const { side, price } = req.body;

    if (side === "BUY" && position === null) {
        position = "BUY";
        entryPrice = price;
    }

    if (side === "SELL" && position === "BUY") {
        const profit = price - entryPrice;
        balance += profit;

        tradeHistory.push({
            entry: entryPrice,
            exit: price,
            profit: profit,
            time: new Date()
        });

        position = null;
    }

    res.json({ balance, position });
});

// ✅ TRADE HISTORY
app.get("/history", (req, res) => {
    res.json(tradeHistory);
});

// ✅ ANALYTICS
app.get("/analytics", (req, res) => {

    const total = tradeHistory.length;
    const wins = tradeHistory.filter(t => t.profit > 0).length;
    const profit = tradeHistory.reduce((sum, t) => sum + t.profit, 0);

    const winRate = total === 0 ? 0 : (wins / total) * 100;

    res.json({
        totalTrades: total,
        winRate: winRate.toFixed(2),
        totalProfit: profit.toFixed(2)
    });
});

// ✅ BACKTEST
app.get("/backtest", async (req, res) => {

    const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=200`
    );

    const data = await response.json();

    let testBalance = 1000;
    let pos = null;
    let entry = 0;

    for (let i = 20; i < data.length; i++) {

        const price = parseFloat(data[i][4]);
        const prev = parseFloat(data[i - 1][4]);

        if (pos === null && price > prev) {
            pos = "BUY";
            entry = price;
        }

        else if (pos === "BUY" && price < prev) {
            testBalance += (price - entry);
            pos = null;
        }
    }

    res.json({ resultBalance: testBalance.toFixed(2) });
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});