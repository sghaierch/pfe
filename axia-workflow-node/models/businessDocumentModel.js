const mongoose = require('mongoose');

const ligneSchema = new mongoose.Schema({
  article:   { type: String, required: true },
  quantite:  { type: Number, required: true },
  unite:     { type: String, default: '' },
  info:      { type: String, default: '' },
});

const businessDocumentSchema = new mongoose.Schema({

  // Numéro auto — ex: DA26001, DAC26001, BS26001
  number:   { type: String, unique: true },
  type:     { type: String, enum: ['DA','DAC','BS','DF','BR'], required: true },
  statut:   { type: String, enum: ['brouillon','en_cours','validé','rejeté'], default: 'brouillon' },

  // Entête
  demandeur:  { type: String },
  depot:      { type: String },
  priorite:   { type: String, enum: ['basse','normale','haute','urgente'], default: 'normale' },
  commentaire:{ type: String },

  // Lignes articles
  lignes: [ligneSchema],

  // Lien vers le workflow qui gère ce document
  workflow:   { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },

  // Traçabilité de la chaîne documentaire
  parentDoc:  { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDocument' },
  rootDoc:    { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessDocument' },

  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String },

}, { timestamps: true });

module.exports = { schema: businessDocumentSchema };