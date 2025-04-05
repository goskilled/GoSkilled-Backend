const User = require('../models/User');

// Update bank details
exports.updateBankDetails = async (req, res, next) => {
  try {
    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;
    
    // Basic validation
    if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required bank details'
      });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update KYC details - bank information
    user.kycDetails = {
      ...user.kycDetails,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId: upiId || user.kycDetails?.upiId
    };
    
    // If no KYC submission date is set, set it now
    if (!user.kycDetails.submissionDate) {
      user.kycDetails.submissionDate = Date.now();
    }
    
    // If KYC status is not submitted, update it
    if (user.kycStatus === 'not_submitted') {
      user.kycStatus = 'pending';
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: {
        bankDetails: {
          bankName: user.kycDetails.bankName,
          accountHolderName: user.kycDetails.accountHolderName,
          accountNumber: user.kycDetails.accountNumber,
          ifscCode: user.kycDetails.ifscCode,
          upiId: user.kycDetails.upiId
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, whatsappNumber } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user fields if provided
    if (name) user.name = name;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get bank details
exports.getBankDetails = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        bankDetails: {
          bankName: user.kycDetails?.bankName || '',
          accountHolderName: user.kycDetails?.accountHolderName || '',
          accountNumber: user.kycDetails?.accountNumber || '',
          ifscCode: user.kycDetails?.ifscCode || '',
          upiId: user.kycDetails?.upiId || ''
        },
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    next(error);
  }
};