// server.js (SAFE TESTNET TRADING)

const express = require("express");
const Binance = require("node-binance-api");

const app = express();
app.use(express.json());

// 🔐 TESTNET KEYS (PUT YOURS HERE)
const binance = new Binance().options({
  APIKEY: "YOUR_API_KEY",
  APISECRET: "YOUR_SECRET_KEY",
  useServerTime: true,
  test: true // ✅ VERY IMPORTANT (TESTNET)
});

// ✅ CHECK SERVER
app.get("/", (req, res) => {
  res.send("Trading Bot Running (TESTNET)");
});

// ✅ GET BALANCE
app.get("/balance", async (req, res) => {
  try {
    const balances = await binance.balance();
    res.json(balances);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ✅ BUY ORDER (SAFE)
app.post("/buy", async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    const order = await binance.marketBuy(symbol, quantity);

    res.json(order);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ✅ SELL ORDER (SAFE)
app.post("/sell", async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    const order = await binance.marketSell(symbol, quantity);

    res.json(order);
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
