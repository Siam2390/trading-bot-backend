// server.js

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 SAFE MODE (true = no real trade)
const TEST_MODE = true;

// ✅ HOME
app.get("/", (req, res) => {
    res.send("Auto Trading Server Running ✅");
});

// ✅ AUTO TRADE API
app.post("/auto-trade", async (req, res) => {

    try {
        const prices = req.body.prices;

        // 🔥 GET AI SIGNAL
        const ai = await axios.post("http://127.0.0.1:5001/predict", {
            prices: prices
        });

        const signal = ai.data.signal || "HOLD";

        let tradeResult = "No Trade";

        // ✅ AUTO EXECUTE
        if (signal === "BUY") {

            if (TEST_MODE) {
                tradeResult = "TEST BUY executed";
            } else {
                // 👉 REAL BINANCE API HERE (later)
                tradeResult = "REAL BUY executed";
            }

        } else if (signal === "SELL") {

            if (TEST_MODE) {
                tradeResult = "TEST SELL executed";
            } else {
                tradeResult = "REAL SELL executed";
            }
        }

        res.json({
            signal: signal,
            result: tradeResult
        });

    } catch (err) {
        res.status(500).json({
            signal: "HOLD",
            result: "Error"
        });
    }
});

app.listen(3000, () => console.log("Server running on 3000"));
