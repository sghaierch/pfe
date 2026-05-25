const mongoose = require('mongoose');

// ── Schéma d'une colonne de tableau ──────────────────────────────────────────
const tableColumnSchema = new mongoose.Schema({
  id:       { type: String },
  label:    { type: String, required: true },
  type:     { type: String, enum: ['text', 'number'], default: 'text' },
  required: { type: Boolean, default: false },
  width:    { type: String, default: 'auto' },
}, { _id: false });

// ── Schéma d'une ligne de tableau (données saisies par l'employé) ─────────────
const tableRowSchema = new mongoose.Schema({
  // Clé dynamique → stocké comme objet clé/valeur
  // Ex : { col_article: "PC HP", col_quantite: 2 }
}, { strict: false, _id: false });

const stepSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  description:      { type: String },
  order:            { type: Number, required: true },
  assignedTo:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName:   { type: String, default: '' },
  assignedRole:     { type: String },
  assignedPost:     { type: String },
  assignedPostName: { type: String, default: '' },
  delai:            { type: String, default: '' },

  form: {
    fields: [{
      id:       { type: String, required: true },
      label:    { type: String, required: true },
      // ✅ NOUVEAU : 'table', 'auto_number', 'auto_user', 'auto_status' ajoutés
      type: {
        type: String,
        enum: [
          'text', 'number', 'date', 'select', 'file', 'checkbox', 'textarea', 'signature',
          'table',        // ← TABLEAU DYNAMIQUE (Article / Quantité / ...)
          'auto_number',  // ← Numéro de document auto-généré (lecture seule)
          'auto_user',    // ← Nom de l'utilisateur connecté (lecture seule)
          'auto_status',  // ← Statut du document (lecture seule, géré par le système)
        ],
        default: 'text',
      },
      required:   { type: Boolean, default: false },
      options:    [{ type: String }],
      readOnly:   { type: Boolean, default: false },
      autoSource: { type: String, default: '' },

      // ✅ Pour type='table' : définition des colonnes
      columns: [tableColumnSchema],

   // ✅ Valeur unique du champ
    // text => string
    // checkbox => boolean
    // table => array
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    }],
  },

  checklist: [{
    id:       { type: String },
    label:    { type: String, required: true },
    checked:  { type: Boolean, default: false },
    required: { type: Boolean, default: false },
  }],

  conditions: [{
    field:    { type: String },
    operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater', 'less'] },
    value:    { type: mongoose.Schema.Types.Mixed },
  }],

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
  },

  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment:     { type: String },

  claims: {
    canValidate: { type: Boolean, default: true },
    canReject:   { type: Boolean, default: true },
    canModify:   { type: Boolean, default: false },
    canView:     { type: Boolean, default: true },
  },
}, { timestamps: true });

const workflowSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  isTemplate:  {  type: Boolean,default: false,},
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  docType: { type: String, enum: ['', 'DA', 'DAC', 'BS', 'DF', 'BR'], default: '' },
  businessDoc: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDocument' },
  rootDoc:     { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDocument' },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived', 'rejected'],
    default: 'draft',
  },

  currentStep:  { type: Number, default: 0 },
  steps:        [stepSchema],
  canvasNodes:  { type: Array, default: [] },
  canvasEdges:  { type: Array, default: [] },

  history: [{
    action:    { type: String },
    stepIndex: { type: Number },
    stepName:  { type: String },
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName:    { type: String },
    comment:   { type: String },
    date:      { type: Date, default: Date.now },
  }],

  startedAt:   { type: Date },
  completedAt: { type: Date },
  dueDate:     { type: Date },

  visibility:   { type: String, enum: ['global', 'restricted'], default: 'global' },
  allowedRoles: [{ type: String }],
  allowedPosts: [{ type: String }],
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

module.exports = {
  schema: workflowSchema,
};