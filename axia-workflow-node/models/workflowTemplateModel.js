const mongoose = require('mongoose');

// ── Colonnes tableau ─────────────────────────────
const tableColumnSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  label:    { type: String, required: true },
  type:     { type: String, enum: ['text', 'number', 'date'], default: 'text' },
  required: { type: Boolean, default: false },
  width:    { type: String, default: 'auto' },
}, { _id: false });

// ── Schéma d'un champ ────────────────────────────
const fieldSchema = new mongoose.Schema({
  id:         { type: String, required: true },
  label:      { type: String, required: true },
  type: {
    type: String,
    enum: [
      'text', 'number', 'date', 'select', 'textarea',
      'file', 'checkbox', 'signature', 'table',
      'auto_number', 'auto_user', 'auto_status',
    ],
    default: 'text',
  },
  required:         { type: Boolean, default: false },
  readOnly:         { type: Boolean, default: false },
  autoSource:       { type: String,  default: '' },
  options:          { type: [String], default: [] },
  columns:          { type: [tableColumnSchema], default: [] },
  inheritTableFrom: { type: String,  default: '' },
  extraColumns:     { type: [tableColumnSchema], default: [] },
}, { _id: false });

// ── Étapes template ──────────────────────────────
const templateStepSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  description:      { type: String, default: '' },
  order:            { type: Number, required: true },
  postSlot:         { type: String, default: '' },
  assignedPost:     { type: String, default: '' },
  assignedPostName: { type: String, default: '' },
  rempliPar:        { type: String, default: 'employe' },
  delai:            { type: Number, default: 0 },
  form: {
    fields: { type: [fieldSchema], default: [] },
  },
  checklist: [{
    id:       { type: String },
    label:    { type: String, required: true },
    required: { type: Boolean, default: false },
    checked:  { type: Boolean, default: false },
  }],
  claims: {
    canValidate: { type: Boolean, default: true },
    canReject:   { type: Boolean, default: true },
    canModify:   { type: Boolean, default: false },
    canView:     { type: Boolean, default: true },
  },
}, { _id: false });

// ── Workflow Template ────────────────────────────
const workflowTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['validation_confirmation', 'confirmation_only', 'automatic'],
    required: true,
  },

  // ✅ FIX : docType est maintenant une référence vers DocumentType (collection dynamique)
  // Plus d'enum String fixe ['DA','DAC','BS','DF','BR'] — l'admin crée ses propres types
  docType: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'DocumentType',
    default: null,
  },

  fields: {
    type: [fieldSchema],
    default: [],
  },

  steps: [templateStepSchema],

  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = {
  schema: workflowTemplateSchema,
};