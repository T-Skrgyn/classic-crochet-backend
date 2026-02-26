const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* --------------------------------------------------
   CORS (Netlify + Local)
-------------------------------------------------- */
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (
      origin.includes("netlify.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return cb(null, true);
    }

    return cb(new Error("CORS blocked: " + origin), false);
  },
  // ADDED "PUT" SO YOU CAN EDIT PRODUCTS
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

/* --------------------------------------------------
   HEALTH CHECK (Render needs this)
-------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Classic Crochet API running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* --------------------------------------------------
   MONGODB CONNECT
-------------------------------------------------- */
mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 15000,
})
.then(() => {
  console.log("✅ MongoDB connected");
})
.catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
});

/* --------------------------------------------------
   BLOCK REQUESTS IF DB NOT READY
-------------------------------------------------- */
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({
      error: "MongoDB not connected",
      state: mongoose.connection.readyState
    });
  }
  next();
});

/* --------------------------------------------------
   SCHEMA (UPDATED WITH NEW LINKS)
-------------------------------------------------- */
const productSchema = new mongoose.Schema({
  title: String,
  desc: String,
  image: String,
  link: String,           // Meesho Link
  amazonLink: String,     // NEW: Amazon Link
  flipkartLink: String,   // NEW: Flipkart Link
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */

// GET products
app.get("/api/products", async (req, res) => {
  try {
    const data = await Product.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ADD product
app.post("/api/products", async (req, res) => {
  try {
    const saved = await Product.create(req.body);
    res.json(saved);
  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (EDIT) product - NEW ROUTE
app.put("/api/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // Returns the updated document instead of the old one
    );
    res.json(updated);
  } catch (err) {
    console.error("PUT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});