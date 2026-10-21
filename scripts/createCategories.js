
require("dotenv").config();

const mongoose = require("mongoose");
const Category = require("../src/models/Category");

const categories = [
  {
    name: "Écrans",
    code: "ECRAN",
    description: "Écrans LCD et OLED pour téléphones.",
  },
  {
    name: "Batteries",
    code: "BATTERIE",
    description: "Batteries de remplacement pour téléphones.",
  },
  {
    name: "Connecteurs de charge",
    code: "CONNECTEUR_CHARGE",
    description: "Connecteurs et ports de charge.",
  },
  {
    name: "Chargeurs",
    code: "CHARGEUR",
    description: "Chargeurs secteur et adaptateurs.",
  },
  {
    name: "Câbles",
    code: "CABLE",
    description: "Câbles de charge et de connexion.",
  },
  {
    name: "Écouteurs et haut-parleurs",
    code: "AUDIO",
    description: "Écouteurs, haut-parleurs et composants audio.",
  },
  {
    name: "Caméras",
    code: "CAMERA",
    description: "Caméras avant et arrière pour téléphones.",
  },
  {
    name: "Nappes et boutons",
    code: "NAPPE_BOUTON",
    description: "Nappes de connexion et boutons de remplacement.",
  },
  {
    name: "Coques et châssis",
    code: "COQUE_CHASSIS",
    description: "Coques, châssis et structures de téléphones.",
  },
  {
    name: "Films de protection",
    code: "PROTECTION",
    description: "Films hydrogel et protections d'écran.",
  },
  {
    name: "Composants électroniques",
    code: "COMPOSANT_ELECTRONIQUE",
    description: "Composants électroniques pour la réparation.",
  },
  {
    name: "Outils de réparation",
    code: "OUTIL",
    description: "Outils et équipements de réparation.",
  },
  {
    name: "Autres",
    code: "AUTRE",
    description: "Articles ne correspondant à aucune autre catégorie.",
  },
];

const seedCategories = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("La variable MONGODB_URI est absente du fichier .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connexion à MongoDB réussie.");

    for (const item of categories) {
      await Category.updateOne(
        { code: item.code },
        {
          $set: {
            name: item.name,
            description: item.description,
            isActive: true,
          },
          $setOnInsert: {
            code: item.code,
          },
        },
        { upsert: true, runValidators: true }
      );

      console.log(`Catégorie traitée : ${item.name}`);
    }

    console.log("Préremplissage des catégories terminé.");
  } catch (error) {
    console.error("Erreur lors du préremplissage :", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCategories();
