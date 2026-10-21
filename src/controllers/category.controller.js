
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

// GET /api/categories
// Récupérer les catégories actives
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Erreur getCategories :", error);

    return res.status(500).json({
      message: "Impossible de récupérer les catégories.",
    });
  }
};

// GET /api/categories/:id
// Récupérer une catégorie par son identifiant
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Identifiant de catégorie invalide.",
      });
    }

    const category = await Category.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable.",
      });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error("Erreur getCategoryById :", error);

    return res.status(500).json({
      message: "Impossible de récupérer la catégorie.",
    });
  }
};

// POST /api/categories
// Créer une catégorie
const createCategory = async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Le nom de la catégorie est obligatoire.",
      });
    }

    if (
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "La description doit être une chaîne de caractères.",
      });
    }

    const normalizedName = name.trim();

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${normalizedName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Une catégorie portant ce nom existe déjà.",
      });
    }

    const category = await Category.create({
      name: normalizedName,
      description: description.trim(),
    });

    return res.status(201).json({
      message: "Catégorie créée avec succès.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Une catégorie portant ce nom existe déjà.",
      });
    }

    console.error("Erreur createCategory :", error);

    return res.status(500).json({
      message: "Impossible de créer la catégorie.",
    });
  }
};

// PATCH /api/categories/:id
// Modifier le nom ou la description
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Identifiant de catégorie invalide.",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Le nom de la catégorie est invalide.",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "La description doit être une chaîne de caractères.",
        });
      }

      updates.description = description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée à modifier.",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable.",
      });
    }

    return res.status(200).json({
      message: "Catégorie modifiée avec succès.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Une catégorie portant ce nom existe déjà.",
      });
    }

    console.error("Erreur updateCategory :", error);

    return res.status(500).json({
      message: "Impossible de modifier la catégorie.",
    });
  }
};

// PATCH /api/categories/:id/status
// Activer ou désactiver une catégorie
const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Identifiant de catégorie invalide.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "Le champ isActive doit être un booléen.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Catégorie introuvable.",
      });
    }

    // Ne pas désactiver une catégorie encore utilisée
    // par des produits.
    if (isActive === false) {
      const linkedProduct = await Product.exists({
        category: category._id,
      });

      if (linkedProduct) {
        return res.status(409).json({
          message:
            "Cette catégorie est utilisée par des produits. Réaffectez ces produits avant de la désactiver.",
        });
      }
    }

    category.isActive = isActive;
    await category.save();

    return res.status(200).json({
      message: isActive
        ? "Catégorie activée avec succès."
        : "Catégorie désactivée avec succès.",
      category,
    });
  } catch (error) {
    console.error("Erreur updateCategoryStatus :", error);

    return res.status(500).json({
      message: "Impossible de modifier le statut de la catégorie.",
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};
