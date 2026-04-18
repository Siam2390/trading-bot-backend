require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
// 🔐 AUTH MIDDLEWARE
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
// 📝 SIGNUP
// ==========================
app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashed
        });

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

        if (!user) {
            return res.json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ error: "Wrong password" });
        }

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
// 👤 PROFILE (PROTECTED)
// ==========================
app.get("/profile", auth, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

// ==========================
// 💰 BALANCE (PROTECTED)
// ==========================
app.get("/balance", auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ balance: user.balance });
});

// ==========================
// 🏠 HOME
// ==========================
app.get("/", (req, res) => {
    res.send("🚀 Auth System Running");
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running with Auth");
});
