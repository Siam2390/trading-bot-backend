const express = require("express");
const Binance = require("node-binance-api");

const app = express();
app.use(express.json());

// 🔐 PUT YOUR BINANCE TESTNET KEYS
const binance = new Binance().options({
    APIKEY: "YOUR_API_KEY",
    APISECRET: "YOUR_SECRET_KEY",
    useServerTime: true,
    test: true // SAFE MODE
});

// ✅ HOME
app.get("/", (req, res) => {
    res.send("Server Running ✅");
});

// ✅ AUTO TRADE (NO AI FOR NOW → NO CRASH)
app.post("/auto-trade", async (req, res) => {

    try {

        // 🔥 TEMP SIGNAL (SAFE TEST)
        const signal = "BUY";

        let result = "No Trade";

        if (signal === "BUY") {
            await binance.marketBuy("BTCUSDT", 0.001);
            result = "BUY Order Placed";
        }

        if (signal === "SELL") {
            await binance.marketSell("BTCUSDT", 0.001);
            result = "SELL Order Placed";
        }

        res.json({
            signal: signal,
            result: result
        });

    } catch (error) {

        console.log(error.body || error.message);

        res.status(500).json({
            signal: "ERROR",
            result: "Trade Failed"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
