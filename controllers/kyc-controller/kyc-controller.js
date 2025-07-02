const User = require("../../models/User");

exports.submitKycDetailsUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const {
            whatsAppNumber,
            documentType,
            addressProofDocument,
            panCard,
            panNumber,
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            upiId,
            bankDocument,
            documentNumber,
            bankDocumentType
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.kycDetails = {
            whatsAppNumber,
            documentType,
            documentNumber,
            addressProofDocument: addressProofDocument?.url,
            addressProofDocumentUniqueId: addressProofDocument?.uniqueId,
            panCard: panCard?.url,
            panCardUniqueId: panCard?.uniqueId,
            panNumber,
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            upiId,
            bankDocumentType,
            bankDocument: bankDocument?.url,
            bankDocumentUniqueId: bankDocument?.uniqueId,
            submissionDate: new Date(),
            rejectionReason: ''
        };

        user.kycStatus = 'pending';

        await user.save();

        res.status(200).json({ success: true, message: 'KYC submitted successfully' });
    } catch (error) {
        console.error("KYC Submission Error:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// GET pending KYC submissions
exports.getKycSubmissions = async (req, res) => {
    try {
        const usersWithKyc = await User.find({
            kycStatus: { $in: ['pending', 'approved', 'rejected'] }
        }).select('-password');

        res.status(200).json(usersWithKyc);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT approve KYC
exports.approveKyc = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.kycStatus = 'approved';
        user.kycDetails.approvalDate = new Date();
        user.kycDetails.rejectionReason = '';

        await user.save();

        res.status(200).json({ message: 'KYC approved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT reject KYC
exports.rejectKyc = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.kycStatus = 'rejected';
        user.kycDetails.rejectionReason = reason;
        user.kycDetails.approvalDate = null;

        await user.save();

        res.status(200).json({ message: 'KYC rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resetKYCDetails = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { $unset: { kycDetails: "" }, $set: { kycStatus: "not_submitted" } },
            { new: true }
        );
        if (!updatedUser) return res.status(404).send('User not found');
        res.status(200).json({ message: 'KYC reset successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
