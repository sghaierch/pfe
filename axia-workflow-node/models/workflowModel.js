const mongoose = require('mongoose');

// ── Schéma d'une colonne de tableau ──────────────────────────────────────────
const tableColumnSchema = new mongoose.Schema({
  id:       { type: String },
  label:    { type: String, required: true },
  type:     { type: String, enum: ['text', 'number'], default: 'text' },
  required: { type: Boolean, default: false },
  width:    { type: String, default: 'auto' },
}, { _id: false });

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
  documentType: {type: mongoose.Schema.Types.ObjectId, ref: 'DocumentType'},

  // ✅ NOUVEAU — distingue clairement l'étape remplie par l'employé des étapes de validation
  // step.isEmployeeStep = true  → formulaire affiché à l'employé dans EmployeeSubmitRequest
  // step.isEmployeeStep = false → étape assignée à un validateur / confirmateur
  isEmployeeStep: { type: Boolean, default: false },

  form: {
    fields: [{
      id:         { type: String, required: true },
      label:      { type: String, required: true },
      type: {
        type: String,
        enum: [
          'text', 'number', 'date', 'select', 'file', 'checkbox', 'textarea', 'signature',
          'table',
          'auto_number',
          'auto_user',
          'auto_status',
        ],
        default: 'text',
      },
      required:   { type: Boolean, default: false },
      options:    [{ type: String }],
      readOnly:   { type: Boolean, default: false },
      autoSource: { type: String, default: '' },
      columns:    [tableColumnSchema],
      inheritTableFrom: { type: String, default: '' },  // ✅ AJOUTER
      extraColumns:     [tableColumnSchema],             // ✅ AJOUTER
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
  description: { type: String },
  docNumber: { type: String, default: '' },

  // ✅ isTemplate:true  → workflow créé par l'admin, visible dans la liste employé
  // ✅ isTemplate:false → instance réelle créée quand un employé soumet une demande
  isTemplate: { type: Boolean, default: false },

  // ✅ NOUVEAU — référence au template d'origine (traçabilité)
  // Rempli uniquement sur les instances (isTemplate:false)
  templateRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', default: null },

  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  docType: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'DocumentType',
  default: null,
},

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