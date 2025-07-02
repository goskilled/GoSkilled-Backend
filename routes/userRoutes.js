const express = require('express');
const { getUserDetails, getAllUserDetails, getReferralTree, getLeaderboardUsers, checkReferralLink, userKycDetails } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected route
router.get('/me/goskilled97/getdetails/data0989/:id', protect, getUserDetails);

router.get('/allUsers', getAllUserDetails);

router.get('/kyc/:id', userKycDetails);

router.get('/referrals/:userId', getReferralTree);

router.get('/leaderboard', getLeaderboardUsers)

router.get('/check-referrals/:code/:id', checkReferralLink)

module.exports = router;
