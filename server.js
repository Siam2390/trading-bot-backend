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
    password: String
});

const User = mongoose.model("User", userSchema);

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
// 🏠 HOME
// ==========================
app.get("/", (req, res) => {
    res.send("🚀 Backend Running");
});

// ==========================
// 🔧 FIX: LOGIN GET (BROWSER)
// ==========================
app.get("/login", (req, res) => {
    res.send("⚠️ Use POST method to login (not GET)");
});

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
// 🔑 LOGIN (REAL)
// ==========================
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ error: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
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
// 👤 PROFILE
// ==========================
app.get("/profile", auth, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

// ==========================
// ❌ 404
// ==========================
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running with login fix");
});
