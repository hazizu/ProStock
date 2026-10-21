require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET doit être défini avec une clé suffisamment longue."
    );
  }

  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Démarrage impossible :", error.message);
  process.exit(1);
});