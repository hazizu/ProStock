const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const productsRoutes = require("./routes/products.routes");
const stockRoutes = require("./routes/stock.routes");
const categoriesRoutes = require("./routes/categories.routes");
const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100kb" }));

// Vérification simple du fonctionnement de l'API.
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API de gestion de stock opérationnelle.",
  });
});

// Routes de l'application.
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stock", stockRoutes);


// Route inconnue.
app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable.",
  });
});

// Gestionnaire général des erreurs.
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.message);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    message: "Une erreur interne est survenue.",
  });
});

module.exports = app;