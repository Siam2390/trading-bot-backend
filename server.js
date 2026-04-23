// server.js

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ✅ TEST ROUTE (to check server)
app.get("/", (req, res) => {
    res.send("Backend is running ✅");
});

// ✅ AI TRADE ROUTE
app.post("/ai-trade", async (req, res) => {

    try {
        const prices = req.body.prices;

        if (!prices || prices.length === 0) {
            return res.status(400).json({
                error: "No prices provided"
            });
        }

        // 🔥 CONNECT TO PYTHON AI
        const response = await axios.post(
            "http://10.0.2.2:5001/predict",   // IMPORTANT
            { prices: prices }
        );

        return res.json({
            signal: response.data.signal
        });

    } catch (error) {
        console.log("AI ERROR:", error.message);

        return res.status(500).json({
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
