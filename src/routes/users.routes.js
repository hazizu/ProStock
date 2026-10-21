const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/admin.middleware");

const router = express.Router();

// Toutes les routes de ce fichier sont réservées à l'administrateur.
router.use(authenticate, requireAdmin);

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de récupérer les utilisateurs.",
    });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 12
    ) {
      return res.status(400).json({
        message:
          "Nom et email obligatoires. Le mot de passe doit contenir au moins 12 caractères.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "USER",
    });

    return res.status(201).json({
      message: "Compte utilisateur créé avec succès.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Impossible de créer le compte.",
    });
  }
});

// PATCH /api/users/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "Le champ isActive doit être un booléen.",
      });
    }

    // Évite que l'administrateur désactive son propre compte.
    if (req.params.id === req.user.id && !isActive) {
      return res.status(400).json({
        message: "Vous ne pouvez pas désactiver votre propre compte.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({
      message: isActive
        ? "Compte activé."
        : "Compte désactivé.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Impossible de modifier le statut du compte.",
    });
  }
});

module.exports = router;