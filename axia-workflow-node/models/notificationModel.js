const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['workflow_started', 'step_assigned', 'step_completed', 'step_rejected', 'workflow_completed', 'reminder'],
    required: true,
  },
  title:          { type: String, required: true },
  message:        { type: String, required: true },
  recipient:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientEmail: { type: String },
  workflowId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  stepIndex:      { type: Number },
  isRead:         { type: Boolean, default: false },
  isSent:         { type: Boolean, default: false },
  sentAt:         { type: Date },
}, { timestamps: true });

module.exports = {
  schema: notificationSchema
};