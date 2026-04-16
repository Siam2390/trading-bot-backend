const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------ TEST ROUTE ------------------ */
app.get("/", (req, res) => {
  res.send("Trading Bot Backend is Running 🚀");
});

/* ------------------ ANALYZE ROUTE ------------------ */
app.post("/analyze", async (req, res) => {
  try {
    const { symbol, interval } = req.body;

    if (!symbol || !interval) {
      return res.status(400).json({
        error: "Symbol and interval are required"
      });
    }

    // Binance API
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`;

    const response = await axios.get(url);
    const data = response.data;

    let lastClose = parseFloat(data[data.length - 1][4]);
    let firstClose = parseFloat(data[0][4]);

    let signal = "HOLD";

    if (lastClose > firstClose) {
      signal = "BUY";
    } else if (lastClose < firstClose) {
      signal = "SELL";
    }

    res.json({
      symbol,
      interval,
      signal,
      lastPrice: lastClose
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Something went wrong"
    });
  }
});

/* ------------------ BALANCE ROUTE (NEW) ------------------ */
app.get("/balance", (req, res) => {
  res.json({
    free: 1000.00   // fake demo balance
  });
});

/* ------------------ START SERVER ------------------ */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
