const User = require('../../models/User');
const Wallet = require('../../models/Wallet');

const getWalletDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('wallet');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const history = await Wallet.find({ userId: user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            wallet: user.wallet,
            history,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching wallet details' });
    }
};

// Apply for Withdrawal
const applyWithdraw = async (req, res) => {
    try {
        const userId = req.params.id;
        const { amount } = req.body;


        // Validate amount range
        if (amount < 500 || amount > 25000) {
            return res.status(400).json({ message: "Amount must be between ₹500 and ₹25,000." });
        }

        // Fetch user and check balance
        const user = await User.findById(userId);
        if (!user || user.wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance." });
        }

        const existing = await Wallet.findOne({ userId, status: 'In Progress' });
        if (existing) {
            return res.status(400).json({ message: "You already have a pending withdrawal request." });
        }


        // Create withdrawal request
        const withdraw = new Wallet({
            userId,
            amount
        });

        // Deduct balance and update stats
        user.wallet.balance -= amount;
        user.wallet.totalWithdrawn += amount;

        // Save both
        await user.save();
        await withdraw.save();

        return res.status(200).json({
            message: "Withdrawal request submitted successfully.",
            withdraw
        });

    } catch (err) {
        console.error("Withdrawal Error:", err);
        return res.status(500).json({ message: "Server error while processing withdrawal." });
    }
};

// Get Withdrawal History
const getWithdrawHistory = async (req, res) => {
    try {
        const userId = req.params.id;
        const history = await Wallet.find({ userId }).sort({ requestedAt: -1 });
        return res.json(history);
    } catch (err) {
        console.error("History Fetch Error:", err);
        return res.status(500).json({ message: "Unable to fetch withdrawal history." });
    }
};


const updateWithdrawStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminRemarks } = req.body;

        if (!['In Progress', 'Paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await Wallet.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        request.status = status;
        if (status === 'Paid') {
            request.processedAt = new Date();
        }
        if (adminRemarks) {
            request.adminRemarks = adminRemarks;
        }

        await request.save();
        res.status(200).json({ message: 'Withdrawal status updated successfully.', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while updating withdrawal status.' });
    }
};

const getAllWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Wallet.find()
            .populate('userId', 'name email mobileNumber')
            .sort({ requestedAt: -1 });

        res.json(withdrawals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching withdrawals.' });
    }
};

module.exports = {
    applyWithdraw,
    getWithdrawHistory,
    updateWithdrawStatus,
    getAllWithdrawals,
    getWalletDetails
};
