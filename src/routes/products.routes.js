const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Toutes les routes nécessitent un compte actif.
router.use(authenticate);

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de récupérer les produits.",
    });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Identifiant de produit invalide.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de récupérer le produit.",
    });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const {
      name,
      reference,
      category,
      brand,
      compatibleModels,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof reference !== "string" ||
      !reference.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      purchasePrice < 0 ||
      sellingPrice < 0
    ) {
      return res.status(400).json({
        message: "Les informations obligatoires du produit sont invalides.",
      });
    }

    const product = await Product.create({
      name,
      reference,
      category,
      brand,
      compatibleModels,
      purchasePrice,
      sellingPrice,
      quantity: quantity ?? 0,
      minimumStock: minimumStock ?? 5,
    });

    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Cette référence produit existe déjà.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Impossible de créer le produit.",
    });
  }
});

// PATCH /api/products/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Identifiant de produit invalide.",
      });
    }

    // La quantité doit passer par les mouvements de stock.
    const {
      quantity,
      ...updates
    } = req.body;

    if (quantity !== undefined) {
      return res.status(400).json({
        message:
          "Modifiez la quantité avec les routes de mouvements de stock.",
      });
    }

    const allowedFields = [
      "name",
      "reference",
      "category",
      "brand",
      "compatibleModels",
      "purchasePrice",
      "sellingPrice",
      "minimumStock",
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Cette référence produit existe déjà.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Impossible de modifier le produit.",
    });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Identifiant de produit invalide.",
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.json({
      message: "Produit supprimé avec succès.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de supprimer le produit.",
    });
  }
});

module.exports = router;