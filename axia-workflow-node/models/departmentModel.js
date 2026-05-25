const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
}, { timestamps: true });

const departmentSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  posts: [postSchema],
}, { timestamps: true });

module.exports = {
  schema: departmentSchema
};