const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// POST /api/stock/movements
router.post("/movements", async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body;

    if (
      !mongoose.isValidObjectId(productId) ||
      !["IN", "OUT"].includes(type) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        message: "Les informations du mouvement sont invalides.",
      });
    }

    const change = type === "IN" ? quantity : -quantity;

    // Mise à jour atomique : évite un stock négatif lors de sorties
    // simultanées du même produit.
    const filter = { _id: productId };

    if (type === "OUT") {
      filter.quantity = { $gte: quantity };
    }

    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { quantity: change } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: productId });

      return res.status(exists ? 409 : 404).json({
        message: exists
          ? "Stock insuffisant."
          : "Produit introuvable.",
      });
    }

    try {
      const movement = await StockMovement.create({
        product: product._id,
        type,
        quantity,
        reason: reason.trim(),
        user: req.user.id,
      });

      return res.status(201).json({
        message: "Mouvement de stock enregistré.",
        product,
        movement,
      });
    } catch (error) {
      // Si l'historique ne peut pas être enregistré, on tente
      // d'annuler la modification de quantité.
      await Product.updateOne(
        { _id: product._id },
        { $inc: { quantity: -change } }
      );

      throw error;
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible d'enregistrer le mouvement de stock.",
    });
  }
});

// GET /api/stock/movements
router.get("/movements", async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("product", "name reference")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(movements);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de récupérer les mouvements.",
    });
  }
});

// GET /api/stock/low-stock
router.get("/low-stock", async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$minimumStock"] },
    }).sort({ quantity: 1 });

    return res.json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de récupérer les produits en stock faible.",
    });
  }
});

module.exports = router;