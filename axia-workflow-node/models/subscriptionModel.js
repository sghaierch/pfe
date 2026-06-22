const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  plan:   { type: mongoose.Schema.Types.ObjectId, ref: 'Plan',   required: true },

  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'rejected', 'suspended'],
    default: 'pending'
  },

  // ✅ Durée choisie par l'entreprise
  durationMonths: { type: Number, default: 1 },

  startDate:  { type: Date },
  endDate:    { type: Date },

  requestMessage:  { type: String },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  rejectedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt:      { type: Date },
  rejectionReason: { type: String },
  stripePaymentIntentId: { type: String,index: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
