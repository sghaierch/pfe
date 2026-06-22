const mongoose = require('mongoose');

const documentTypeSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  prefix:          { type: String, required: true, trim: true, uppercase: true },
  digits:          { type: Number, default: 3, min: 2, max: 6 },
  counter:         { type: Number, default: 0 },
  description:     { type: String, trim: true },
  defaultWorkflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

// ── Unicité au niveau base de données ──────────────────────────────────────
// Empêche deux types actifs de partager le même nom ou le même préfixe,
// même en cas d'appels concurrents (le check applicatif seul ne suffit pas).
documentTypeSchema.index(
  { prefix: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
documentTypeSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = { schema: documentTypeSchema };