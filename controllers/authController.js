const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTP } = require("../utils/otpUtil");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobileNumber, password, referralCode } = req.body;

    console.log(req.body);

    // Check if required fields are provided
    if (!name || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if referral code is provided
    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required for registration",
      });
    }

    // Check if user with email or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or mobile number already exists",
      });
      return
    }

    // Find referring user by referral code
    const referringUser = await User.findOne({ referralCode });
    if (!referringUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      mobileNumber,
      password,
      referredBy: referringUser?._id,
    });

    // Generate OTP for mobile verification
    const otp = user.generateOTP();

    // Send OTP to user's mobile
    const otpSent = await sendOTP(mobileNumber, otp);

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    // Save user
    await user.save();

    // Return success response without token (user needs to verify OTP first)
    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please verify your mobile number with the OTP sent.",
      data: {
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    console.log("This is the verify otp", mobileNumber, otp);
    // Check if userId and OTP are provided
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile Number and OTP are required",
      });
    }

    // Find user by ID
    const user = await User.findOne({ mobileNumber: mobileNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Update user's mobile verification status
    user.mobileVerified = true;
    user.otpData = undefined; // Clear OTP data

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response with token
    res.status(200).json({
      success: true,
      message: "Mobile number verified successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          referralCode: user.referralCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login with password
exports.login = async (req, res, next) => {
  try {
    const { mobileNumber, email, password } = req.body;

    // Check if mobile and password are provided
    if ((!mobileNumber && !password) || (!email && !password)) {
      return res.status(400).json({
        success: false,
        message: "Please provide Mobile Number/Email and password",
      });
    }

    // Find user by mobile number
    const user = await User.findOne({
      $or: [
        {
          email: email,
        },
        { mobileNumber: mobileNumber },
      ],
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          referralCode: user.referralCode,
          userLevel: user.userLevel,
          wallet: user.wallet,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Request OTP for login
exports.requestLoginOTP = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

    // Check if mobile number is provided
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      console.error("User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP
    const otp = user.generateOTP();

    // Send OTP to user's mobile
    const otpSent = await sendOTP(mobileNumber, otp);

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    // Save user with OTP data
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login with OTP
exports.loginWithOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Check if userId and OTP are provided
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP data
    user.otpData = undefined;

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          referralCode: user.referralCode,
          userLevel: user.userLevel,
          wallet: user.wallet,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          mobileVerified: user.mobileVerified,
          whatsappNumber: user.whatsappNumber,
          whatsappVerified: user.whatsappVerified,
          referralCode: user.referralCode,
          userLevel: user.userLevel,
          wallet: user.wallet,
          kycStatus: user.kycStatus,
          registrationDate: user.registrationDate,
          purchasedCourses: user.purchasedCourses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOTP = async (req, res, next) => {
  try {
    const { userId, type } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if type is provided (verification or login)
    if (!type || !["verification", "login"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Valid type is required (verification or login)",
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if we're trying to verify an already verified number
    if (type === "verification" && user.mobileVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is already verified",
      });
    }

    // Check if OTP was recently sent (within last 1 minute) to prevent abuse
    if (user.otpData && user.otpData.expiresAt) {
      const lastOtpTime = new Date(user.otpData.expiresAt);
      lastOtpTime.setMinutes(lastOtpTime.getMinutes() - 15); // Original expiry is 15 min, so go back to sent time

      const currentTime = new Date();
      const diffInMinutes = Math.floor(
        (currentTime - lastOtpTime) / (1000 * 60)
      );

      if (diffInMinutes < 1) {
        return res.status(429).json({
          success: false,
          message: "Please wait 1 minute before requesting another OTP",
          data: {
            retryAfterSeconds: 60 - diffInMinutes * 60,
          },
        });
      }
    }

    // Generate new OTP
    const otp = user.generateOTP();

    // Send OTP to user's mobile
    const otpSent = await sendOTP(user.mobileNumber, otp);

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    // Save user with updated OTP data
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: {
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send email verification
exports.sendEmailVerification = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();

    // Save user with token
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(
      user.email,
      verificationToken
    );

    if (!emailSent) {
      // Reset token if email failed to send
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};
