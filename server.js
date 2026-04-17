require("dotenv").config();
const express = require("express");
const Binance = require("node-binance-api");

const app = express();
app.use(express.json());

const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
});


// 🔥 GET BALANCE
app.get("/balance", async (req, res) => {
  try {
    const balances = await binance.balance();
    res.json({
      free: balances.USDT.available
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔥 MARKET ANALYSIS (SIMPLE STRATEGY)
app.post("/analyze", async (req, res) => {
  const { symbol, interval } = req.body;

  try {
    const candles = await binance.candlesticks(symbol, interval);

    const closes = candles.map(c => parseFloat(c[4]));

    const last = closes[closes.length - 1];
    const prev = closes[closes.length - 2];

    let signal = "HOLD";

    if (last > prev) signal = "BUY";
    if (last < prev) signal = "SELL";

    res.json({
      signal,
      lastPrice: last
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔥 PLACE ORDER (REAL TRADING)
app.post("/trade", async (req, res) => {
  const { symbol, side, quantity } = req.body;

  try {
    let result;

    if (side === "BUY") {
      result = await binance.marketBuy(symbol, quantity);
    } else {
      result = await binance.marketSell(symbol, quantity);
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => {
  console.log("🚀 Trading Bot Backend Running");
});
