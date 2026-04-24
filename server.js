// server.js

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ✅ TEST ROUTE (open in browser)
app.get("/", (req, res) => {
    res.send("Backend is running ✅");
});

// ✅ AI TRADE ROUTE
app.post("/ai-trade", async (req, res) => {

    try {
        const prices = req.body.prices;

        // ❗ check data
        if (!prices || prices.length === 0) {
            return res.status(400).json({
                signal: "HOLD",
                error: "No price data"
            });
        }

        // ✅ CONNECT TO PYTHON AI (LOCAL)
        const aiResponse = await axios.post(
            "http://127.0.0.1:5001/predict",
            { prices: prices }
        );

        const signal = aiResponse.data.signal || "HOLD";

        res.json({
            signal: signal
        });

    } catch (error) {

        console.log("AI ERROR:", error.message);

        // ❗ NEVER CRASH APP
        res.status(500).json({
            signal: "HOLD",
            error: "AI failed"
        });
    }
});

// ✅ START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
