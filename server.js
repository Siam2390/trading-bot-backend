const express = require("express");
const axios = require("axios");
const Binance = require("node-binance-api");

const app = express();
app.use(express.json());

// 🔐 PUT YOUR KEYS HERE
const binance = new Binance().options({
    APIKEY: "YOUR_API_KEY",
    APISECRET: "YOUR_SECRET_KEY",
    useServerTime: true,
    test: true // ✅ TEST MODE (SAFE)
});

// ✅ HOME
app.get("/", (req, res) => {
    res.send("Binance Auto Trading Running ✅");
});

// ✅ AUTO TRADE
app.post("/auto-trade", async (req, res) => {

    try {
        const prices = req.body.prices;

        // 🔥 GET AI SIGNAL
        const ai = await axios.post("http://127.0.0.1:5001/predict", {
            prices: prices
        });

        const signal = ai.data.signal || "HOLD";

        let result = "No Trade";

        // ✅ EXECUTE TRADE
        if (signal === "BUY") {

            await binance.marketBuy("BTCUSDT", 0.001);
            result = "BUY Order Placed";

        } else if (signal === "SELL") {

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
            signal: "HOLD",
            result: "Trade Failed"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on 3000");
});
