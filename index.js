import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Product from "./models/Product.js"; // ✅ Import model

dotenv.config();

const app = express();

// ============================
// ✅ CORS Configuration
// ============================
app.use(cors({
  origin: "*", // change in production
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

app.use(express.json());

// ============================
// 🔗 MongoDB Connect
// ============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));


// ============================
// ✅ POST — Create product
// ============================
app.post("/products", async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});


// ============================
// ✅ GET — List products
// ============================
app.get("/products", async (req, res, next) => {
  try {
    const {
      buyer,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;

    let filter = {};

    if (buyer) filter.buyer = buyer;
    if (location) filter.location = location;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      results: products
    });

  } catch (err) {
    next(err);
  }
});


// ============================
// ✅ HEAD — List metadata
// ============================
app.head("/products", async (req, res, next) => {
  try {
    const total = await Product.countDocuments();
    res.set("X-Total-Count", total);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});


// ============================
// ✅ GET — Single product
// ============================
app.get("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.sendStatus(404);
    res.json(product);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});


// ============================
// ✅ HEAD — Check exists
// ============================
app.head("/products/:id", async (req, res) => {
  try {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) return res.sendStatus(404);
    res.sendStatus(200);
  } catch {
    res.sendStatus(400);
  }
});


// ============================
// ✅ PUT — Replace
// ============================
app.put("/products/:id", async (req, res, next) => {
  try {
    const { name, buyer, price, location } = req.body;

    if (!name || !buyer || !price || !location) {
      return res.status(400).json({
        error: "PUT requires full object"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, buyer, price, location },
      { new: true, runValidators: true, overwrite: true }
    );

    if (!product) return res.sendStatus(404);

    res.json(product);

  } catch (err) {
    next(err);
  }
});


// ============================
// ✅ PATCH — Partial update
// ============================
app.patch("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) return res.sendStatus(404);

    res.json(product);
  } catch (err) {
    next(err);
  }
});


// ============================
// ✅ DELETE
// ============================
app.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.sendStatus(404);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});


// ============================
// ❌ 405 Handler
// ============================
app.all("/products", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed" });
});

app.all("/products/:id", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed" });
});


// ============================
// ❌ Global Error Handler
// ============================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});


// ============================
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});
