const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom du projet est requis"],
    trim: true
  },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ["active", "archived", "completed"],
    default: "active"
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role:       { type: String, enum: ["owner", "manager", "member"], default: "member" },
    joinedAt:   { type: Date, default: Date.now }
  }],
  color: { type: String, default: "#4f46e5" },
}, { timestamps: true });


module.exports = projectSchema;