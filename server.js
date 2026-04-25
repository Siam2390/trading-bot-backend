const express = require("express");
const axios = require("axios");
const Binance = require("node-binance-api");

const app = express();
app.use(express.json());

// 🔐 PUT YOUR BINANCE TESTNET KEYS
const binance = new Binance().options({
    APIKEY: "YOUR_API_KEY",
    APISECRET: "YOUR_SECRET_KEY",
    useServerTime: true,
    test: true // ✅ keep true (SAFE)
});

// ✅ HOME
app.get("/", (req, res) => {
    res.send("Server Running with AI ✅");
});

// ✅ AUTO TRADE (AI + BINANCE)
app.post("/auto-trade", async (req, res) => {

    try {
        const prices = req.body.prices;

        // 🔥 CALL ONLINE AI (IMPORTANT)
        const aiResponse = await axios.post(
            "https://trading-ai-model.onrender.com/predict", // 🔁 YOUR AI LINK
            { prices: prices }
        );

        const signal = aiResponse.data.signal || "HOLD";

        let result = "No Trade";

        // ✅ EXECUTE TRADE
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

        console.log(error.response?.data || error.message);

        res.status(500).json({
            signal: "HOLD",
            result: "Error in AI/Trade"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
