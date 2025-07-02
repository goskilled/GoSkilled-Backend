const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  courseType: {
    type: String,
    enum: ['skill', 'career'],
  },
  screenshot: {
    type: String,
    required: true,
  },
  imagePublicId: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: Date,
});

// Custom pre-validation to enforce rules based on courseType
PaymentRequestSchema.pre('validate', function (next) {
  if (this.courseType === 'career' && (!this.course || this.course.length === 0)) {
    return next(new Error('Course is required for Career Booster package.'));
  }
  next();
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);