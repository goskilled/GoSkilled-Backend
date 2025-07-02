const mongoose = require('mongoose');

const WithdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 500,
    max: 25000
  },
  status: {
    type: String,
    enum: ['In Progress', 'Paid'],
    default: 'In Progress'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  adminRemarks: {
    type: String
  }
});

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);