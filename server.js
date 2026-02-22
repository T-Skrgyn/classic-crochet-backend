const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* --------------------------------------------------
   CORS
   Allows Netlify + local dev
-------------------------------------------------- */
app.use(cors({
  origin: [
    "https://animated-pudding-afc70c.netlify.app", // your netlify
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

/* --------------------------------------------------
   Health Check (important for Render)
-------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Classic Crochet API running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* --------------------------------------------------
   MongoDB Connection
-------------------------------------------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

/* --------------------------------------------------
   Schema
-------------------------------------------------- */
const productSchema = new mongoose.Schema({
  title: String,
  desc: String,
  image: String,
  link: String,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */

// GET products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD product
app.post("/api/products", async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* --------------------------------------------------
   Start Server
-------------------------------------------------- */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
