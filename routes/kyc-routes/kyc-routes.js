const express = require('express');
const { approveKyc, rejectKyc, submitKycDetailsUser, resetKYCDetails, getKycSubmissions } = require('../../controllers/kyc-controller/kyc-controller');
const router = express.Router();

// Route to submit the kyc details
router.post('/submit/:userId', submitKycDetailsUser)

// Route to get all pending KYC users
router.get('/admin/kyc-submissions', getKycSubmissions);

// Route to approve a user's KYC
router.put('/admin/approve/:userId', approveKyc);

// Route to reject a user's KYC
router.put('/admin/reject/:userId', rejectKyc);

// Route to reset the kyc details
router.post('/reset-kyc/:userId', resetKYCDetails);

module.exports = router;
