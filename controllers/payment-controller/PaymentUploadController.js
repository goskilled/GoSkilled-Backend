const PaymentRequestSchema = require("../../models/PaymentRequestSchema.js");
const User = require("../../models/User");

const paymentSubmit = async (req, res) => {
    try {
        const { userId, courseType, courseIds, screenshot, imagePublicId, amountPaid } = req.body;

        if (!Array.isArray(courseIds)) {
            return res.status(400).json({ success: false, error: 'courseId should be an array of course IDs' });
        }

        const newPayment = new PaymentRequestSchema({
            user: userId,
            courseType,
            course: courseIds,
            screenshot,
            imagePublicId,
            amountPaid,
        });

        await newPayment.save();
        res.status(201).json({ success: true, message: 'Payment request for multiple courses submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Something went wrong while submitting payment request' });
    }
};

const paymentRequest = async (req, res) => {
    try {
        const { status = "pending", page = 1, limit = 10 } = req.query;

        const query = status !== "all" ? { status } : {};

        const total = await PaymentRequestSchema.countDocuments(query);
        const payments = await PaymentRequestSchema.find(query)
            .populate("user", "name email")
            .populate("course", "title")
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ submittedAt: -1 });

        res.json({
            payments,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch payment requests" });
    }
}

const paymentVerify = async (req, res) => {
    try {
        const payment = await PaymentRequestSchema.findById(req.params.id)
            .populate('user')
            .populate('course');

        if (!payment) {
            return res.status(404).json({ error: 'Payment request not found' });
        }

        const { status, adminNote } = req.body;
        const user = payment.user;

        if (status === 'approved') {
            // Set package based on course type
            if (payment.courseType === 'skill') {
                user.purchasedPackages.skillBuilder = true;
            } else if (payment.courseType === 'career') {
                user.purchasedPackages.careerBooster = true;
            } else {
                return res.status(400).json({ error: 'Invalid courseType in payment' });
            }

            // Prepare courses array
            const courses = Array.isArray(payment.course) ? payment.course : [payment.course];

            // Update course history
            user.courseHistory = user.courseHistory || [];

            const courseDetails = courses.map(course => ({
                courseId: course._id,
                courseTitle: course.title
            }));

            user.courseHistory.push({
                serialNo: user.courseHistory.length + 1,
                date: new Date(),
                courseType: payment.courseType,
                courses: courseDetails
            });

            // Enroll user in courses
            for (const course of courses) {
                if (!user.enrolledCourses.includes(course._id)) {
                    user.enrolledCourses.push(course._id);
                    user.purchasedCourses.push(course._id);
                }

                const alreadyAdded = course.students.some(
                    s => s.studentId.toString() === user._id.toString()
                );

                if (!alreadyAdded) {
                    course.students.push({
                        studentId: user._id,
                        studentName: user.name,
                        studentEmail: user.email,
                        paidAmount: payment.amountPaid,
                    });
                }

                await course.save();
            }

            // Reward referral chain
            const rewardConfig = {
                skill: [900, 150, 75],
                career: [1250, 250, 150]
            };

            const rewardArray = rewardConfig[payment.courseType];
            if (!rewardArray) {
                return res.status(400).json({ error: 'Invalid courseType for reward distribution' });
            }

            let currentUser = user;

            for (let level = 1; level <= 3; level++) {
                if (!currentUser.referredBy) break;

                const referrer = await User.findById(currentUser.referredBy);
                if (!referrer) break;

                const levelKey = `level${level}`;
                if (!referrer.referralLevels) referrer.referralLevels = {};
                if (!referrer.referralLevels[levelKey]) referrer.referralLevels[levelKey] = [];

                if (!referrer.referralLevels[levelKey].includes(user._id)) {
                    referrer.referralLevels[levelKey].push(user._id);
                }

                const rewardAmount = rewardArray[level - 1];

                if (typeof rewardAmount === 'number') {
                    referrer.wallet.balance += rewardAmount;
                    referrer.wallet.totalEarned += rewardAmount;

                    // Push price history
                    referrer.priceHistory = referrer.priceHistory || [];
                    referrer.priceHistory.push({
                        amount: rewardAmount,
                        courseType: payment.courseType,
                        purchasedDate: new Date(),
                        purchasedBy: user._id
                    });
                }

                await referrer.save();

                if (!user.referredLevel) {
                    user.referredLevel = level;
                }

                currentUser = referrer;
            }

            await user.save();

            // Final payment status update
            payment.status = 'approved';
            payment.verifiedAt = new Date();
            payment.adminNote = adminNote;

        } else if (status === 'rejected') {
            payment.status = 'rejected';
            payment.adminNote = adminNote;
        } else {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        await payment.save();

        return res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            updatedPayment: payment,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong while verifying payment' });
    }
};

const checkPaymentStatus = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        const existingPayment = await PaymentRequestSchema.findOne({
            user: userId,
            course: courseId,
        });

        if (!existingPayment) {
            return res.status(200).json({
                status: 'not_found',
                message: 'No payment found for this course.'
            });
        }

        if (existingPayment.status === 'pending') {
            return res.status(200).json({
                status: 'pending',
                message: 'Payment is already pending for this course.'
            });
        }

        return res.status(200).json({
            status: existingPayment.status, // 'approved' or 'rejected'
            message: `Payment was already ${existingPayment.status} for this course.`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while checking payment status.' });
    }
};

const checkIfUserHasPendingPayment = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all payments by this user sorted by creation date
        const allPayments = await PaymentRequestSchema.find({ user: userId }).sort({ createdAt: 1 });

        // If user has never made any payments
        if (!allPayments.length) {
            return res.status(200).json({
                canPurchase: true,
                message: 'No payments found. You can proceed to purchase.'
            });
        }

        // Find the first payment
        const firstPayment = allPayments[0];

        // If the first ever payment is still pending, block new purchase
        if (firstPayment.status === 'pending') {
            return res.status(200).json({
                canPurchase: false,
                message: 'Your first payment is still pending. Please wait for it to be verified before making another purchase.'
            });
        }

        // Otherwise, allow purchase even if other payments are pending
        return res.status(200).json({
            canPurchase: true,
            message: 'You can proceed to purchase.'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error while checking pending payments.'
        });
    }
};


module.exports = {
    paymentSubmit,
    paymentRequest,
    paymentVerify,
    checkPaymentStatus,
    checkIfUserHasPendingPayment
}