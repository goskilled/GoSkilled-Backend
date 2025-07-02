const express = require('express');
const {
    applyWithdraw,
    getWithdrawHistory,
    updateWithdrawStatus,
    getAllWithdrawals,
    getWalletDetails
} = require('../../controllers/wallet-controller/walletController');

const router = express.Router();


// User routes
router.post('/withdraw/:id', applyWithdraw);
router.get('/history/:id', getWithdrawHistory);
router.get('/details/:id', getWalletDetails);

// Admin routes
router.put('/status/:id', updateWithdrawStatus);
router.get('/all', getAllWithdrawals);

module.exports = router;
