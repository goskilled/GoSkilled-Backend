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
  referralLevels: {
    level1: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    level2: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    level3: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  purchasedPackages: {
    skillBuilder: { type: Boolean, default: false },
    careerBooster: { type: Boolean, default: false }
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
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }
  ],
  priceHistory: [
    {
      amount: Number,
      courseType: { type: String, enum: ['skill', 'career'] },
      purchasedDate: Date,
      purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // referred user
    }
  ],
  courseHistory: [
    {
      serialNo: Number,
      date: Date,
      courseType: { type: String, enum: ['skill', 'career'] },
      courses: [
        {
          courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
          courseTitle: String
        }
      ]
    }
  ],
  kycDetails: {
    whatsAppNumber: { type: String },

    documentType: { type: String },
    documentNumber: { type: String },
    addressProofDocument: { type: String },
    addressProofDocumentUniqueId: { type: String },

    panNumber: { type: String },
    panCard: { type: String },
    panCardUniqueId: { type: String },

    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },

    bankDocumentType: { type: String },
    bankDocument: { type: String },
    bankDocumentUniqueId: { type: String },

    submissionDate: { type: Date },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
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

// Pre-save middleware to hash password and generate referral code
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // Generate unique referral code starting with "GS"
    if (!this.referralCode) {
      let isUnique = false;
      let code;
      const User = mongoose.model('User'); // Avoid circular dependency

      while (!isUnique) {
        code = 'GS' + crypto.randomBytes(3).toString('hex').toUpperCase(); // GS + 6-char random hex
        const existingUser = await User.findOne({ referralCode: code });
        if (!existingUser) isUnique = true;
      }

      this.referralCode = code;
    }

    next();
  } catch (error) {
    next(error);
  }
});


// Method to check if password matches
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate OTP
UserSchema.methods.generateOTP = function () {
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
UserSchema.methods.verifyOTP = function (enteredOTP) {
  // Check if OTP exists and is not expired
  if (!this.otpData || !this.otpData.otp || new Date() > this.otpData.expiresAt) {
    return false;
  }

  // Check if OTP matches
  return this.otpData.otp === enteredOTP;
};

module.exports = mongoose.model('User', UserSchema);