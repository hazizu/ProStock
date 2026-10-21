const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    compatibleModels: {
      type: [String],
      default: [],
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "La quantité doit être un nombre entier.",
      },
    },

    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);