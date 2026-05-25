const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  schema: postSchema
};