const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom de la permission est requis"],
    unique: true,
    trim: true
    // Exemples : "create_workflow", "delete_user", "view_dashboard"
  },
  category: {
    type: String,
    required: true,
    enum: ["users", "roles", "workflows", "forms", "execution", "ai", "supervision", "notifications", "files", "audit"]
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
module.exports = mongoose.model("Permission", permissionSchema);