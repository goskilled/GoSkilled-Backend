const express = require('express');

const { paymentSubmit, paymentRequest, paymentVerify, checkPaymentStatus, checkIfUserHasPendingPayment } = require('../../controllers/payment-controller/PaymentUploadController.js');

const router = express.Router();


router.post('/submit', paymentSubmit);

router.post('/check-status', checkPaymentStatus)

router.get('/requests', paymentRequest);

router.put('/verify/:id', paymentVerify);

router.get('/check-pending/:userId', checkIfUserHasPendingPayment);

module.exports = router;
