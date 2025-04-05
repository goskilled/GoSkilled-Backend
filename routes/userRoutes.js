const express = require('express');
const {
  updateBankDetails,
  updateProfile,
  getBankDetails
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.put('/bank-details', updateBankDetails);
router.put('/profile', updateProfile);
router.get('/bank-details', getBankDetails);

module.exports = router;