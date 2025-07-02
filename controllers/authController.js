const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTP } = require("../utils/otpUtil");

// Helper: Send response
const sendResponse = (res, statusCode, success, message, data = {}) =>
  res.status(statusCode).json({ success, message, data });

// Helper: Generate JWT token
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });

// ------------------------
// Register a new user
// ------------------------
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobileNumber, password, referralCode } = req.body;

    if (!name || !email || !mobileNumber || !password) {
      return sendResponse(res, 400, false, "Please provide all required fields");
    }

    if (!referralCode) {
      return sendResponse(res, 400, false, "Referral code is required for registration");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (existingUser) {
      return sendResponse(res, 400, false, "User with this email or mobile number already exists");
    }

    const referringUser = await User.findOne({ referralCode });
    if (!referringUser) {
      return sendResponse(res, 400, false, "Invalid referral code");
    }

    const user = new User({
      name,
      email,
      mobileNumber,
      password,
      referredBy: referringUser._id,
    });

    const otp = user.generateOTP();
    const otpSent = await sendOTP(mobileNumber, otp);

    if (!otpSent) {
      return sendResponse(res, 500, false, "Failed to send OTP");
    }

    await user.save();
    await updateReferralLevels(user._id, referringUser._id);

    return sendResponse(res, 201, true, "User registered successfully. Please verify your mobile number with the OTP sent.", {
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

async function updateReferralLevels(newUserId, referringUserId) {
  const level1User = await User.findById(referringUserId);
  if (!level1User) return;

  await User.findByIdAndUpdate(level1User._id, {
    $addToSet: { 'referralLevels.level1': newUserId }
  });

  if (level1User.referredBy) {
    const level2User = await User.findById(level1User.referredBy);
    if (level2User) {
      await User.findByIdAndUpdate(level2User._id, {
        $addToSet: { 'referralLevels.level2': newUserId }
      });

      if (level2User.referredBy) {
        const level3User = await User.findById(level2User.referredBy);
        if (level3User) {
          await User.findByIdAndUpdate(level3User._id, {
            $addToSet: { 'referralLevels.level3': newUserId }
          });
        }
      }
    }
  }
}

// ------------------------
// Verify OTP
// ------------------------
exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return sendResponse(res, 400, false, "Mobile Number and OTP are required");
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (!user.verifyOTP(otp)) {
      return sendResponse(res, 400, false, "Invalid or expired OTP");
    }

    user.mobileVerified = true;
    user.otpData = undefined;
    await user.save();

    const token = generateToken(user._id);

    return sendResponse(res, 200, true, "Mobile number verified successfully", {
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------
// Login with Email/Mobile + Password
// ------------------------
exports.login = async (req, res, next) => {
  try {
    const { mobileNumber, email, password } = req.body;

    if ((!mobileNumber && !email) || !password) {
      return sendResponse(res, 400, false, "Please provide Mobile Number/Email and password");
    }

    const user = await User.findOne({ $or: [{ email }, { mobileNumber }] }).select("+password");
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    return sendResponse(res, 200, true, "Login successful", {
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------
// Request OTP for Login
// ------------------------
exports.requestLoginOTP = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return sendResponse(res, 400, false, "Mobile number is required");
    }

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    const otp = user.generateOTP();
    const otpSent = await sendOTP(mobileNumber, otp);

    if (!otpSent) {
      return sendResponse(res, 500, false, "Failed to send OTP");
    }

    await user.save();
    return sendResponse(res, 200, true, "OTP sent successfully", { userId: user._id });
  } catch (error) {
    next(error);
  }
};

// ------------------------
// Login with OTP
// ------------------------
exports.loginWithOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return sendResponse(res, 400, false, "User ID and OTP are required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (!user.verifyOTP(otp)) {
      return sendResponse(res, 400, false, "Invalid or expired OTP");
    }

    user.otpData = undefined;
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    return sendResponse(res, 200, true, "Login successful", {
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------
// Get Current User Profile
// ------------------------
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return sendResponse(res, 200, true, "User profile fetched", {
      user
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------
// Resend OTP
// ------------------------
exports.resendOTP = async (req, res, next) => {
  try {
    const { userId, type } = req.body;

    if (!userId) {
      return sendResponse(res, 400, false, "User ID is required");
    }

    if (!["verification", "login"].includes(type)) {
      return sendResponse(res, 400, false, "Valid type is required (verification or login)");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (type === "verification" && user.mobileVerified) {
      return sendResponse(res, 400, false, "Mobile number is already verified");
    }

    if (user.otpData?.expiresAt) {
      const lastOtpSentTime = new Date(user.otpData.expiresAt);
      lastOtpSentTime.setMinutes(lastOtpSentTime.getMinutes() - 15);

      const now = new Date();
      const diff = Math.floor((now - lastOtpSentTime) / 1000);

      if (diff < 60) {
        return sendResponse(res, 429, false, "Please wait 1 minute before requesting another OTP", {
          retryAfterSeconds: 60 - diff,
        });
      }
    }

    const otp = user.generateOTP();
    const otpSent = await sendOTP(user.mobileNumber, otp);

    if (!otpSent) {
      return sendResponse(res, 500, false, "Failed to send OTP");
    }

    await user.save();
    return sendResponse(res, 200, true, "OTP resent successfully");
  } catch (error) {
    next(error);
  }
};
