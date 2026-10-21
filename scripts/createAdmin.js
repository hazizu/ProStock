require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const User = require("../src/models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminExists = await User.exists({ role: "ADMIN" });

    if (adminExists) {
      console.log("Un administrateur existe déjà.");
      return;
    }

    const name = (await ask("Nom de l'administrateur : ")).trim();
    const email = (
      await ask("Email de l'administrateur : ")
    ).trim().toLowerCase();
    const password = await ask(
      "Mot de passe (12 caractères minimum) : "
    );

    if (
      !name ||
      !email ||
      password.length < 12
    ) {
      throw new Error("Informations invalides.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "Cette adresse email est déjà utilisée par un autre compte."
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    console.log("Administrateur créé avec succès.");
  } catch (error) {
    console.error("Création impossible :", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();