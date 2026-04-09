import express from "express";

const app = express();
app.use(express.json());

// ====== STORAGE ======
let balance = 1000;
let position = null;
let entryPrice = 0;
let tradeHistory = [];

// ====== ROOT ======
app.get("/", (req, res) => {
    res.send("Backend working ✅");
});

// ====== REAL PRICE ======
app.get("/price", async (req, res) => {
    try {
        const response = await fetch(
            "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
        );
        const data = await response.json();

        res.json({ price: parseFloat(data.price) });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch price" });
    }
});

// ====== CANDLES ======
app.get("/candles", async (req, res) => {
    try {
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
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch candles" });
    }
});

// ====== SIMPLE SIGNAL (TREND BASED) ======
app.get("/signal", async (req, res) => {
    try {
        const response = await fetch(
            "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=50"
        );

        const data = await response.json();

        const closes = data.map(c => parseFloat(c[4]));

        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 2];

        let signal = "HOLD";

        if (last > prev) signal = "BUY";
        if (last < prev) signal = "SELL";

        res.json({ signal });

    } catch (e) {
        res.status(500).json({ error: "Signal error" });
    }
});

// ====== TRADE ======
app.post("/trade", (req, res) => {
    const { side, price } = req.body;

    if (!price) {
        return res.status(400).json({ error: "Price required" });
    }

    if (side === "BUY" && position === null) {
        position = "BUY";
        entryPrice = price;
    }

    else if (side === "SELL" && position === "BUY") {
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

    res.json({
        balance,
        position
    });
});

// ====== HISTORY ======
app.get("/history", (req, res) => {
    res.json(tradeHistory);
});

// ====== ANALYTICS ======
app.get("/analytics", (req, res) => {
    const total = tradeHistory.length;
    const wins = tradeHistory.filter(t => t.profit > 0).length;
    const profit = tradeHistory.reduce((sum, t) => sum + t.profit, 0);

    const winRate = total === 0 ? 0 : (wins / total) * 100;

    res.json({
        totalTrades: total,
        winRate: winRate.toFixed(2),
        totalProfit: profit.toFixed(2),
        balance: balance.toFixed(2)
    });
});

// ====== BACKTEST ======
app.get("/backtest", async (req, res) => {
    try {
        const response = await fetch(
            "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=200"
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

    } catch (e) {
        res.status(500).json({ error: "Backtest error" });
    }
});

// ====== SERVER START (RENDER FIX) ======
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
