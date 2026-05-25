const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({

  // ✅ Déclencheurs configurables — admin choisit quoi activer
  triggers: {
    step_assigned: {
      email: { type: Boolean, default: true  },
      push:  { type: Boolean, default: true  },
      label: { type: String,  default: 'Nouvelle tâche assignée' },
    },
    step_completed: {
      email: { type: Boolean, default: true  },
      push:  { type: Boolean, default: true  },
      label: { type: String,  default: 'Étape validée' },
    },
    step_rejected: {
      email: { type: Boolean, default: true  },
      push:  { type: Boolean, default: true  },
      label: { type: String,  default: 'Étape rejetée' },
    },
    workflow_completed: {
      email: { type: Boolean, default: true  },
      push:  { type: Boolean, default: true  },
      label: { type: String,  default: 'Workflow terminé' },
    },
    reminder: {
      email:       { type: Boolean, default: true },
      push:        { type: Boolean, default: false },
      reminderDays:{ type: Number,  default: 2 },
      label:       { type: String,  default: 'Rappel automatique' },
    },
  },

  // ✅ Templates personnalisables par event
  emailTemplates: {
    step_assigned: {
      subject: { type: String, default: '📋 Nouvelle tâche : {{stepName}} — {{workflowName}}' },
      body:    { type: String, default: '' }, // vide = utiliser le template hardcodé
    },
    step_completed: {
      subject: { type: String, default: '✅ Étape validée : {{stepName}} — {{workflowName}}' },
      body:    { type: String, default: '' },
    },
    step_rejected: {
      subject: { type: String, default: '❌ Étape rejetée : {{stepName}} — {{workflowName}}' },
      body:    { type: String, default: '' },
    },
    workflow_completed: {
      subject: { type: String, default: '🎉 Workflow terminé : {{workflowName}}' },
      body:    { type: String, default: '' },
    },
    reminder: {
      subject: { type: String, default: '⏰ Rappel : {{workflowName}} — {{stepName}}' },
      body:    { type: String, default: '' },
    },
  },

  // ✅ Signature email
  emailSignature: {
    type: String,
    default: '<p style="color:#94a3b8;font-size:12px;">© Axia Workflow</p>',
  },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

module.exports = {
  schema: notificationSettingsSchema
};