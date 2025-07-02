const express = require('express');
const {
  register,
  verifyOTP,
  login,
  requestLoginOTP,
  loginWithOTP,
  getMe,
  resendOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/request-login-otp', requestLoginOTP);
router.post('/login-with-otp', loginWithOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;