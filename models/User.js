const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true
  },
  mobileVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  userLevel: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  wallet: {
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 }
  },
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  kycDetails: {
    documentType: String,
    addressProofDocument: String,
    panCard: String,
    panNumber: String,
    bankName: String,
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    bankDocument: String,
    submissionDate: Date,
    approvalDate: Date,
    rejectionReason: String
  },
  purchasedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: Date,
  otpData: {
    otp: String,
    expiresAt: Date
  }
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate unique referral code if not already set
    if (!this.referralCode) {
      this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate OTP
UserSchema.methods.generateOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP expiration (15 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  // Save OTP data to user
  this.otpData = {
    otp,
    expiresAt
  };
  
  return otp;
};

// Method to verify OTP
UserSchema.methods.verifyOTP = function(enteredOTP) {
  // Check if OTP exists and is not expired
  if (!this.otpData || !this.otpData.otp || new Date() > this.otpData.expiresAt) {
    return false;
  }
  
  // Check if OTP matches
  return this.otpData.otp === enteredOTP;
};

module.exports = mongoose.model('User', UserSchema);