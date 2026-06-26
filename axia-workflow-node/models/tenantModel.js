const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String, required: true, trim: true, unique: true
  },
  matriculeFiscal: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
  },
  slug: {
    type: String, required: true, unique: true, lowercase: true
  },
  contactEmail: {
    type: String, required: true, lowercase: true, trim: true
  },
  contactPhone: String,
  sector:          { type: String },
  employeesCount:  { type: String },
  address:         { type: String },

  adminFirstName: { type: String, required: true },
  adminLastName:  { type: String, required: true },
  adminEmail: {
    type: String, required: true, lowercase: true, unique: true
  },
  adminPassword: { type: String },
  adminPasswordPlain: { type: String, select: false },  dbName: { type: String, required: true, unique: true },

  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'cancelled', 'expired', 'rejected'],
    default: 'pending'
  },

  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },

  limits: {
    maxUsers:     { type: Number, default: 10 },
    maxWorkflows: { type: Number, default: 50 },
    maxStorage:   { type: Number, default: 5 },
    maxProjects:  { type: Number, default: 3 },
    hasAI:        { type: Boolean, default: false },
    hasAnalytics: { type: Boolean, default: false },
  },

  subscription: {
    startDate:      { type: Date },
    endDate:        { type: Date },
    durationMonths: { type: Number, default: 1 },
    isActive:       { type: Boolean, default: false },
    autoRenew:      { type: Boolean, default: false },
  },

  isActive: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

tenantSchema.pre('save', async function () {
  if (!this.slug && this.companyName) {
    this.slug = this.companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  if (!this.dbName && this.slug) {
    this.dbName = `tenant_${this.slug}`;
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);