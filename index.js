import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB Connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// 🧱 Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  buyer: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model("Product", ProductSchema);



// ============================
// ✅ POST — Create product
// ============================
app.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// ============================
// ✅ GET — List products (with query params)
// ============================
// Examples:
// /products?buyer=Vedant
// /products?location=Delhi
// /products?minPrice=1000&maxPrice=50000
// /products?page=1&limit=5

app.get("/products", async (req, res) => {
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

    const skip = (page - 1) * limit;

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
    res.status(500).json({ error: err.message });
  }
});

// ============================
// ✅ PUT — Replace entire product
// ============================
app.put("/products/:id", async (req, res) => {
  try {
    const { name, buyer, price, location } = req.body;

    // Validate: all fields must be present
    if (!name || !buyer || !price || !location) {
      return res.status(400).json({
        error: "PUT requires full object: name, buyer, price, location"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        buyer,
        price,
        location
      },
      {
        new: true,
        runValidators: true,
        overwrite: true   // 🔥 Important: replaces whole document
      }
    );

    if (!product) return res.status(404).json({ message: "Not found" });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});




// ============================
// ✅ GET — Single product by ID
// ============================
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});



// ============================
// ✅ PATCH — Update product
// ============================
app.patch("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Not found" });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// ============================
// ✅ DELETE — Remove product
// ============================
app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});



// ============================
app.get("/", (req, res) => {
  res.send("🚀 Product API is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});
