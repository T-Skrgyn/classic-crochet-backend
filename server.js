const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/**
 * ✅ CORS (ALLOW ALL) - to kill 403 forever during local dev
 * Later you can restrict origins.
 */
app.use(cors());
app.use(express.json());

/**
 * ✅ Debug middleware so you can confirm you are hitting THIS server
 */
app.use((req, res, next) => {
  console.log("HIT:", req.method, req.url, "Origin:", req.headers.origin || "none");
  res.setHeader("X-SERVER", "classic-crochet-api");
  next();
});

/**
 * ✅ Health check
 */
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "classic-crochet-api" });
});

/**
 * ✅ MongoDB Connection
 */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/**
 * ✅ Product Schema
 */
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

/**
 * ✅ API Routes
 */

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Add a product
app.post("/api/products", async (req, res) => {
  try {
    const savedProduct = await Product.create(req.body);
    return res.json(savedProduct);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Start server
 * Use 5001 to avoid some other process sitting on 5000
 */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});
