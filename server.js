id="backend_full_ai"
require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const NEWS_API = "https://newsapi.org/v2/everything?q=crypto&apiKey=" + process.env.NEWS_KEY;

// 🔥 GET MARKET DATA FROM BINANCE
async function getPrice(symbol) {
    const res = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return parseFloat(res.data.price);
}

// 🔥 SIMPLE RSI (FAKE BUT WORKING)
function calculateRSI() {
    return Math.floor(Math.random() * 100); // simulate
}

// 🔥 TREND (EMA SIMULATION)
function getTrend() {
    return Math.random() > 0.5 ? "BUY" : "SELL";
}

// 🌐 NEWS SENTIMENT
async function getNewsSentiment() {
    try {
        const res = await axios.get(NEWS_API);
        const articles = res.data.articles;

        let score = 0;

        articles.slice(0, 5).forEach(a => {
            if (a.title.includes("rise") || a.title.includes("bull"))
                score++;
            if (a.title.includes("crash") || a.title.includes("fall"))
                score--;
        });

        return score; // positive = good news
    } catch {
        return 0;
    }
}

// 🤖 AI ANALYSIS
app.post("/analyze", async (req, res) => {

    const { symbol } = req.body;

    const price = await getPrice(symbol);
    const rsi = calculateRSI();
    const trend = getTrend();
    const news = await getNewsSentiment();

    let signal = "HOLD";

    // 🧠 FINAL DECISION
    if (rsi < 30 && trend === "BUY" && news >= 0) {
        signal = "BUY";
    }

    if (rsi > 70 && trend === "SELL" && news <= 0) {
        signal = "SELL";
    }

    res.json({
        signal: signal,
        lastPrice: price,
        rsi: rsi
    });
});

app.listen(3000, () => {
    console.log("🚀 AI Trading Backend Running");
});
