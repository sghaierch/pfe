const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom du plan est requis"],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, "Le prix est requis"],
    min: 0
  },
  billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly"
  },
  description: { type: String, trim: true },
  features:    [{ type: String, trim: true }],
  maxUsers:     { type: Number, default: 5 },
  maxWorkflows: { type: Number, default: 10 },
  isActive:     { type: Boolean, default: true },
  isPopular:    { type: Boolean, default: false },
  color:        { type: String, default: "#4f46e5" },
  order:        { type: Number, default: 0 },
  durationMonths: { type: Number, default: 1 },  // durée en mois
  hasAI:          { type: Boolean, default: false },
  hasAdvancedForms: { type: Boolean, default: false },
  hasAnalytics:   { type: Boolean, default: false },
  hasAPIAccess:   { type: Boolean, default: false },
  hasSSO:         { type: Boolean, default: false },
  hasSMSNotif:    { type: Boolean, default: false },
  historyDays:    { type: Number, default: 30 },
  maxProjects:    { type: Number, default: 3 },
}, { timestamps: true });
module.exports = mongoose.model("Plan", planSchema);