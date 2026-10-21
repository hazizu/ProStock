
const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} = require("../controllers/category.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/admin.middleware");

const router = express.Router();

// Toutes les routes nécessitent une authentification.
router.use(authenticate);

// Tous les utilisateurs connectés peuvent consulter les catégories actives.
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Seul l'administrateur peut modifier les catégories.
router.post("/", requireAdmin, createCategory);
router.patch("/:id", requireAdmin, updateCategory);
router.patch("/:id/status", requireAdmin, updateCategoryStatus);

module.exports = router;
