require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Binance = require("binance-api-node").default;

const app = express();
app.use(express.json());

// ==========================
// 🗄️ MONGODB
// ==========================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// ==========================
// 👤 USER SCHEMA
// ==========================
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    balance: { type: Number, default: 1000 }
});
const User = mongoose.model("User", userSchema);

// ==========================
// 📊 TRADE SCHEMA (WITH USER)
// ==========================
const tradeSchema = new mongoose.Schema({
    userId: String,
    side: String,
    price: Number,
    quantity: Number,
    profit: Number,
    time: String
});
const Trade = mongoose.model("Trade", tradeSchema);

// ==========================
// 🔐 AUTH
// ==========================
function auth(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

// ==========================
// 💰 BINANCE
// ==========================
const client = Binance({
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_SECRET_KEY,
    httpBase: process.env.USE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com"
});

const SYMBOL = "BTCUSDT";
const MAX_TRADE_USDT = 10;

// ==========================
// 📊 PRICE
// ==========================
async function getPrice(symbol) {
    try {
        const res = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
        );
        return parseFloat(res.data.price);
    } catch {
        return 0;
    }
}

// ==========================
// 📝 SIGNUP
// ==========================
app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const user = new User({ email, password: hashed });
        await user.save();

        res.json({ status: "User created" });
    } catch {
        res.json({ error: "Signup failed" });
    }
});

// ==========================
// 🔑 LOGIN
// ==========================
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.json({ error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token });
    } catch {
        res.json({ error: "Login failed" });
    }
});

// ==========================
// 👤 PROFILE
// ==========================
app.get("/profile", auth, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

// ==========================
// 🤖 ANALYZE
// ==========================
app.post("/analyze", auth, async (req, res) => {
    const price = await getPrice(SYMBOL);
    const rsi = Math.floor(Math.random() * 100);

    let signal = "HOLD";
    if (rsi < 30) signal = "BUY";
    if (rsi > 70) signal = "SELL";

    res.json({ signal, price, rsi });
});

// ==========================
// 💰 TRADE (USER BASED)
// ==========================
app.post("/trade", auth, async (req, res) => {
    try {
        const { side } = req.body;

        const price = await getPrice(SYMBOL);
        const quantity = (MAX_TRADE_USDT / price).toFixed(6);

        const order = await client.order({
            symbol: SYMBOL,
            side,
            type: "MARKET",
            quantity
        });

        // 🔍 LAST USER TRADE
        const lastTrade = await Trade.findOne({
            userId: req.user.id
        }).sort({ _id: -1 });

        let profit = 0;

        if (lastTrade) {
            if (lastTrade.side === "BUY" && side === "SELL") {
                profit = (price - lastTrade.price) * quantity;
            }
            if (lastTrade.side === "SELL" && side === "BUY") {
                profit = (lastTrade.price - price) * quantity;
            }
        }

        // 💾 SAVE TRADE
        const trade = new Trade({
            userId: req.user.id,
            side,
            price,
            quantity,
            profit,
            time: new Date().toLocaleString()
        });

        await trade.save();

        res.json({ status: "SUCCESS", profit });

    } catch (err) {
        res.json({ status: "FAILED", error: err.message });
    }
});

// ==========================
// 📜 USER HISTORY
// ==========================
app.get("/history", auth, async (req, res) => {
    const trades = await Trade.find({
        userId: req.user.id
    }).sort({ _id: -1 });

    res.json(trades);
});

// ==========================
// 💰 USER PROFIT
// ==========================
app.get("/profit", auth, async (req, res) => {
    const trades = await Trade.find({
        userId: req.user.id
    });

    let total = 0;
    trades.forEach(t => total += t.profit || 0);

    res.json({ totalProfit: total.toFixed(2) });
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running FULL APP");
});
