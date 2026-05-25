const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String },

  workflow:      { type: mongoose.Schema.Types.ObjectId, ref: "Workflow" },
  project:       { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  stepIndex:     { type: Number },
  fieldId:       { type: String },

  originalName:  { type: String, required: true },
  filename:      { type: String, required: true },
  mimetype:      { type: String, required: true },
  size:          { type: Number },
  url:           { type: String },
  path:          { type: String },

  type: {
    type:    String,
    enum:    ["image", "video", "pdf", "document", "other"],
    default: "other",
  },

  uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedByName: { type: String },

}, { timestamps: true });
module.exports = {
  schema: documentSchema
};